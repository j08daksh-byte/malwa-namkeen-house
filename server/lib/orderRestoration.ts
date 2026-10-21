import mongoose, { Types } from 'mongoose';
import { Order, type IOrder, type OrderStatus, type ShipmentStatus, type IRestorationItemDetail } from '../models/Order.ts';
import { Product } from '../models/Product.ts';
import { Discount } from '../models/Discount.ts';
import { User } from '../models/User.ts';
import { sendOrderStatusUpdate, sendCustomerOrderCancellationAdminAlert } from './emailService.ts';
import { cancelShiprocketOrder } from './shiprocketService.ts';

export interface CancelOrderResult {
  success: boolean;
  alreadyCancelled?: boolean;
  order?: IOrder;
  restoredItems: IRestorationItemDetail[];
  couponRestored: boolean;
  warnings: string[];
  message: string;
}

const NON_CANCELLABLE_ORDER_STATUSES: OrderStatus[] = ['shipped', 'delivered'];
const NON_CANCELLABLE_SHIPMENT_STATUSES: ShipmentStatus[] = ['in_transit', 'out_for_delivery', 'delivered'];

/**
 * Safely, idempotently, and atomically cancels an order and restores its reserved inventory.
 *
 * Concurrency & Recovery Architecture:
 * - Uses atomic findOneAndUpdate with restoringLock and 30-second stale lock expiration.
 * - Tracks restoration progress at item level (restored, restoredAt, error).
 * - inventoryRestored is set to TRUE ONLY when all items in the order succeed.
 * - If any item fails, inventoryRestored remains false and restorationStatus is set to 'partial_failure'.
 * - Safe retries only attempt un-restored items; already restored items are never double-incremented.
 * - Rolls back coupon usage count only when discount > 0 and coupon has not already been restored.
 * - Rejects cancellation of already shipped or delivered orders to prevent phantom stock.
 */
