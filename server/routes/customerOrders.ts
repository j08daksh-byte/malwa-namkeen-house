import { Router } from 'express';
import type { Response } from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { User, type IUserAddress } from '../models/User.ts';
import { Product } from '../models/Product.ts';
import { Order, type IOrderItem, type IShippingAddress } from '../models/Order.ts';
import { Discount } from '../models/Discount.ts';
import { StoreSettings } from '../models/StoreSettings.ts';
import { validateAndCalculateDiscount } from '../lib/discounts.ts';
import { requireAuth, type AuthenticatedRequest } from '../lib/auth.ts';
import { sendCustomerOrderConfirmation, sendNewOrderAdminAlert } from '../lib/emailService.ts';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  getPublicRazorpayKeyId,
} from '../lib/razorpayService.ts';
import { cancelAndRestockOrder } from '../lib/orderRestoration.ts';

const router = Router();

// In-memory idempotency cache to prevent rapid duplicate double-click submissions (5-minute TTL)
const recentSubmissions = new Map<string, { timestamp: number; orderId: string }>();

// Passive cleanup function to prevent memory leak of expired idempotency keys
function cleanupRecentSubmissions() {
  const now = Date.now();
  for (const [key, value] of recentSubmissions.entries()) {
    if (now - value.timestamp >= 300000) {
      recentSubmissions.delete(key);
    }
  }
}

function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `MN-${dateStr}-${randomSuffix}`;
}

/**
 * Rate limiter for order creation.
 * Keyed by authenticated user ID (fallback to IP).
 * Threshold: 5 requests per 15-minute window.
 * Rationale: 5 genuine distinct orders per 15 mins is extremely generous for a single user,
 * preventing junk-order flooding without impacting legitimate shopping behavior.
 * Skips counting legitimate idempotent retries (where order is already cached).
 * NOTE: Uses in-memory MemoryStore (PH-016 limitation applies).
 */
const orderCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false, keyGeneratorIpFallback: false },
  keyGenerator: (req: any) => {
    // Key by user ID since this is an authenticated route
    return req.user?.userId ? `user_${req.user.userId}` : (req.ip || '127.0.0.1');
  },
  skip: (req: any) => {
    // Do not count legitimate idempotent retries against the rate limit
    const idempotencyKey = req.body?.idempotencyKey;
    if (idempotencyKey && typeof idempotencyKey === 'string') {
      const cached = recentSubmissions.get(idempotencyKey);
      if (cached && Date.now() - cached.timestamp < 300000) {
        return true; // Skip limiting for exact retries
      }
    }
    return false;
  },
  message: {
    success: false,
    message: 'Too many orders placed recently. Please try again after 15 minutes.',
  },
});

/**
 * POST /api/orders
 * Protected customer order creation endpoint.
 * Validates inventory, prices, discounts, and shipping server-side.
 * Rate-limited: 5 requests per 15 minutes per customer (PH-003 fix).
 */
