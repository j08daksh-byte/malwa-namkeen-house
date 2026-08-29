import { Router } from 'express';
import type { Response } from 'express';
import mongoose from 'mongoose';
import { User, type IUserAddress } from '../models/User.ts';
import { Product } from '../models/Product.ts';
import { Order, type IOrderItem, type IShippingAddress } from '../models/Order.ts';
import { Discount } from '../models/Discount.ts';
import { StoreSettings } from '../models/StoreSettings.ts';
import { validateAndCalculateDiscount } from '../lib/discounts.ts';
import { requireAuth, type AuthenticatedRequest } from '../lib/auth.ts';
import { sendCustomerOrderConfirmation, sendNewOrderAdminAlert } from '../lib/emailService.ts';

const router = Router();

// In-memory idempotency cache to prevent rapid duplicate double-click submissions (5-minute TTL)
const recentSubmissions = new Map<string, { timestamp: number; orderId: string }>();

function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `MN-${dateStr}-${randomSuffix}`;
}

/**
 * POST /api/orders
 * Protected customer order creation endpoint.
 * Validates inventory, prices, discounts, and shipping server-side.
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

      const qty = Math.max(1, parseInt(String(item.quantity), 10) || 1);
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
        '/mishtichaat/chaat-plate.jpg';

      const variantLabel = variant.label || `${variant.value || ''} ${variant.unit || ''}`.trim() || 'Standard';

      orderItems.push({
        productId: product._id,
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

    // Record submission key in idempotency cache
    if (idempotencyKey) {
      recentSubmissions.set(idempotencyKey, {
        timestamp: Date.now(),
        orderId: newOrder._id.toString(),
      });
    }

    // Asynchronous non-blocking email notifications
    (async () => {
      try {
        // 1. Customer Confirmation Email
        await sendCustomerOrderConfirmation({ order: newOrder });

        // 2. Active Admin Alerts
        const activeAdmins = await User.find({
          role: { $in: ['admin', 'super_admin'] },
          active: true,
        }).select('email').lean();

        const adminEmails = activeAdmins.map(a => a.email).filter(Boolean);
        if (adminEmails.length > 0) {
          await sendNewOrderAdminAlert({ order: newOrder, adminEmails });
        }
      } catch (notifyErr) {
        console.warn('[Order Notification Warning] Failed to dispatch order emails:', notifyErr);
      }
    })();

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
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

export default router;