export async function cancelAndRestockOrder(
  orderId: string | Types.ObjectId,
  options: {
    cancelledBy: 'admin' | 'customer' | 'system';
    reason?: string;
    allowedCurrentStatuses?: OrderStatus[];
  }
): Promise<CancelOrderResult> {
  const cleanId = typeof orderId === 'string' ? orderId.trim() : orderId;

  if (!mongoose.Types.ObjectId.isValid(cleanId)) {
    return {
      success: false,
      restoredItems: [],
      couponRestored: false,
      warnings: ['Invalid order ID format.'],
      message: 'Invalid order ID format.',
    };
  }

  // 1. Fetch current order document
  const existing = await Order.findById(cleanId);
  if (!existing) {
    return {
      success: false,
      restoredItems: [],
      couponRestored: false,
      warnings: ['Order not found in database.'],
      message: 'Order not found.',
    };
  }

  // Check if fully cancelled and all inventory was already restored
  if (existing.orderStatus === 'cancelled' && existing.inventoryRestored === true) {
    return {
      success: true,
      alreadyCancelled: true,
      order: existing,
      restoredItems: existing.restorationDetails || [],
      couponRestored: Boolean(existing.couponRestored),
      warnings: [],
      message: 'Order was already cancelled and all inventory was previously restored.',
    };
  }

  // 2. Eligibility status guard (F-02: Prevent phantom inventory)
  if (existing.orderStatus !== 'cancelled') {
    if (options.allowedCurrentStatuses && options.allowedCurrentStatuses.length > 0) {
      if (!options.allowedCurrentStatuses.includes(existing.orderStatus)) {
        return {
          success: false,
          order: existing,
          restoredItems: [],
          couponRestored: false,
          warnings: [`Order status "${existing.orderStatus}" is not eligible for cancellation.`],
          message: `Orders in status "${existing.orderStatus}" cannot be cancelled.`,
        };
      }
    } else {
      if (NON_CANCELLABLE_ORDER_STATUSES.includes(existing.orderStatus)) {
        return {
          success: false,
          order: existing,
          restoredItems: [],
          couponRestored: false,
          warnings: [`Order status "${existing.orderStatus}" indicates goods have already been dispatched or delivered.`],
          message: `Orders in status "${existing.orderStatus}" cannot be cancelled. Goods are already with the customer or in transit.`,
        };
      }
    }

    if (existing.shipmentStatus && NON_CANCELLABLE_SHIPMENT_STATUSES.includes(existing.shipmentStatus)) {
      return {
        success: false,
        order: existing,
        restoredItems: [],
        couponRestored: false,
        warnings: [`Shipment status "${existing.shipmentStatus}" indicates goods have already left the facility.`],
        message: `Orders with shipment status "${existing.shipmentStatus}" cannot be cancelled.`,
      };
    }
  }

  // 3. Concurrency Lock Acquisition (F-04)
  const isInitialCancellation = existing.orderStatus !== 'cancelled';
  const lockFilter: any = {
    _id: cleanId,
    inventoryRestored: { $ne: true },
    $or: [
      { restoringLock: { $ne: true } },
      { restoringLockedAt: { $lt: new Date(Date.now() - 30000) } },
      { restoringLockedAt: null },
      { restoringLockedAt: { $exists: false } },
    ],
  };

  const lockUpdate: any = {
    $set: {
      orderStatus: 'cancelled',
      restoringLock: true,
      restoringLockedAt: new Date(),
      cancelledAt: existing.cancelledAt || new Date(),
      cancelledBy: existing.cancelledBy || options.cancelledBy,
      cancellationReason: options.reason ? options.reason.trim() : (existing.cancellationReason || ''),
    },
  };

  const lockedOrder = await Order.findOneAndUpdate(lockFilter, lockUpdate, { new: true });

  if (!lockedOrder) {
    const current = await Order.findById(cleanId);
    if (current && current.inventoryRestored) {
      return {
        success: true,
        alreadyCancelled: true,
        order: current,
        restoredItems: current.restorationDetails || [],
        couponRestored: Boolean(current.couponRestored),
        warnings: [],
        message: 'Order was already cancelled and inventory was previously restored.',
      };
    }
    return {
      success: false,
      order: current || existing,
      restoredItems: current?.restorationDetails || [],
      couponRestored: Boolean(current?.couponRestored),
      warnings: ['Cancellation or inventory restoration is currently in progress by another request.'],
      message: 'Restoration lock is currently held. Please retry in a few moments.',
    };
  }

  // 4. Per-Item Restoration with Durable State Tracking (F-04)
  const existingDetails = Array.isArray(lockedOrder.restorationDetails) ? lockedOrder.restorationDetails : [];
  const restoredItems: IRestorationItemDetail[] = [];
  const warnings: string[] = [];
  let couponRestored = Boolean(lockedOrder.couponRestored);

  if (Array.isArray(lockedOrder.items)) {
    for (let i = 0; i < lockedOrder.items.length; i++) {
      const item = lockedOrder.items[i];
      const qty = item.quantity;
      if (!qty || qty <= 0) continue;

      // Check if this specific item was ALREADY successfully restored in a prior attempt
      const priorDetail = existingDetails.find(
        d =>
          (item.variantId && d.variantId && d.variantId.toString() === item.variantId.toString()) ||
          (item.sku && d.sku && d.sku.toUpperCase() === item.sku.toUpperCase()) ||
          (d.productName === item.productName && d.variantLabel === item.variantLabel)
      );

      if (priorDetail && priorDetail.restored === true) {
        // Item was already successfully restored! DO NOT increment stock again!
        restoredItems.push(priorDetail);
        continue;
      }

      const itemDetail: IRestorationItemDetail = {
        productId: item.productId ? item.productId.toString() : undefined,
        productName: item.productName || 'Unknown Product',
        variantId: item.variantId ? item.variantId.toString() : undefined,
        variantLabel: item.variantLabel || '',
        sku: item.sku || '',
        quantity: qty,
        restored: false,
      };

      if (!item.productId) {
        itemDetail.error = 'No productId snapshot found on order item';
        warnings.push(`Cannot restore stock for "${item.productName}": Missing productId.`);
        restoredItems.push(itemDetail);
        continue;
      }

      try {
        const product = await Product.findById(item.productId);
        if (!product) {
          itemDetail.error = `Product ID ${item.productId} no longer exists in database`;
          warnings.push(`Cannot restore stock for "${item.productName}": Product no longer exists in database.`);
          restoredItems.push(itemDetail);
          continue;
        }

        let matchedVariant: any = null;
        if (Array.isArray(product.variants)) {
          // 1. Direct match by variantId
          if (item.variantId) {
            matchedVariant = product.variants.find(
              (v: any) => v._id && v._id.toString() === item.variantId!.toString()
            );
          }
          // 2. Match by SKU (case-insensitive)
          if (!matchedVariant && item.sku) {
            matchedVariant = product.variants.find(
              (v: any) => v.sku && v.sku.toUpperCase() === item.sku.toUpperCase()
            );
          }
          // 3. Fallback match by variant label (case-insensitive & trimmed)
          if (!matchedVariant && item.variantLabel) {
            const targetLabel = item.variantLabel.trim().toLowerCase();
            matchedVariant = product.variants.find((v: any) => {
              const label = (v.label || '').trim().toLowerCase();
              const valUnit = `${v.value || ''} ${v.unit || ''}`.trim().toLowerCase();
              return label === targetLabel || valUnit === targetLabel;
            });
          }
        }

        if (!matchedVariant) {
          itemDetail.error = `Variant "${item.variantLabel}" (SKU: ${item.sku}) no longer exists on product "${product.name}"`;
          warnings.push(`Cannot restore stock for "${item.productName} (${item.variantLabel})": Variant not found.`);
          restoredItems.push(itemDetail);
          continue;
        }

        // Unique deterministic restoration operation ID (F-CR-01)
        const opId = `restore_${cleanId}_item${i}_var_${matchedVariant._id}`;

        // Atomically increment stock on the matching variant ONLY IF this operation ID has not been applied
        const updateResult = await Product.updateOne(
          {
            _id: product._id,
            variants: {
              $elemMatch: {
                _id: matchedVariant._id,
                restoredOrderOps: { $ne: opId },
              },
            },
          },
          {
            $inc: { 'variants.$.stock': qty },
            $addToSet: { 'variants.$.restoredOrderOps': opId },
          }
        );

        if (updateResult.modifiedCount > 0) {
          itemDetail.restored = true;
          itemDetail.restoredAt = new Date();
          itemDetail.variantId = matchedVariant._id.toString();
        } else {
          // Distinguish (F-CR-01): Was this operation ID ALREADY applied in a prior attempt (e.g. process crash)?
          const alreadyApplied = await Product.exists({
            _id: product._id,
            variants: {
              $elemMatch: {
                _id: matchedVariant._id,
                restoredOrderOps: opId,
              },
            },
          });

          if (alreadyApplied) {
            // Crash recovery: Stock was already restored in prior attempt before crash; do not double increment
            itemDetail.restored = true;
            itemDetail.restoredAt = new Date();
            itemDetail.variantId = matchedVariant._id.toString();
          } else {
            itemDetail.error = 'MongoDB Product atomic stock update returned 0 modifiedCount';
            warnings.push(`Failed to update stock for "${item.productName} (${item.variantLabel})".`);
          }
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        itemDetail.error = errMsg;
        warnings.push(`Error updating stock for "${item.productName}": ${errMsg}`);
      }

      restoredItems.push(itemDetail);
    }
  }

  // 5. Coupon Rollback (F-08 & F-CR-01: Crash-safe idempotent coupon rollback)
  if (
    lockedOrder.discountCode &&
    lockedOrder.discountCode.trim() &&
    (typeof lockedOrder.discount === 'number' && lockedOrder.discount > 0) &&
    !couponRestored
  ) {
    const code = lockedOrder.discountCode.trim().toUpperCase();
    const couponOpId = `restore_${cleanId}_coupon`;
    try {
      const discountUpdate = await Discount.updateOne(
        { code, usedCount: { $gt: 0 }, restoredOrderOps: { $ne: couponOpId } },
        { $inc: { usedCount: -1 }, $addToSet: { restoredOrderOps: couponOpId } }
      );
      if (discountUpdate.modifiedCount > 0) {
        couponRestored = true;
      } else {
        const alreadyRolledBack = await Discount.exists({
          code,
          restoredOrderOps: couponOpId,
        });
        if (alreadyRolledBack) {
          couponRestored = true;
        } else {
          warnings.push(`Could not rollback coupon "${code}": Discount code not found or usedCount was already 0.`);
        }
      }
    } catch (couponErr: unknown) {
      const errMsg = couponErr instanceof Error ? couponErr.message : String(couponErr);
      warnings.push(`Failed to rollback coupon usage for "${code}": ${errMsg}`);
    }
  }

  // 6. Release Lock and Record Durable Per-Item State (F-04)
  const allItemsRestored = restoredItems.length > 0 && restoredItems.every(it => it.restored === true);
  const anyItemsRestored = restoredItems.some(it => it.restored === true);

  const finalRestorationStatus = allItemsRestored
    ? 'completed'
    : anyItemsRestored
    ? 'partial_failure'
    : 'failed';

  const updatedOrder = await Order.findByIdAndUpdate(
    cleanId,
    {
      $set: {
        restoringLock: false,
        restoringLockedAt: null,
        inventoryRestored: allItemsRestored,
        restorationStatus: finalRestorationStatus,
        couponRestored,
        restorationDetails: restoredItems,
      },
    },
    { new: true }
  );

  // 7. Send notification email on initial cancellation only
  if (isInitialCancellation && updatedOrder) {
    (async () => {
      try {
        await sendOrderStatusUpdate({
          order: updatedOrder,
          previousStatus: existing.orderStatus,
          newStatus: 'cancelled',
        });

        // If cancelled by customer, alert store administrators so fulfillment halts immediately
        if (options.cancelledBy === 'customer') {
          const configuredAdmin = (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'malwanamkeenhouse@gmail.com').trim().toLowerCase();
          const adminEmails = configuredAdmin ? [configuredAdmin] : ['malwanamkeenhouse@gmail.com'];

          if (adminEmails.length > 0) {
            await sendCustomerOrderCancellationAdminAlert({
              order: updatedOrder,
              adminEmails,
              cancelledBy: 'customer',
              reason: options.reason,
            });
          }
        }

        // If order has an active Shiprocket order ID, notify Shiprocket to cancel the shipment
        if (updatedOrder.shiprocketDetails?.orderId) {
          try {
            await cancelShiprocketOrder([updatedOrder.shiprocketDetails.orderId]);
          } catch (srErr) {
            console.warn('[Cancellation Shiprocket Warning] Failed to cancel Shiprocket order:', srErr);
          }
        }
      } catch (emailErr) {
        console.warn('[Cancellation Email Warning] Failed to dispatch cancellation email:', emailErr);
      }
    })();
  }

  const success = allItemsRestored;
  let message = 'Order cancelled successfully and reserved inventory returned to stock.';
  if (!allItemsRestored) {
    message = anyItemsRestored
      ? `Order cancelled, but some items could not be restocked (${warnings.join('; ')}). Retry is permitted.`
      : `Order cancelled, but inventory restoration failed: ${warnings.join('; ')}.`;
  }

  return {
    success,
    alreadyCancelled: false,
    order: updatedOrder || lockedOrder,
    restoredItems,
    couponRestored,
    warnings,
    message,
  };
}