router.post('/', requireAuth, orderCreationLimiter, async (req: AuthenticatedRequest, res: Response) => {
  let appliedDiscountCode = '';
  const reservedStockUpdates: Array<{ productId: any; variantId: any; decrement: number }> = [];

  try {
    const {
      items = [],
      shippingAddress,
      saveAddressToBook = false,
      couponCode = '',
      paymentMethod = 'cod',
      notes = '',
      idempotencyKey = '',
    } = req.body;

    // Check duplicate submission
    if (idempotencyKey && typeof idempotencyKey === 'string') {
      const cached = recentSubmissions.get(idempotencyKey);
      if (cached && Date.now() - cached.timestamp < 300000) {
        const existingOrder = await Order.findById(cached.orderId).lean();
        if (existingOrder) {
          res.json({
            success: true,
            order: existingOrder,
            isDuplicateReplay: true,
          });
          return;
        }
      }
    }

    // 1. Verify User
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(401).json({
        success: false,
        message: 'Your account is inactive or session is invalid. Please sign in again.',
      });
      return;
    }

    // PH-020: Pending Order / COD Abuse Protection
    // Check if the user already has 3 or more pending orders
    const pendingOrderCount = await Order.countDocuments({
      customer: user._id,
      orderStatus: 'pending'
    });
    
    if (pendingOrderCount >= 3) {
      res.status(400).json({
        success: false,
        message: 'You have too many pending orders. Please wait for them to be processed or contact support.',
      });
      return;
    }

    // 2. Validate Items
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Your cart is empty. Please add items to checkout.',
      });
      return;
    }

    // 3. Validate Shipping Address
    if (
      !shippingAddress ||
      typeof shippingAddress !== 'object' ||
      !shippingAddress.name?.trim() ||
      !shippingAddress.phone?.trim() ||
      !shippingAddress.addressLine1?.trim() ||
      !shippingAddress.city?.trim() ||
      !shippingAddress.state?.trim() ||
      !shippingAddress.pincode?.trim()
    ) {
      res.status(400).json({
        success: false,
        message: 'Please provide a complete delivery address with PIN code and phone.',
      });
      return;
    }

    if (!/^\d{6}$/.test(String(shippingAddress.pincode).trim())) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit Indian PIN code.',
      });
      return;
    }

    // 4. Fetch Products & Variants from Database
    const productIds = [
      ...new Set(
        items.map((it: any) => it.productId).filter((id: any) => mongoose.Types.ObjectId.isValid(id))
      ),
    ];

    const products = await Product.find({
      _id: { $in: productIds },
      active: true,
    }).lean();

    const productMap = new Map<string, any>(products.map(p => [String(p._id), p]));

    const orderItems: IOrderItem[] = [];
    const stockUpdates: Array<{ productId: any; variantId: any; decrement: number; productName: string; variantLabel: string }> = [];

    for (const item of items) {
      const product = productMap.get(String(item.productId));
      if (!product) {
        res.status(400).json({
          success: false,
          message: `Item in cart is no longer active or available.`,
        });
        return;
      }

      // Match Variant
      let variant: any = null;
      if (Array.isArray(product.variants)) {
        if (item.variantId) {
          variant = product.variants.find(
            (v: any) => String(v._id) === String(item.variantId) && v.active !== false
          );
        }
        if (!variant && item.sku) {
          variant = product.variants.find((v: any) => v.sku === item.sku && v.active !== false);
        }
        if (!variant && item.weight) {
          variant = product.variants.find(
            (v: any) =>
              (v.label === item.weight || `${v.value || ''} ${v.unit || ''}`.trim() === item.weight) &&
              v.active !== false
          );
        }
        if (!variant && product.variants.length > 0) {
          variant = product.variants.find((v: any) => v.active !== false) || product.variants[0];
        }
      }

      if (!variant) {
        res.status(400).json({
          success: false,
          message: `Packaging for "${product.name}" is currently unavailable.`,
        });
        return;
      }

      const rawQty = parseInt(String(item.quantity), 10);
      if (isNaN(rawQty) || rawQty <= 0 || !Number.isInteger(Number(item.quantity))) {
        res.status(400).json({
          success: false,
          message: `Invalid quantity for "${product.name}". Quantity must be a positive whole number.`,
        });
        return;
      }
      const qty = rawQty;
      const stock = typeof variant.stock === 'number' ? variant.stock : 100;

      if (stock < qty) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name} (${variant.label || 'Standard'})". Available: ${stock}.`,
        });
        return;
      }

      const unitPrice =
        typeof variant.salePrice === 'number' && variant.salePrice > 0
          ? variant.salePrice
          : variant.price;

      const primaryImage =
        (Array.isArray(product.images) && product.images[0]) ||
        product.image ||
        '/hero-banner-1.png';

      const variantLabel = variant.label || `${variant.value || ''} ${variant.unit || ''}`.trim() || 'Standard';

      orderItems.push({
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        variantLabel,
        sku: variant.sku || '',
        price: unitPrice,
        quantity: qty,
        itemTotal: Math.round(unitPrice * qty * 100) / 100,
        image: primaryImage,
      });

      stockUpdates.push({
        productId: product._id,
        variantId: variant._id,
        decrement: qty,
        productName: product.name,
        variantLabel,
      });
    }

    // 5. Calculate Subtotal, Dynamic Shipping, and Coupon Discount
    const subtotal = Math.round(orderItems.reduce((sum, it) => sum + it.itemTotal, 0) * 100) / 100;

    // Load store delivery settings
    const storeSettings = await StoreSettings.findOne().lean();
    const minOrder = storeSettings?.deliverySettings?.minOrderValue ?? 0;
    if (minOrder > 0 && subtotal < minOrder) {
      res.status(400).json({
        success: false,
        message: `Minimum order subtotal for delivery is ₹${minOrder}.`,
      });
      return;
    }

    const freeThreshold = storeSettings?.deliverySettings?.freeShippingThreshold ?? 499;
    const standardFee = storeSettings?.deliverySettings?.standardShippingFee ?? 49;
    const shipping = subtotal >= freeThreshold ? 0 : standardFee;

    let discountAmount = 0;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const discountCalc = await validateAndCalculateDiscount(couponCode.trim(), subtotal, orderItems);
      if (!discountCalc.valid || !discountCalc.discount) {
        res.status(400).json({
          success: false,
          message: discountCalc.message || 'Invalid or expired coupon code.',
        });
        return;
      }

      // Atomic conditional increment with usageLimit concurrency guard
      const discountId = discountCalc.discount._id;
      const updatedDiscount = await Discount.findOneAndUpdate(
        {
          _id: discountId,
          active: true,
          $or: [
            { usageLimit: { $exists: false } },
            { usageLimit: null },
            { usageLimit: 0 },
            { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
          ],
        },
        { $inc: { usedCount: 1 } },
        { returnDocument: 'after' }
      );

      if (!updatedDiscount) {
        res.status(400).json({
          success: false,
          message: `Coupon code "${discountCalc.code}" has just reached its maximum redemption limit.`,
        });
        return;
      }

      discountAmount = discountCalc.discountAmount;
      appliedDiscountCode = updatedDiscount.code;
    }

    const finalTotal = Math.max(0, Math.round((subtotal - discountAmount + shipping) * 100) / 100);

    // 6. Generate Unique Order Number
    let orderNumber = generateOrderNumber();
    let collisionCheck = await Order.findOne({ orderNumber });
    while (collisionCheck) {
      orderNumber = generateOrderNumber();
      collisionCheck = await Order.findOne({ orderNumber });
    }

    // 7. Structure Clean Address Snapshot
    const cleanShippingAddress: IShippingAddress = {
      name: shippingAddress.name.trim(),
      phone: shippingAddress.phone.trim(),
      addressLine1: shippingAddress.addressLine1.trim(),
      addressLine2: shippingAddress.addressLine2 ? String(shippingAddress.addressLine2).trim() : '',
      city: shippingAddress.city.trim(),
      state: shippingAddress.state.trim(),
      pincode: shippingAddress.pincode.trim(),
      landmark: shippingAddress.landmark ? String(shippingAddress.landmark).trim() : '',
    };

    // 8. Save Address to User Address Book if requested
    if (saveAddressToBook) {
      const existsInBook = (user.addresses || []).some(
        a =>
          a.addressLine1 === cleanShippingAddress.addressLine1 &&
          a.pincode === cleanShippingAddress.pincode
      );
      if (!existsInBook) {
        user.addresses = user.addresses || [];
        user.addresses.push({
          ...cleanShippingAddress,
          isDefault: user.addresses.length === 0,
        } as IUserAddress);
        await user.save();
      }
    }

    // 9. Atomic Inventory Stock Reservation (guarantees stock >= decrement)
    let stockFailure = false;
    let failedItemName = '';

    for (let i = 0; i < stockUpdates.length; i++) {
      const update = stockUpdates[i];
      if (update.variantId) {
        const updateResult = await Product.updateOne(
          {
            _id: update.productId,
            variants: {
              $elemMatch: {
                _id: update.variantId,
                stock: { $gte: update.decrement },
              },
            },
          },
          { $inc: { 'variants.$.stock': -update.decrement } }
        );

        if (updateResult.matchedCount === 0 || updateResult.modifiedCount === 0) {
          stockFailure = true;
          failedItemName = `${update.productName} (${update.variantLabel})`;
          break;
        }

        reservedStockUpdates.push({
          productId: update.productId,
          variantId: update.variantId,
          decrement: update.decrement,
        });
      }
    }

    if (stockFailure) {
      // Rollback any successfully decremented stocks
      for (const resv of reservedStockUpdates) {
        await Product.updateOne(
          { _id: resv.productId, 'variants._id': resv.variantId },
          { $inc: { 'variants.$.stock': resv.decrement } }
        );
      }

      // Rollback coupon if incremented
      if (appliedDiscountCode) {
        await Discount.updateOne(
          { code: appliedDiscountCode },
          { $inc: { usedCount: -1 } }
        );
      }

      res.status(400).json({
        success: false,
        message: `Insufficient stock for "${failedItemName}". It may have just been ordered by another customer.`,
      });
      return;
    }

    // 10. Create Order in MongoDB
    let newOrder;
    try {
      newOrder = await Order.create({
        orderNumber,
        customer: user._id,
        customerInfo: {
          name: user.name || cleanShippingAddress.name,
          email: user.email,
          phone: cleanShippingAddress.phone || user.phone || '',
        },
        items: orderItems,
        subtotal,
        discount: discountAmount,
        discountCode: appliedDiscountCode,
        shipping,
        total: finalTotal,
        shippingAddress: cleanShippingAddress,
        orderStatus: 'pending',
        paymentStatus: 'pending',
        paymentMethod: ['cod', 'online', 'upi', 'card'].includes(paymentMethod)
          ? paymentMethod
          : 'cod',
        shipmentStatus: 'unfulfilled',
        notes: typeof notes === 'string' ? notes.trim() : '',
      });
    } catch (orderCreateErr) {
      // Rollback stocks and coupon
      for (const resv of reservedStockUpdates) {
        await Product.updateOne(
          { _id: resv.productId, 'variants._id': resv.variantId },
          { $inc: { 'variants.$.stock': resv.decrement } }
        );
      }
      if (appliedDiscountCode) {
        await Discount.updateOne(
          { code: appliedDiscountCode },
          { $inc: { usedCount: -1 } }
        );
      }
      throw orderCreateErr;
    }

    // 11. Payment Gateway Handshake (For online / upi / card orders with finalTotal > 0)
    let razorpayPayload: any = null;
    const isOnlinePayment = ['online', 'upi', 'card'].includes(newOrder.paymentMethod);

    if (isOnlinePayment && newOrder.total > 0) {
      const rzpRes = await createRazorpayOrder({
        amount: Math.round(newOrder.total * 100),
        currency: 'INR',
        receipt: newOrder.orderNumber,
        notes: {
          orderId: newOrder._id.toString(),
          orderNumber: newOrder.orderNumber,
          customerEmail: newOrder.customerInfo.email,
        },
      });

      if (!rzpRes.success || !rzpRes.data) {
        // Rollback stocks and coupon and remove the order
        for (const resv of reservedStockUpdates) {
          try {
            await Product.updateOne(
              { _id: resv.productId, 'variants._id': resv.variantId },
              { $inc: { 'variants.$.stock': resv.decrement } }
            );
          } catch {}
        }
        if (appliedDiscountCode) {
          try {
            await Discount.updateOne(
              { code: appliedDiscountCode },
              { $inc: { usedCount: -1 } }
            );
          } catch {}
        }
        try {
          await Order.findByIdAndDelete(newOrder._id);
        } catch {}

        res.status(502).json({
          success: false,
          message: rzpRes.error || 'Failed to initialize payment gateway. Please choose Cash on Delivery or try again later.',
        });
        return;
      }

      newOrder.paymentDetails = {
        gateway: 'razorpay',
        razorpayOrderId: rzpRes.data.id,
      };
      await newOrder.save();

      razorpayPayload = {
        keyId: getPublicRazorpayKeyId(),
        orderId: rzpRes.data.id,
        amount: rzpRes.data.amount,
        currency: rzpRes.data.currency,
        name: 'Malwa Namkeen House',
        description: `Order #${newOrder.orderNumber}`,
        prefill: {
          name: user.name || cleanShippingAddress.name,
          email: user.email,
          contact: cleanShippingAddress.phone || user.phone || '',
        },
      };
    } else if (isOnlinePayment && newOrder.total === 0) {
      // 100% discounted order - automatically mark paid
      newOrder.paymentStatus = 'paid';
      newOrder.orderStatus = 'confirmed';
      newOrder.paymentDetails = {
        gateway: 'promo',
        paidAt: new Date(),
      };
      await newOrder.save();
    }

    // Record submission key in idempotency cache
    if (idempotencyKey) {
      cleanupRecentSubmissions();
      recentSubmissions.set(idempotencyKey, {
        timestamp: Date.now(),
        orderId: newOrder._id.toString(),
      });
    }

    // Only dispatch confirmation email immediately for COD or zero-total orders
    // For pending online payment orders, email is dispatched upon payment verification
    if (newOrder.paymentMethod === 'cod' || newOrder.paymentStatus === 'paid') {
      dispatchOrderConfirmationEmails(newOrder);
    }

    res.status(201).json({
      success: true,
      message: isOnlinePayment && newOrder.total > 0
        ? 'Order initialized. Please complete payment.'
        : 'Order created successfully.',
      order: {
        _id: newOrder._id.toString(),
        orderNumber: newOrder.orderNumber,
        subtotal: newOrder.subtotal,
        discount: newOrder.discount,
        discountCode: newOrder.discountCode,
        shipping: newOrder.shipping,
        total: newOrder.total,
        items: newOrder.items,
        shippingAddress: newOrder.shippingAddress,
        orderStatus: newOrder.orderStatus,
        paymentStatus: newOrder.paymentStatus,
        paymentMethod: newOrder.paymentMethod,
        shipmentStatus: newOrder.shipmentStatus,
        createdAt: newOrder.createdAt,
      },
      ...(razorpayPayload ? { razorpay: razorpayPayload } : {}),
    });
  } catch (err: unknown) {
    console.error('[Create Order Error]', err);

    // Rollback any reserved stock updates if not already handled
    for (const resv of reservedStockUpdates) {
      try {
        await Product.updateOne(
          { _id: resv.productId, 'variants._id': resv.variantId },
          { $inc: { 'variants.$.stock': resv.decrement } }
        );
      } catch {}
    }

    if (appliedDiscountCode) {
      try {
        await Discount.updateOne(
          { code: appliedDiscountCode },
          { $inc: { usedCount: -1 } }
        );
      } catch {}
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process order. Please try again.',
    });
  }
});

