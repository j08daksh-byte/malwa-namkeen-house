import { Router } from 'express';
import type { Request, Response } from 'express';
import { Order } from '../models/Order.ts';
import { verifyShiprocketWebhook } from '../lib/shiprocketService.ts';
import { sendOrderStatusUpdate } from '../lib/emailService.ts';

const router = Router();

/**
 * Builds a stable, deterministic event identifier from the Shiprocket webhook payload.
 *
 * Priority order:
 *  1. Provider-supplied x-event-id header (most stable, set by Shiprocket itself).
 *  2. event_id field in the payload body.
 *  3. Derived from stable, immutable fields: AWB/shipment_id + status + scan timestamp.
 *     The scan timestamp (scanned_date or etd) is part of the immutable event record and
 *     is stable across retries — unlike Date.now() which varies per delivery attempt.
 *
 * If no stable identifier can be derived (missing AWB AND shipment ID AND status), the function
 * returns null. The caller must handle this explicitly — it must NOT fall back to Date.now().
 */
function buildStableEventId(
  headers: Record<string, any>,
  payload: Record<string, any>,
  awb: string,
  shipmentId: number | undefined,
  orderNumber: string,
  currentStatus: string
): string | null {
  // 1. Provider-supplied header (most authoritative)
  const headerEventId = headers['x-event-id'];
  if (headerEventId && typeof headerEventId === 'string' && headerEventId.trim()) {
    return headerEventId.trim();
  }

  // 2. Payload-level event identifier
  const payloadEventId = payload.event_id;
  if (payloadEventId && String(payloadEventId).trim()) {
    return String(payloadEventId).trim();
  }

  // 3. Derive from stable, immutable fields. The scan/etd timestamp is part of the
  //    event record and does not change between retries of the same event.
  const stableRef = awb || (shipmentId ? String(shipmentId) : orderNumber || '');
  const stableStatus = currentStatus.toUpperCase().replace(/\s+/g, '_');
  const stableTimestamp = (payload.scanned_date || payload.etd || '').trim();

  if (!stableRef || !stableStatus) {
    // Cannot form a stable identifier — caller must decide how to handle this.
    return null;
  }

  if (!stableTimestamp) {
    // We have a shipment ref and status but no timestamp. This identifier will be
    // stable within a single delivery epoch (same AWB + status doesn't repeat for
    // a given parcel) but cannot distinguish retries within the same minute.
    // This is acceptable: Shiprocket does not re-use the same status for the same AWB.
    return `sr_${stableRef}_${stableStatus}`;
  }

  return `sr_${stableRef}_${stableStatus}_${stableTimestamp}`;
}

/**
 * POST /api/shipping/webhook/shiprocket
 * Public webhook listener for Shiprocket tracking updates and courier status events.
 * Authenticated via Shiprocket webhook token header ('x-api-key' or 'Authorization').
 *
 * Safety guarantees:
 *  - Cancelled orders are never transitioned, paid, or mutated by late delivery events.
 *  - Event deduplication uses stable identifiers — Date.now() fallback is eliminated.
 *  - Concurrent replay protection uses an atomic $addToSet + findOneAndUpdate to prevent
 *    two simultaneous deliveries of the same event both applying state changes.
 *  - Authentication uses timing-safe comparison (delegated to verifyShiprocketWebhook).
 *  - COD payment reconciliation only applies to eligible non-cancelled COD orders on delivery.
 */
