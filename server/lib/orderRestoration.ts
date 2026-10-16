import mongoose, { Types } from 'mongoose';
import { Order, type IOrder, type OrderStatus, type IRestorationItemDetail } from '../models/Order.ts';
import { Product } from '../models/Product.ts';
import { Discount } from '../models/Discount.ts';
import { sendOrderStatusUpdate } from './emailService.ts';

export interface CancelOrderResult {
  success: boolean;
  alreadyCancelled?: boolean;
  order?: IOrder;
  restoredItems: IRestorationItemDetail[];
  couponRestored: boolean;
  warnings: string[];
  message: string;
}

/**
 * Safely, idempotently, and atomically cancels an order and restores its reserved inventory.
 *
 * Concurrency Safety Architecture:
 * - Uses MongoDB's atomic findOneAndUpdate with conditional filters ({ _id, inventoryRestored: { $ne: true } }).
 * - Only ONE concurrent execution will win the update lock; all subsequent or concurrent
 *   invocations find null and are prevented from executing duplicate stock increments or coupon rollbacks.
 * - Restores exact variant quantities via atomic $inc on the matching variant.
 * - Handles missing products or variants gracefully by logging explicit warnings without claiming success.
 * - Rolls back coupon usage count exactly once if a discount code was redeemed.
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

  // 1. Build atomic claim query
  const filter: any = {
    _id: cleanId,
    inventoryRestored: { $ne: true },
  };

  if (options.allowedCurrentStatuses && options.allowedCurrentStatuses.length > 0) {
    filter.orderStatus = { $in: options.allowedCurrentStatuses };
  } else {
    filter.orderStatus = { $ne: 'cancelled' };
  }

  // Atomic state transition: Claims the cancellation and inventory restoration lock
  const orderBeforeUpdate = await Order.findOneAndUpdate(
    filter,
    {
      $set: {
        orderStatus: 'cancelled',
        inventoryRestored: true,
        cancelledAt: new Date(),
        cancelledBy: options.cancelledBy,
        cancellationReason: options.reason ? options.reason.trim() : '',
      },
    },
    { new: false } // Returns document before update
  );

  // If orderBeforeUpdate is null, either:
  // a) Order does not exist
  // b) Order was already cancelled and inventoryRestored === true
  // c) Order status is not in allowedCurrentStatuses (e.g., shipped or delivered)
  if (!orderBeforeUpdate) {
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

    if (existing.orderStatus === 'cancelled' || existing.inventoryRestored) {
      return {
        success: true,
        alreadyCancelled: true,
        order: existing,
        restoredItems: existing.restorationDetails || [],
        couponRestored: Boolean(existing.couponRestored),
        warnings: [],
        message: 'Order was already cancelled and inventory was previously restored.',
      };
    }

    return {
      success: false,
      order: existing,
      restoredItems: [],
      couponRestored: false,
      warnings: [`Order status "${existing.orderStatus}" is not eligible for cancellation.`],
      message: `Orders in status "${existing.orderStatus}" cannot be cancelled.`,
    };
  }

  // At this point, THIS request acquired the exclusive lock to restore stock and coupons
  const restoredItems: IRestorationItemDetail[] = [];
  const warnings: string[] = [];
  let couponRestored = false;

  // 2. Restore Product Variant Stock
  if (Array.isArray(orderBeforeUpdate.items)) {
    for (const item of orderBeforeUpdate.items) {
      const qty = item.quantity;
      if (!qty || qty <= 0) continue;

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

        // Match the target variant
        let matchedVariant: any = null;
        if (Array.isArray(product.variants)) {
          // 1. Direct match by variantId if available
          if (item.variantId) {
            matchedVariant = product.variants.find(
              (v: any) => v._id && v._id.toString() === item.variantId!.toString()
            );
          }
          // 2. Match by SKU snapshot
          if (!matchedVariant && item.sku) {
            matchedVariant = product.variants.find((v: any) => v.sku && v.sku === item.sku);
          }
          // 3. Fallback match by variant label snapshot
          if (!matchedVariant && item.variantLabel) {
            matchedVariant = product.variants.find(
              (v: any) =>
                v.label === item.variantLabel ||
                `${v.value || ''} ${v.unit || ''}`.trim() === item.variantLabel
            );
          }
        }

        if (!matchedVariant) {
          itemDetail.error = `Variant "${item.variantLabel}" (SKU: ${item.sku}) no longer exists on product "${product.name}"`;
          warnings.push(`Cannot restore stock for "${item.productName} (${item.variantLabel})": Variant not found.`);
          restoredItems.push(itemDetail);
          continue;
        }

        // Atomically increment stock on the matching variant
        const updateResult = await Product.updateOne(
          { _id: product._id, 'variants._id': matchedVariant._id },
          { $inc: { 'variants.$.stock': qty } }
        );

        if (updateResult.modifiedCount > 0) {
          itemDetail.restored = true;
          itemDetail.variantId = matchedVariant._id.toString();
        } else {
          itemDetail.error = 'MongoDB Product update returned 0 modifiedCount';
          warnings.push(`Failed to update stock for "${item.productName} (${item.variantLabel})".`);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        itemDetail.error = errMsg;
        warnings.push(`Error updating stock for "${item.productName}": ${errMsg}`);
      }

      restoredItems.push(itemDetail);
    }
  }

  // 3. Roll back coupon usage count if a valid coupon code was used
  if (orderBeforeUpdate.discountCode && orderBeforeUpdate.discountCode.trim()) {
    const code = orderBeforeUpdate.discountCode.trim().toUpperCase();
    try {
      const discountUpdate = await Discount.updateOne(
        { code, usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } }
      );
      if (discountUpdate.modifiedCount > 0) {
        couponRestored = true;
      }
    } catch (couponErr: unknown) {
      const errMsg = couponErr instanceof Error ? couponErr.message : String(couponErr);
      warnings.push(`Failed to rollback coupon usage for "${code}": ${errMsg}`);
    }
  }

  // 4. Update the order with complete restoration details and couponRestored flag
  const updatedOrder = await Order.findByIdAndUpdate(
    cleanId,
    {
      $set: {
        couponRestored,
        restorationDetails: restoredItems,
      },
    },
    { new: true }
  );

  // 5. Asynchronously dispatch order cancellation email notification to customer
  if (updatedOrder) {
    (async () => {
      try {
        await sendOrderStatusUpdate({
          order: updatedOrder,
          previousStatus: orderBeforeUpdate.orderStatus,
          newStatus: 'cancelled',
        });
      } catch (emailErr) {
        console.warn('[Cancellation Email Warning] Failed to dispatch cancellation email:', emailErr);
      }
    })();
  }

  return {
    success: true,
    alreadyCancelled: false,
    order: updatedOrder || orderBeforeUpdate,
    restoredItems,
    couponRestored,
    warnings,
    message: warnings.length > 0
      ? `Order cancelled. Note: Some items could not be restocked (${warnings.join('; ')}).`
      : 'Order cancelled successfully and reserved inventory returned to stock.',
  };
}
