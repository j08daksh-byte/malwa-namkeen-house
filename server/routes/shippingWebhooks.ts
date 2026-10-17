import { Router } from 'express';
import type { Request, Response } from 'express';
import { Order } from '../models/Order.ts';
import { verifyShiprocketWebhook } from '../lib/shiprocketService.ts';
import { sendOrderStatusUpdate } from '../lib/emailService.ts';

const router = Router();

/**
 * POST /api/shipping/webhook/shiprocket
 * Public webhook listener for Shiprocket tracking updates and courier status events.
 * Authenticated via Shiprocket webhook token header ('x-api-key' or 'Authorization').
 */
router.post('/webhook/shiprocket', async (req: Request, res: Response) => {
  try {
    // 1. Verify Webhook Authenticity
    const isAuthorized = verifyShiprocketWebhook(req.headers);
    if (!isAuthorized) {
      console.warn('[Shiprocket Webhook Warning] Unauthorized webhook request rejected.');
      res.status(401).json({ success: false, message: 'Unauthorized webhook request.' });
      return;
    }

    const payload = req.body || {};
    const awb = String(payload.awb || payload.awb_code || '').trim();
    const shipmentId = payload.shipment_id ? Number(payload.shipment_id) : undefined;
    const orderNumber = String(payload.order_id || '').trim();
    const currentStatus = String(payload.current_status || payload.status || '').trim();

    if (!awb && !shipmentId && !orderNumber) {
      res.status(400).json({ success: false, message: 'Missing shipment identifiers in webhook payload.' });
      return;
    }

    // 2. Locate matching order in database
    const query: any = {
      $or: [
        ...(orderNumber ? [{ orderNumber }] : []),
        ...(shipmentId ? [{ 'shiprocketDetails.shipmentId': shipmentId }] : []),
        ...(awb ? [{ 'shiprocketDetails.awbCode': awb }] : []),
      ],
    };

    const order = await Order.findOne(query);
    if (!order) {
      console.warn(`[Shiprocket Webhook] No matching order found for AWB: "${awb}", Shipment: "${shipmentId}", Order: "${orderNumber}".`);
      res.status(200).json({ success: true, message: 'Order not found, event acknowledged.' });
      return;
    }

    // 3. Deduplicate Replayed Events
    const eventIdentifier = String(
      req.headers['x-event-id'] ||
      payload.event_id ||
      `${awb || shipmentId}_${currentStatus}_${payload.scanned_date || payload.etd || Date.now()}`
    );

    if (order.processedShippingEvents && order.processedShippingEvents.includes(eventIdentifier)) {
      res.json({ success: true, message: 'Event already processed.', alreadyProcessed: true });
      return;
    }

    const previousStatus = order.orderStatus;
    const previousTrackingNumber = order.trackingInfo?.trackingNumber;
    let shouldNotifyCustomer = false;

    // 4. Update Shiprocket metadata
    order.shiprocketDetails = order.shiprocketDetails || {};
    if (awb && !order.shiprocketDetails.awbCode) {
      order.shiprocketDetails.awbCode = awb;
    }
    if (payload.courier_name && !order.shiprocketDetails.courierName) {
      order.shiprocketDetails.courierName = String(payload.courier_name).trim();
    }
    order.shiprocketDetails.lastEvent = currentStatus;
    order.shiprocketDetails.lastEventDate = new Date();
    order.shiprocketDetails.syncedAt = new Date();
    order.shiprocketDetails.rawStatus = currentStatus;

    // Update trackingInfo for storefront and email compatibility
    if (awb) {
      order.trackingInfo = {
        courierName: order.shiprocketDetails.courierName || order.trackingInfo?.courierName || 'Shiprocket Partner',
        trackingNumber: awb,
        trackingUrl: payload.tracking_url || `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`,
      };
      if (previousTrackingNumber !== awb) {
        shouldNotifyCustomer = true;
      }
    }

    // 5. State Machine Transitions based on Shiprocket status
    const statusUpper = currentStatus.toUpperCase();

    if (statusUpper.includes('AWB') || statusUpper === 'READY TO SHIP') {
      order.shipmentStatus = 'ready_to_ship';
    } else if (
      statusUpper.includes('IN TRANSIT') ||
      statusUpper.includes('PICKED UP') ||
      statusUpper.includes('REACHED')
    ) {
      order.shipmentStatus = 'in_transit';
      if (['pending', 'confirmed', 'processing'].includes(order.orderStatus)) {
        order.orderStatus = 'shipped';
        shouldNotifyCustomer = true;
      }
    } else if (statusUpper.includes('OUT FOR DELIVERY')) {
      order.shipmentStatus = 'out_for_delivery';
      if (order.orderStatus !== 'shipped' && order.orderStatus !== 'delivered') {
        order.orderStatus = 'shipped';
        shouldNotifyCustomer = true;
      }
    } else if (statusUpper.includes('DELIVERED') && !statusUpper.includes('RTO')) {
      order.shipmentStatus = 'delivered';
      order.orderStatus = 'delivered';
      // If Cash on Delivery, successful courier delivery verifies customer payment
      if (order.paymentMethod === 'cod' && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.paymentDetails = {
          ...(order.paymentDetails || {}),
          gateway: 'cod',
          paidAt: new Date(),
        };
      }
      shouldNotifyCustomer = true;
    } else if (statusUpper.includes('RTO') || statusUpper.includes('RETURN')) {
      order.shipmentStatus = 'returned';
    }

    // Record event to prevent replay attacks
    order.processedShippingEvents = order.processedShippingEvents || [];
    order.processedShippingEvents.push(eventIdentifier);

    await order.save();

    // 6. Asynchronously notify customer of status change or tracking attachment
    if (shouldNotifyCustomer && order.orderStatus !== 'cancelled') {
      (async () => {
        try {
          await sendOrderStatusUpdate({
            order,
            previousStatus,
            newStatus: order.orderStatus,
            isTrackingUpdate: previousTrackingNumber !== order.trackingInfo?.trackingNumber,
          });
        } catch (emailErr) {
          console.warn('[Shiprocket Webhook Notification Warning]:', emailErr);
        }
      })();
    }

    res.json({
      success: true,
      message: `Shiprocket event "${currentStatus}" processed for Order #${order.orderNumber}.`,
      orderStatus: order.orderStatus,
      shipmentStatus: order.shipmentStatus,
    });
  } catch (err: unknown) {
    console.error('[Shiprocket Webhook Exception]:', err);
    res.status(500).json({ success: false, message: 'Failed to process shipping webhook.' });
  }
});

export default router;
