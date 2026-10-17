import { Router } from 'express';
import type { Response } from 'express';
import mongoose from 'mongoose';
import { Order, type OrderStatus, type PaymentStatus, type ShipmentStatus } from '../models/Order.ts';
import { requireAdmin, type AuthenticatedRequest } from '../lib/auth.ts';
import { sendOrderStatusUpdate } from '../lib/emailService.ts';
import { cancelAndRestockOrder } from '../lib/orderRestoration.ts';
import {
  createShiprocketOrder,
  assignShiprocketAWB,
  trackShipmentByAWB,
} from '../lib/shiprocketService.ts';

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
const updateOrderHandler = async (req: AuthenticatedRequest, res: Response) => {
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
    const previousTrackingNumber = order.trackingInfo?.trackingNumber;
    let cancelResult: any = null;

    // F-01: Reject attempts to transition an already-cancelled order back to fulfillment
    if (order.orderStatus === 'cancelled' && orderStatus && orderStatus !== 'cancelled') {
      res.status(400).json({
        success: false,
        message: `Order #${order.orderNumber} is cancelled and cannot be directly re-activated. Reserved inventory was already restored. A new order must be placed.`,
      });
      return;
    }

    // F-02: Reject admin cancellation if goods have already been dispatched or delivered
    if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
      const nonCancellableOrderStatuses: OrderStatus[] = ['shipped', 'delivered'];
      const nonCancellableShipmentStatuses: ShipmentStatus[] = ['in_transit', 'out_for_delivery', 'delivered'];

      if (nonCancellableOrderStatuses.includes(order.orderStatus)) {
        res.status(400).json({
          success: false,
          message: `Cannot cancel order #${order.orderNumber} because it is already in "${order.orderStatus}" status. Physical goods cannot be automatically restocked. Please use the Return/Refund workflow.`,
        });
        return;
      }

      if (order.shipmentStatus && nonCancellableShipmentStatuses.includes(order.shipmentStatus)) {
        res.status(400).json({
          success: false,
          message: `Cannot cancel order #${order.orderNumber} because shipment status is "${order.shipmentStatus}". Goods have already left the facility.`,
        });
        return;
      }
    }

    // Handle cancellation and inventory restoration
    if (orderStatus === 'cancelled') {
      const reason = typeof notes === 'string' && notes.trim()
        ? notes.trim()
        : 'Cancelled by administrator';

      cancelResult = await cancelAndRestockOrder(id, {
        cancelledBy: 'admin',
        reason,
        allowedCurrentStatuses: ['pending', 'confirmed', 'processing'],
      });

      if (!cancelResult.success && !cancelResult.alreadyCancelled && (!cancelResult.restoredItems || cancelResult.restoredItems.length === 0)) {
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
        order.restorationStatus = refreshed.restorationStatus;
        order.couponRestored = refreshed.couponRestored;
        order.cancelledAt = refreshed.cancelledAt;
        order.cancelledBy = refreshed.cancelledBy;
        order.cancellationReason = refreshed.cancellationReason;
        order.restorationDetails = refreshed.restorationDetails;
      }

      await order.save();
    } else {
      // Revalidate persisted status at the write boundary (F-CR-02)
      const currentPersisted = await Order.findById(id).select('orderStatus inventoryRestored orderNumber').lean();
      if (!currentPersisted) {
        res.status(404).json({ success: false, message: 'Order not found.' });
        return;
      }

      if (currentPersisted.orderStatus === 'cancelled') {
        res.status(409).json({
          success: false,
          conflict: true,
          message: `Conflict: Order #${currentPersisted.orderNumber} was cancelled concurrently. Changes cannot be applied to a cancelled order.`,
          order: currentPersisted,
        });
        return;
      }

      // Build atomic conditional update payload ensuring orderStatus !== 'cancelled'
      const setPayload: Record<string, any> = {};

      const validOrderStatuses: OrderStatus[] = [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
      ];
      if (orderStatus && validOrderStatuses.includes(orderStatus)) {
        setPayload.orderStatus = orderStatus;
        order.orderStatus = orderStatus;
      }

      const validPaymentStatuses: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];
      if (paymentStatus && validPaymentStatuses.includes(paymentStatus)) {
        setPayload.paymentStatus = paymentStatus;
        order.paymentStatus = paymentStatus;
        if (paymentStatus === 'paid' && !order.paymentDetails?.paidAt) {
          setPayload['paymentDetails.paidAt'] = new Date();
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
        setPayload.shipmentStatus = shipmentStatus;
        order.shipmentStatus = shipmentStatus;
      }

      if (trackingInfo && typeof trackingInfo === 'object') {
        if (trackingInfo.courierName) setPayload['trackingInfo.courierName'] = String(trackingInfo.courierName).trim();
        if (trackingInfo.trackingNumber) setPayload['trackingInfo.trackingNumber'] = String(trackingInfo.trackingNumber).trim();
        if (trackingInfo.trackingUrl) setPayload['trackingInfo.trackingUrl'] = String(trackingInfo.trackingUrl).trim();
      }

      if (shippingAddress && typeof shippingAddress === 'object') {
        if (shippingAddress.name) setPayload['shippingAddress.name'] = String(shippingAddress.name).trim();
        if (shippingAddress.phone) setPayload['shippingAddress.phone'] = String(shippingAddress.phone).trim();
        if (shippingAddress.addressLine1) setPayload['shippingAddress.addressLine1'] = String(shippingAddress.addressLine1).trim();
        if (shippingAddress.addressLine2 !== undefined) setPayload['shippingAddress.addressLine2'] = String(shippingAddress.addressLine2).trim();
        if (shippingAddress.city) setPayload['shippingAddress.city'] = String(shippingAddress.city).trim();
        if (shippingAddress.state) setPayload['shippingAddress.state'] = String(shippingAddress.state).trim();
        if (shippingAddress.pincode) setPayload['shippingAddress.pincode'] = String(shippingAddress.pincode).trim();
        if (shippingAddress.landmark !== undefined) setPayload['shippingAddress.landmark'] = String(shippingAddress.landmark).trim();
      }

      if (notes !== undefined) {
        setPayload.notes = String(notes).trim();
        order.notes = String(notes).trim();
      }

      // Execute atomic conditional write: guarantees a concurrent cancellation is never overwritten
      const updated = await Order.findOneAndUpdate(
        { _id: id, orderStatus: { $ne: 'cancelled' } },
        { $set: setPayload },
        { new: true }
      );

      if (!updated) {
        const fresh = await Order.findById(id);
        if (fresh && fresh.orderStatus === 'cancelled') {
          res.status(409).json({
            success: false,
            conflict: true,
            message: `Conflict: Order #${order.orderNumber} was cancelled concurrently while being saved. Changes were rejected.`,
            order: fresh,
          });
          return;
        }
        res.status(404).json({ success: false, message: 'Order not found.' });
        return;
      }

      Object.assign(order, updated.toObject ? updated.toObject() : updated);
    }

    const newlyAddedTracking = Boolean(
      order.trackingInfo?.trackingNumber &&
      order.trackingInfo.trackingNumber !== previousTrackingNumber
    );

    // Asynchronously notify customer of non-cancellation status transitions or newly attached tracking
    // (cancelAndRestockOrder already dispatches cancellation email directly)
    if ((previousStatus !== order.orderStatus || newlyAddedTracking) && order.orderStatus !== 'cancelled') {
      (async () => {
        try {
          await sendOrderStatusUpdate({
            order,
            previousStatus,
            newStatus: order.orderStatus,
            isTrackingUpdate: previousStatus === order.orderStatus && newlyAddedTracking,
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
};

router.put('/:id', updateOrderHandler);
router.patch('/:id', updateOrderHandler);
router.patch('/:id/status', updateOrderHandler);

/**
 * DELETE /api/admin/orders/:id
 * Safely deletes an order. If the order was never cancelled and inventory was not restored,
 * automatically restores reserved inventory first. If restoration fails or produces warnings,
 * deletion is rejected (HTTP 409) to preserve the audit trail and prevent permanent data loss.
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

    // Safety guard (F-03): If the order was never cancelled or only partially restored,
    // ensure inventory is safely restored before document deletion.
    if (!order.inventoryRestored) {
      const cancelResult = await cancelAndRestockOrder(order._id, {
        cancelledBy: 'admin',
        reason: 'Order deleted by administrator',
      });

      // F-03: If restoration encountered warnings or failed, DO NOT delete the order!
      // Preserve the order and its restorationDetails audit trail for manual reconciliation.
      if (!cancelResult.success || (cancelResult.warnings && cancelResult.warnings.length > 0)) {
        res.status(409).json({
          success: false,
          message: `Cannot delete order #${order.orderNumber} because inventory restoration encountered issues. The order record has been preserved for auditing and reconciliation.`,
          warnings: cancelResult.warnings,
          restorationDetails: cancelResult.restoredItems,
        });
        return;
      }
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

/**
 * POST /api/admin/orders/:id/shiprocket/create-shipment
 * Creates an ad-hoc shipment order with Shiprocket.
 * Prevents duplicate shipment creation on retries.
 */
router.post('/:id/shiprocket/create-shipment', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { customDimensions } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid order ID format.' });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (order.orderStatus === 'cancelled') {
      res.status(400).json({
        success: false,
        message: `Order #${order.orderNumber} is cancelled and cannot be shipped.`,
      });
      return;
    }

    if (order.shiprocketDetails?.shipmentId || order.shiprocketDetails?.orderId) {
      res.status(409).json({
        success: false,
        message: `Shipment already created for Order #${order.orderNumber} (Shipment ID: ${order.shiprocketDetails.shipmentId || order.shiprocketDetails.orderId}).`,
        order,
      });
      return;
    }

    const result = await createShiprocketOrder(order, { customDimensions });
    if (!result.success || !result.data) {
      res.status(result.statusCode || 400).json({
        success: false,
        message: result.error || 'Failed to create Shiprocket shipment.',
      });
      return;
    }

    const shipData = result.data;
    order.shiprocketDetails = {
      ...(order.shiprocketDetails || {}),
      orderId: shipData.order_id,
      shipmentId: shipData.shipment_id,
      courierCompanyId: shipData.courier_company_id,
      courierName: shipData.courier_name,
      awbCode: shipData.awb_code,
      rawStatus: shipData.status,
      syncedAt: new Date(),
    };
    order.shipmentStatus = 'ready_to_ship';
    if (['pending', 'confirmed'].includes(order.orderStatus)) {
      order.orderStatus = 'processing';
    }

    if (shipData.awb_code) {
      order.trackingInfo = {
        courierName: shipData.courier_name || order.trackingInfo?.courierName || 'Shiprocket Partner',
        trackingNumber: shipData.awb_code,
        trackingUrl: `https://shiprocket.co/tracking/${encodeURIComponent(shipData.awb_code)}`,
      };
    }

    await order.save();

    res.json({
      success: true,
      message: `Shiprocket shipment created successfully (Shipment ID: ${shipData.shipment_id}).`,
      order,
      shipment: shipData,
    });
  } catch (err: unknown) {
    console.error('[Admin Shiprocket Create Shipment Error]:', err);
    res.status(500).json({ success: false, message: 'Internal error creating Shiprocket shipment.' });
  }
});

/**
 * POST /api/admin/orders/:id/shiprocket/generate-awb
 * Assigns courier partner and generates AWB tracking code.
 */
router.post('/:id/shiprocket/generate-awb', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { courierId } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid order ID format.' });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (order.orderStatus === 'cancelled') {
      res.status(400).json({ success: false, message: 'Cannot assign AWB to a cancelled order.' });
      return;
    }

    const shipmentId = order.shiprocketDetails?.shipmentId;
    if (!shipmentId) {
      res.status(400).json({
        success: false,
        message: 'Please create a Shiprocket shipment first before generating an AWB.',
      });
      return;
    }

    if (order.shiprocketDetails?.awbCode) {
      res.json({
        success: true,
        message: `AWB code is already assigned: ${order.shiprocketDetails.awbCode}.`,
        order,
      });
      return;
    }

    const result = await assignShiprocketAWB(shipmentId, courierId);
    if (!result.success || !result.data) {
      res.status(result.statusCode || 400).json({
        success: false,
        message: result.error || 'Failed to assign AWB.',
      });
      return;
    }

    const awbData = result.data.response.data;
    order.shiprocketDetails.awbCode = awbData.awb_code;
    order.shiprocketDetails.courierCompanyId = awbData.courier_company_id;
    order.shiprocketDetails.courierName = awbData.courier_name;
    order.shiprocketDetails.labelUrl = awbData.label_url;
    order.shiprocketDetails.manifestUrl = awbData.manifest_url;
    order.shiprocketDetails.syncedAt = new Date();

    order.trackingInfo = {
      courierName: awbData.courier_name || 'Shiprocket Partner',
      trackingNumber: awbData.awb_code,
      trackingUrl: `https://shiprocket.co/tracking/${encodeURIComponent(awbData.awb_code)}`,
    };
    order.shipmentStatus = 'ready_to_ship';

    await order.save();

    // Asynchronously dispatch tracking email to customer
    (async () => {
      try {
        await sendOrderStatusUpdate({
          order,
          previousStatus: order.orderStatus,
          newStatus: order.orderStatus,
          isTrackingUpdate: true,
        });
      } catch (emailErr) {
        console.warn('[Tracking Email Notification Warning]:', emailErr);
      }
    })();

    res.json({
      success: true,
      message: `AWB ${awbData.awb_code} generated and assigned via ${awbData.courier_name}.`,
      order,
      awb: awbData,
    });
  } catch (err: unknown) {
    console.error('[Admin Shiprocket Generate AWB Error]:', err);
    res.status(500).json({ success: false, message: 'Internal error generating Shiprocket AWB.' });
  }
});

/**
 * GET /api/admin/orders/:id/shiprocket/track
 * Fetches live courier tracking activities from Shiprocket.
 */
router.get('/:id/shiprocket/track', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid order ID format.' });
      return;
    }

    const order = await Order.findById(id).lean();
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    const awbCode = order.shiprocketDetails?.awbCode || order.trackingInfo?.trackingNumber;
    if (!awbCode) {
      res.status(400).json({
        success: false,
        message: 'No AWB tracking code assigned to this order.',
      });
      return;
    }

    const result = await trackShipmentByAWB(awbCode);
    if (!result.success || !result.data) {
      res.status(result.statusCode || 400).json({
        success: false,
        message: result.error || 'Failed to fetch live tracking from Shiprocket.',
      });
      return;
    }

    res.json({
      success: true,
      tracking: result.data.tracking_data,
    });
  } catch (err: unknown) {
    console.error('[Admin Shiprocket Track Error]:', err);
    res.status(500).json({ success: false, message: 'Internal error querying Shiprocket tracking.' });
  }
});

export default router;