// Helper: Dispatches order confirmation and admin alert emails non-blockingly
export async function dispatchOrderConfirmationEmails(order: any) {
  try {
    await sendCustomerOrderConfirmation({ order });

    const activeAdmins = await User.find({
      role: { $in: ['admin', 'super_admin'] },
      active: true,
    }).select('email').lean();

    const configuredAdmin = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
    const adminEmails = [
      ...activeAdmins.map(a => a.email),
      ...(configuredAdmin ? [configuredAdmin] : []),
    ].filter(Boolean);

    if (adminEmails.length > 0) {
      await sendNewOrderAdminAlert({ order, adminEmails });
    }
  } catch (notifyErr) {
    console.warn('[Order Notification Warning] Failed to dispatch order emails:', notifyErr);
  }
}

/**
 * POST /api/orders/verify-payment
 * Cryptographically verifies Razorpay payment signature and transitions order to 'paid' and 'confirmed'.
 */
export async function handleVerifyPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};

    if (
      !orderId ||
      typeof orderId !== 'string' ||
      !razorpayOrderId ||
      typeof razorpayOrderId !== 'string' ||
      !razorpayPaymentId ||
      typeof razorpayPaymentId !== 'string' ||
      !razorpaySignature ||
      typeof razorpaySignature !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message: 'Missing or invalid payment verification parameters.',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid order ID format.',
      });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
      return;
    }

    // Customer ownership verification (or admin)
    const isOwner =
      order.customer?.toString() === req.user?.userId ||
      req.user?.role === 'admin' ||
      req.user?.role === 'super_admin';

    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to verify payment for this order.',
      });
      return;
    }

    // If order was already marked paid (e.g. by fast webhook), return success idempotently
    if (order.paymentStatus === 'paid') {
      res.json({
        success: true,
        message: 'Payment has already been verified and recorded.',
        order,
      });
      return;
    }

    // Cancelled orders cannot be paid (inventory was already restored!)
    if (order.orderStatus === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Cannot verify payment for a cancelled order. Reserved inventory was already restored.',
      });
      return;
    }

    // Online payment method verification
    if (!['online', 'upi', 'card'].includes(order.paymentMethod)) {
      res.status(400).json({
        success: false,
        message: 'Payment verification is only permitted for online orders.',
      });
      return;
    }

    // Order ID association check: order must have an active server-generated Razorpay order ID
    if (!order.paymentDetails?.razorpayOrderId) {
      res.status(400).json({
        success: false,
        message: 'No Razorpay order ID is associated with this order record.',
      });
      return;
    }

    if (order.paymentDetails.razorpayOrderId !== razorpayOrderId.trim()) {
      res.status(400).json({
        success: false,
        message: 'Razorpay order ID does not match the order record.',
      });
      return;
    }

    // Replay attack prevention: paymentId must not be credited to any other order
    const duplicatePayment = await Order.findOne({
      _id: { $ne: order._id },
      'paymentDetails.razorpayPaymentId': razorpayPaymentId.trim(),
    }).lean();

    if (duplicatePayment) {
      console.warn(`[Security Alert] Replay attack: paymentId ${razorpayPaymentId.trim()} already credited to order ${duplicatePayment.orderNumber}`);
      res.status(400).json({
        success: false,
        message: 'Payment ID has already been credited to another order.',
      });
      return;
    }

    // Cryptographic signature check
    const isValidSignature = verifyPaymentSignature({
      razorpayOrderId: razorpayOrderId.trim(),
      razorpayPaymentId: razorpayPaymentId.trim(),
      razorpaySignature: razorpaySignature.trim(),
    });

    if (!isValidSignature) {
      console.warn(`[Security Alert] Invalid payment signature attempt for order ${order.orderNumber}`);
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Payment could not be verified.',
      });
      return;
    }

    // Atomic update to transition to paid
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        paymentStatus: { $ne: 'paid' },
        orderStatus: { $ne: 'cancelled' },
      },
      {
        $set: {
          paymentStatus: 'paid',
          orderStatus: 'confirmed',
          'paymentDetails.gateway': 'razorpay',
          'paymentDetails.transactionId': razorpayPaymentId.trim(),
          'paymentDetails.razorpayPaymentId': razorpayPaymentId.trim(),
          'paymentDetails.razorpaySignature': razorpaySignature.trim(),
          'paymentDetails.paidAt': new Date(),
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      // Re-fetch to see if concurrent request already completed payment
      const current = await Order.findById(order._id);
      if (current?.paymentStatus === 'paid') {
        res.json({
          success: true,
          message: 'Payment already verified.',
          order: current,
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: 'Unable to update order payment state.',
      });
      return;
    }

    // Dispatch confirmation email non-blockingly
    dispatchOrderConfirmationEmails(updatedOrder);

    res.json({
      success: true,
      message: 'Payment verified successfully.',
      order: updatedOrder,
    });
  } catch (err: unknown) {
    console.error('[Payment Verification Error]:', err);
    res.status(500).json({
      success: false,
      message: 'An error occurred during payment verification.',
    });
  }
}
router.post('/verify-payment', requireAuth, handleVerifyPayment);

