import { Router } from 'express';
import type { Response } from 'express';
import mongoose from 'mongoose';
import { Order, type OrderStatus, type PaymentStatus, type ShipmentStatus } from '../models/Order.ts';
import { requireAdmin, type AuthenticatedRequest } from '../lib/auth.ts';
import { sendOrderStatusUpdate } from '../lib/emailService.ts';
import { cancelAndRestockOrder } from '../lib/orderRestoration.ts';

const router = Router();

// Protect all admin order endpoints
router.use(requireAdmin);

/**
 * GET /api/admin/orders
 * Supports filtering by search, orderStatus, paymentStatus, shipmentStatus, pagination and sorting.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search = '',
      orderStatus = 'all',
      paymentStatus = 'all',
      shipmentStatus = 'all',
      sortBy = 'newest',
      page = '1',
      limit = '25',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {};

    if (search.trim()) {
      const q = search.trim();
      filter.$or = [
        { orderNumber: { $regex: q, $options: 'i' } },
        { 'customerInfo.name': { $regex: q, $options: 'i' } },
        { 'customerInfo.email': { $regex: q, $options: 'i' } },
        { 'customerInfo.phone': { $regex: q, $options: 'i' } },
        { 'shippingAddress.city': { $regex: q, $options: 'i' } },
        { 'items.productName': { $regex: q, $options: 'i' } },
        { 'items.sku': { $regex: q, $options: 'i' } },
      ];
    }

    if (orderStatus && orderStatus !== 'all') {
      filter.orderStatus = orderStatus;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      filter.paymentStatus = paymentStatus;
    }

    if (shipmentStatus && shipmentStatus !== 'all') {
      filter.shipmentStatus = shipmentStatus;
    }

    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy === 'oldest') {
      sortObj = { createdAt: 1 };
    } else if (sortBy === 'totalHigh') {
      sortObj = { total: -1 };
    } else if (sortBy === 'totalLow') {
      sortObj = { total: 1 };
    }

    const [total, orders, statsAggregation] = await Promise.all([
      Order.countDocuments(filter).maxTimeMS(5000),
      Order.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .maxTimeMS(5000)
        .lean(),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0],
              },
            },
            totalOrders: { $sum: 1 },
            pendingOrders: {
              $sum: {
                $cond: [{ $in: ['$orderStatus', ['pending', 'confirmed', 'processing']] }, 1, 0],
              },
            },
            deliveredOrders: {
              $sum: {
                $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0],
              },
            },
          },
        },
      ]).option({ maxTimeMS: 5000 }),
    ]);

    const stats = statsAggregation[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      pendingOrders: 0,
      deliveredOrders: 0,
    };

    res.json({
      success: true,
      orders,
      stats,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err: unknown) {
    console.error('[Admin Orders List Error]', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
});

/**
 * GET /api/admin/orders/:id
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid order ID format.' });
      return;
    }

    const order = await Order.findById(id).populate('customer', 'name email phone').lean();
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    res.json({ success: true, order });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to retrieve order details.' });
  }
});

/**
 * PUT /api/admin/orders/:id
 * Update order status, payment status, shipment status, tracking info, shipping address, or notes.
 * When orderStatus is set to 'cancelled', atomically restores reserved inventory and coupon usage.
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid order ID.' });
      return;
    }

    const {
      orderStatus,
      paymentStatus,
      shipmentStatus,
      trackingInfo,
      shippingAddress,
      notes,
    } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    const previousStatus = order.orderStatus;
    let cancelResult: any = null;

    // Handle cancellation and inventory restoration
    if (orderStatus === 'cancelled') {
      const reason = typeof notes === 'string' && notes.trim()
        ? notes.trim()
        : 'Cancelled by administrator';

      cancelResult = await cancelAndRestockOrder(id, {
        cancelledBy: 'admin',
        reason,
      });

      if (!cancelResult.success && !cancelResult.alreadyCancelled) {
        res.status(400).json({
          success: false,
          message: cancelResult.message || 'Failed to cancel order.',
          warnings: cancelResult.warnings,
        });
        return;
      }

      // Re-fetch updated order document
      const refreshed = await Order.findById(id);
      if (refreshed) {
        order.orderStatus = refreshed.orderStatus;
        order.inventoryRestored = refreshed.inventoryRestored;
        order.couponRestored = refreshed.couponRestored;
        order.cancelledAt = refreshed.cancelledAt;
        order.cancelledBy = refreshed.cancelledBy;
        order.cancellationReason = refreshed.cancellationReason;
        order.restorationDetails = refreshed.restorationDetails;
      }
    } else if (orderStatus) {
      const validOrderStatuses: OrderStatus[] = [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
      ];
      if (validOrderStatuses.includes(orderStatus)) {
        order.orderStatus = orderStatus;
      }
    }

    const validPaymentStatuses: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];
    if (paymentStatus && validPaymentStatuses.includes(paymentStatus)) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid' && !order.paymentDetails?.paidAt) {
        order.paymentDetails = {
          ...order.paymentDetails,
          paidAt: new Date(),
        };
      }
    }

    const validShipmentStatuses: ShipmentStatus[] = [
      'unfulfilled',
      'ready_to_ship',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'returned',
    ];
    if (shipmentStatus && validShipmentStatuses.includes(shipmentStatus)) {
      order.shipmentStatus = shipmentStatus;
    }

    if (trackingInfo && typeof trackingInfo === 'object') {
      order.trackingInfo = {
        courierName: trackingInfo.courierName ? String(trackingInfo.courierName).trim() : order.trackingInfo?.courierName,
        trackingNumber: trackingInfo.trackingNumber ? String(trackingInfo.trackingNumber).trim() : order.trackingInfo?.trackingNumber,
        trackingUrl: trackingInfo.trackingUrl ? String(trackingInfo.trackingUrl).trim() : order.trackingInfo?.trackingUrl,
      };
    }

    if (shippingAddress && typeof shippingAddress === 'object') {
      if (shippingAddress.name) order.shippingAddress.name = String(shippingAddress.name).trim();
      if (shippingAddress.phone) order.shippingAddress.phone = String(shippingAddress.phone).trim();
      if (shippingAddress.addressLine1) order.shippingAddress.addressLine1 = String(shippingAddress.addressLine1).trim();
      if (shippingAddress.addressLine2 !== undefined) order.shippingAddress.addressLine2 = String(shippingAddress.addressLine2).trim();
      if (shippingAddress.city) order.shippingAddress.city = String(shippingAddress.city).trim();
      if (shippingAddress.state) order.shippingAddress.state = String(shippingAddress.state).trim();
      if (shippingAddress.pincode) order.shippingAddress.pincode = String(shippingAddress.pincode).trim();
      if (shippingAddress.landmark !== undefined) order.shippingAddress.landmark = String(shippingAddress.landmark).trim();
    }

    if (notes !== undefined) {
      order.notes = String(notes).trim();
    }

    await order.save();

    // Asynchronously notify customer of non-cancellation status transitions
    // (cancelAndRestockOrder already dispatches cancellation email directly)
    if (previousStatus !== order.orderStatus && order.orderStatus !== 'cancelled') {
      (async () => {
        try {
          await sendOrderStatusUpdate({
            order,
            previousStatus,
            newStatus: order.orderStatus,
          });
        } catch (emailErr) {
          console.warn('[Status Notification Warning] Failed to dispatch status email:', emailErr);
        }
      })();
    }

    res.json({
      success: true,
      message: cancelResult ? cancelResult.message : 'Order updated successfully.',
      order,
      restorationDetails: cancelResult?.restoredItems || order.restorationDetails || [],
      warnings: cancelResult?.warnings || [],
    });
  } catch (err: unknown) {
    console.error('[Update Order Error]', err);
    const msg = err instanceof Error ? err.message : 'Failed to update order.';
    res.status(400).json({ success: false, message: msg });
  }
});

/**
 * DELETE /api/admin/orders/:id
 * Safely deletes an order. If the order was never cancelled and inventory was not restored,
 * automatically restores reserved inventory first to prevent permanent inventory loss.
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid order ID.' });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Safety guard: If the order was active/pending and inventory was not restored,
    // restore the inventory before deletion so reserved stock is not permanently lost!
    if (!order.inventoryRestored && order.orderStatus !== 'cancelled') {
      await cancelAndRestockOrder(order._id, {
        cancelledBy: 'admin',
        reason: 'Order deleted by administrator',
      });
    }

    await Order.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `Order #${order.orderNumber} deleted successfully.`,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to delete order.' });
  }
});

export default router;