router.post(['/webhook/shiprocket', '/webhook', '/'], async (req: Request, res: Response) => {
  try {
    // 1. Verify Webhook Authenticity (timing-safe comparison via verifyShiprocketWebhook)
    const isAuthorized = verifyShiprocketWebhook(req.headers as Record<string, any>);
    if (!isAuthorized) {
      console.warn('[Shiprocket Webhook Warning] Unauthorized webhook request rejected.');
      res.status(401).json({ success: false, message: 'Unauthorized webhook request.' });
      return;
    }

    const payload = req.body || {};
    const awb = String(payload.awb || payload.awb_code || '').trim();
    const shipmentId = payload.shipment_id ? Number(payload.shipment_id) : undefined;
    const orderNumber = String(payload.channel_order_id || payload.order_id || '').trim();
    const currentStatus = String(payload.current_status || payload.status || '').trim();

    if (!awb && !shipmentId && !orderNumber) {
      res.status(400).json({ success: false, message: 'Missing shipment identifiers in webhook payload.' });
      return;
    }

    // 2. Build a stable, deterministic event identifier — no Date.now() fallback
    const eventIdentifier = buildStableEventId(
      req.headers as Record<string, any>,
      payload,
      awb,
      shipmentId,
      orderNumber,
      currentStatus
    );

    if (eventIdentifier === null) {
      // Event cannot be identified — we cannot guarantee idempotency.
      // Acknowledge without applying any state change to avoid silent data corruption.
      console.warn(
        '[Shiprocket Webhook] Received event with no stable identifier ' +
          `(AWB: "${awb}", Shipment: "${shipmentId}", Status: "${currentStatus}"). ` +
          'Acknowledged without processing to preserve replay safety.'
      );
      res.status(200).json({
        success: true,
        message: 'Event acknowledged without processing: no stable event identifier available.',
        unidentifiable: true,
      });
      return;
    }

    // 3. Locate matching order AND atomically claim this event in one operation.
    //    Using findOneAndUpdate with $addToSet is the database-atomic check-and-set:
    //    if eventIdentifier is already in processedShippingEvents, $addToSet is a no-op
    //    and the document's updatedAt won't change — we detect this via the returned doc.
    const orderQuery: any = {
      $or: [
        ...(orderNumber ? [{ orderNumber }] : []),
        ...(orderNumber && !isNaN(Number(orderNumber)) ? [{ 'shiprocketDetails.orderId': Number(orderNumber) }] : []),
        ...(shipmentId ? [{ 'shiprocketDetails.shipmentId': shipmentId }] : []),
        ...(awb ? [{ 'shiprocketDetails.awbCode': awb }] : []),
      ],
      // Atomic replay-protection: only match orders that have NOT yet recorded this event.
      // $nin is more reliable than $not+$elemMatch on empty/null/missing array fields.
      processedShippingEvents: { $nin: [eventIdentifier] },
    };

    // Atomically claim the event slot. If another concurrent request already claimed it,
    // this findOneAndUpdate will match nothing (the $elemMatch guard will fail).
    const claimedOrder = await Order.findOneAndUpdate(
      orderQuery,
      { $addToSet: { processedShippingEvents: eventIdentifier } },
      { new: false } // return the pre-update doc so we can read previous state
    );

    if (!claimedOrder) {
      // Either order not found, or event was already claimed by a concurrent/prior request.
      // Distinguish the two cases for accurate logging.
      const existingOrder = await Order.findOne({
        $or: [
          ...(orderNumber ? [{ orderNumber }] : []),
          ...(orderNumber && !isNaN(Number(orderNumber)) ? [{ 'shiprocketDetails.orderId': Number(orderNumber) }] : []),
          ...(shipmentId ? [{ 'shiprocketDetails.shipmentId': shipmentId }] : []),
          ...(awb ? [{ 'shiprocketDetails.awbCode': awb }] : []),
        ],
      });

      if (!existingOrder) {
        console.warn(
          `[Shiprocket Webhook] No matching order found for AWB: "${awb}", ` +
            `Shipment: "${shipmentId}", Order: "${orderNumber}".`
        );
        res.status(200).json({ success: true, message: 'Order not found, event acknowledged.' });
        return;
      }

      // Order exists but event was already processed (concurrent or prior delivery)
      res.json({ success: true, message: 'Event already processed.', alreadyProcessed: true });
      return;
    }

    const order = claimedOrder; // pre-update snapshot (event token already claimed in DB)

    // 4. Cancelled-order guard — never mutate a cancelled order via courier events.
    //    This check runs AFTER the atomic claim so the event is still recorded
    //    (preventing any future retry from slipping through), but no state change is applied.
    if (order.orderStatus === 'cancelled') {
      console.warn(
        `[Shiprocket Webhook] Late event "${currentStatus}" received for CANCELLED ` +
          `Order #${order.orderNumber} — no state change applied.`
      );
      res.status(200).json({
        success: true,
        message: `Event "${currentStatus}" acknowledged for cancelled order #${order.orderNumber}. No state change applied.`,
        cancelledOrderGuard: true,
      });
      return;
    }

    // 5. Apply state transitions (order is confirmed to be non-cancelled at this point)
    const previousStatus = order.orderStatus;
    const previousTrackingNumber = order.trackingInfo?.trackingNumber;
    let shouldNotifyCustomer = false;

    // Update Shiprocket metadata
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

    // State machine transitions based on Shiprocket status
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

      // COD reconciliation: only for non-cancelled COD orders on a genuine delivery event.
      // Safety: the cancelled-order guard above has already returned before this point,
      // so order.orderStatus is never 'cancelled' here. The paymentStatus !== 'paid' check
      // prevents re-applying the reconciliation on duplicate events that slip through.
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

    await order.save();

    // 6. Asynchronously notify customer of status change or tracking attachment.
    // Note: order.orderStatus cannot be 'cancelled' here because the cancelled-order guard
    // above returns early. The check is intentionally omitted to satisfy the type-checker.
    if (shouldNotifyCustomer) {
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