/**
 * POST /api/orders/webhook/razorpay
 * Idempotent Razorpay webhook listener for payment.captured, order.paid, and payment.failed.
 */
export async function handleRazorpayWebhook(req: any, res: Response) {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (!signature || !verifyWebhookSignature({ rawBody, signature })) {
      console.warn('[Razorpay Webhook Warning] Invalid webhook signature received.');
      res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
      return;
    }

    const event = req.body?.event;
    const eventId = (req.headers['x-razorpay-event-id'] as string) || req.body?.id || '';

    // Idempotency check: if this webhook event was already recorded, return 200 immediately
    if (eventId) {
      const alreadyHandled = await Order.findOne({ processedWebhookEvents: eventId }).lean();
      if (alreadyHandled) {
        res.json({
          success: true,
          message: 'Webhook event already processed.',
          alreadyProcessed: true,
        });
        return;
      }
    }

    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = req.body?.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id || req.body?.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (!rzpOrderId) {
        res.status(400).json({ success: false, message: 'Missing order_id in webhook payload.' });
        return;
      }

      // Find order by razorpayOrderId or note orderId
      const order = await Order.findOne({
        $or: [
          { 'paymentDetails.razorpayOrderId': rzpOrderId },
          ...(paymentEntity?.notes?.orderId && mongoose.Types.ObjectId.isValid(paymentEntity.notes.orderId)
            ? [{ _id: paymentEntity.notes.orderId }]
            : []),
        ],
      });

      if (!order) {
        console.warn(`[Razorpay Webhook Warning] No order found for Razorpay order ID ${rzpOrderId}.`);
        res.status(200).json({ success: true, message: 'Order not found, ignored.' });
        return;
      }

      // Security check: amount and currency verification
      const expectedAmount = Math.round(order.total * 100);
      if (paymentEntity?.amount !== expectedAmount || paymentEntity?.currency !== 'INR') {
        console.error(
          `[Razorpay Security Alert] Webhook amount mismatch for order ${order.orderNumber}. Expected: ${expectedAmount} INR, Received: ${paymentEntity?.amount} ${paymentEntity?.currency}`
        );
        res.status(400).json({
          success: false,
          message: 'Payment amount or currency mismatch.',
        });
        return;
      }

      // Check if order was already cancelled
      if (order.orderStatus === 'cancelled') {
        console.warn(
          `[Razorpay Webhook Warning] Received captured payment for cancelled order ${order.orderNumber}. Merchant review required.`
        );
        if (eventId) {
          await Order.updateOne({ _id: order._id }, { $addToSet: { processedWebhookEvents: eventId } });
        }
        res.status(200).json({ success: true, message: 'Order was previously cancelled.' });
        return;
      }

      // Atomic transition to paid if not already paid
      const updated = await Order.findOneAndUpdate(
        {
          _id: order._id,
          paymentStatus: { $ne: 'paid' },
          orderStatus: { $ne: 'cancelled' },
        },
        {
          $set: {
            paymentStatus: 'paid',
            orderStatus: 'confirmed',
            'paymentDetails.gateway': 'razorpay',
            'paymentDetails.transactionId': paymentId,
            'paymentDetails.razorpayPaymentId': paymentId,
            'paymentDetails.webhookEventId': eventId,
            'paymentDetails.paidAt': new Date(),
          },
          ...(eventId ? { $addToSet: { processedWebhookEvents: eventId } } : {}),
        },
        { new: true }
      );

      if (updated) {
        dispatchOrderConfirmationEmails(updated);
      } else if (eventId) {
        await Order.updateOne({ _id: order._id }, { $addToSet: { processedWebhookEvents: eventId } });
      }

      res.json({ success: true, message: 'Payment recorded successfully.' });
      return;
    }

    if (event === 'payment.failed') {
      const paymentEntity = req.body?.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      const failureReason = paymentEntity?.error_description || paymentEntity?.error_code || 'Payment failed';

      if (rzpOrderId || paymentEntity?.notes?.orderId) {
        const order = await Order.findOne({
          $or: [
            ...(rzpOrderId ? [{ 'paymentDetails.razorpayOrderId': rzpOrderId }] : []),
            ...(paymentEntity?.notes?.orderId && mongoose.Types.ObjectId.isValid(paymentEntity.notes.orderId)
              ? [{ _id: paymentEntity.notes.orderId }]
              : []),
          ],
        });
        if (order && order.paymentStatus !== 'paid' && order.orderStatus !== 'cancelled') {
          await Order.updateOne(
            { _id: order._id },
            {
              $set: { 'paymentDetails.failureReason': failureReason },
              ...(eventId ? { $addToSet: { processedWebhookEvents: eventId } } : {}),
            }
          );
        }
      }

      res.json({ success: true, message: 'Payment failure recorded.' });
      return;
    }

    // Default for other events
    res.json({ success: true, message: `Event ${event} acknowledged.` });
  } catch (err: unknown) {
    console.error('[Razorpay Webhook Error]:', err);
    res.status(500).json({ success: false, message: 'Webhook processing error.' });
  }
}
router.post('/webhook/razorpay', handleRazorpayWebhook);
router.post('/webhook', handleRazorpayWebhook);

/**
 * POST /api/orders/:orderId/retry-payment
 * Allows customer to generate a fresh Razorpay order for an unpaid, un-cancelled order.
 */
export async function handleRetryPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ success: false, message: 'Invalid order ID format.' });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    const isOwner =
      order.customer?.toString() === req.user?.userId ||
      req.user?.role === 'admin' ||
      req.user?.role === 'super_admin';

    if (!isOwner) {
      res.status(403).json({ success: false, message: 'Not authorized.' });
      return;
    }

    if (order.paymentStatus === 'paid') {
      res.status(400).json({ success: false, message: 'This order is already paid.' });
      return;
    }

    if (order.orderStatus === 'cancelled') {
      res.status(400).json({ success: false, message: 'Cannot retry payment for a cancelled order.' });
      return;
    }

    if (order.total <= 0) {
      res.status(400).json({ success: false, message: 'Order total is zero; no payment required.' });
      return;
    }

    const rzpRes = await createRazorpayOrder({
      amount: Math.round(order.total * 100),
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerEmail: order.customerInfo.email,
      },
    });

    if (!rzpRes.success || !rzpRes.data) {
      res.status(502).json({
        success: false,
        message: rzpRes.error || 'Failed to initialize payment gateway retry.',
      });
      return;
    }

    order.paymentDetails = {
      ...(order.paymentDetails || {}),
      gateway: 'razorpay',
      razorpayOrderId: rzpRes.data.id,
    };
    if (order.paymentMethod === 'cod') {
      order.paymentMethod = 'online';
    }
    await order.save();

    res.json({
      success: true,
      message: 'Payment retry initialized.',
      razorpay: {
        keyId: getPublicRazorpayKeyId(),
        orderId: rzpRes.data.id,
        amount: rzpRes.data.amount,
        currency: rzpRes.data.currency,
        name: 'Malwa Namkeen House',
        description: `Order #${order.orderNumber}`,
        prefill: {
          name: order.customerInfo.name,
          email: order.customerInfo.email,
          contact: order.customerInfo.phone,
        },
      },
    });
  } catch (err: unknown) {
    console.error('[Retry Payment Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retry payment.' });
  }
}
router.post('/:orderId/retry-payment', requireAuth, handleRetryPayment);

/**
 * POST /api/orders/:orderId/cancel-unpaid
 * Allows customer to abandon/cancel an unpaid order and immediately release reserved inventory.
 */
export async function handleCancelUnpaid(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ success: false, message: 'Invalid order ID format.' });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    const isOwner =
      order.customer?.toString() === req.user?.userId ||
      req.user?.role === 'admin' ||
      req.user?.role === 'super_admin';

    if (!isOwner) {
      res.status(403).json({ success: false, message: 'Not authorized.' });
      return;
    }

    if (order.paymentStatus === 'paid') {
      res.status(400).json({
        success: false,
        message: 'Paid orders cannot be cancelled through this endpoint.',
      });
      return;
    }

    if (order.orderStatus === 'cancelled') {
      res.json({
        success: true,
        message: 'Order was already cancelled and inventory restored.',
        order,
      });
      return;
    }

    const result = await cancelAndRestockOrder(order._id, {
      cancelledBy: 'customer',
      reason: req.body?.reason || 'Customer cancelled unpaid checkout',
      allowedCurrentStatuses: ['pending'],
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Unpaid order cancelled and reserved inventory restored to stock.',
      order: result.order,
    });
  } catch (err: unknown) {
    console.error('[Cancel Unpaid Order Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel unpaid order.' });
  }
}
router.post('/:orderId/cancel-unpaid', requireAuth, handleCancelUnpaid);

/**
 * POST /api/orders/:orderId/cancel
 * Allows an authenticated customer to cancel their own pending, unfulfilled order.
 * Automatically and idempotently restores reserved variant stock and rolls back coupon usage.
 */
router.post('/:orderId/cancel', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { reason = 'Cancelled by customer' } = req.body || {};

    const query: any = mongoose.Types.ObjectId.isValid(orderId)
      ? { _id: orderId }
      : { orderNumber: orderId };

    const order = await Order.findOne(query);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    const isOwner =
      (order.customer && order.customer.toString() === req.user?.userId) ||
      (!order.customer && order.customerInfo?.email && req.user?.email && order.customerInfo.email.toLowerCase() === req.user.email.toLowerCase()) ||
      req.user?.role === 'admin' ||
      req.user?.role === 'super_admin';

    if (!isOwner) {
      res.status(403).json({ success: false, message: 'You do not have permission to cancel this order.' });
      return;
    }

    if (order.orderStatus === 'cancelled' || order.inventoryRestored) {
      res.json({
        success: true,
        alreadyCancelled: true,
        message: 'This order is already cancelled.',
        order,
      });
      return;
    }

    if (order.orderStatus !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Orders that are already in "${order.orderStatus}" status cannot be cancelled online. Please contact support.`,
        order,
      });
      return;
    }

    if (order.shipmentStatus && order.shipmentStatus !== 'unfulfilled') {
      res.status(400).json({
        success: false,
        message: 'This order has already been prepared or dispatched for shipping and cannot be cancelled.',
        order,
      });
      return;
    }

    const cancelResult = await cancelAndRestockOrder(order._id, {
      cancelledBy: 'customer',
      reason: typeof reason === 'string' && reason.trim() ? reason.trim() : 'Cancelled by customer',
      allowedCurrentStatuses: ['pending'],
    });

    if (!cancelResult.success && !cancelResult.alreadyCancelled) {
      res.status(400).json({
        success: false,
        message: cancelResult.message || 'Failed to cancel order.',
        warnings: cancelResult.warnings,
      });
      return;
    }

    res.json({
      success: true,
      alreadyCancelled: Boolean(cancelResult.alreadyCancelled),
      message: cancelResult.alreadyCancelled
        ? 'This order is already cancelled.'
        : 'Your order has been cancelled successfully. Any reserved items have been returned to stock.',
      order: cancelResult.order || order,
    });
  } catch (err: unknown) {
    console.error('[Customer Order Cancel Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel order.' });
  }
});

export default router;
