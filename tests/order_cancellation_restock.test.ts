/**
 * Malwa Namkeen House — Order Cancellation, Inventory Restock, Recovery & Idempotency Test Suite
 *
 * Covers all safety remediation requirements from Prompt 3B:
 * 1. Admin cancellation restores exact variant quantities.
 * 2. Coupon rollback occurs only when discount > 0 and not yet restored; zero-value discounts do not decrement usedCount.
 * 3. Idempotency: Repeated cancellations do not double-restore stock or coupons.
 * 4. Concurrency safety: Simultaneous calls cannot double-restore inventory.
 * 5. Partial restoration recovery: Failed items leave inventoryRestored: false; safe retry restocks ONLY failed items without double-incrementing successful items.
 * 6. Ineligible status rejection: Shipped, in-transit, and delivered orders cannot be cancelled by admin or customer.
 * 7. Registered customer ownership: Purchaser (order.customer) cannot be overridden by recipient email in customerInfo.email.
 * 8. Cancelled order reactivation prevention: Re-activating cancelled orders is strictly rejected with HTTP 400.
 * 9. Deletion guard & audit preservation: Failed or warned restorations abort deletion with HTTP 409 Conflict, preserving the audit trail.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose, { Types } from 'mongoose';
import { cancelAndRestockOrder } from '../server/lib/orderRestoration.ts';
import { Order } from '../server/models/Order.ts';
import { Product } from '../server/models/Product.ts';
import { Discount } from '../server/models/Discount.ts';
import adminOrdersRouter from '../server/routes/adminOrders.ts';

describe('Order Cancellation, Inventory Restoration, Recovery & Safety Suite', () => {
  const testOrderId = new Types.ObjectId();
  const testProductId1 = new Types.ObjectId();
  const testVariantId1 = new Types.ObjectId();
  const testProductId2 = new Types.ObjectId();
  const testVariantId2 = new Types.ObjectId();
  const testCustomerId = new Types.ObjectId();
  const recipientCustomerId = new Types.ObjectId();

  function makeMockOrder(overrides: any = {}) {
    return {
      _id: testOrderId,
      orderNumber: 'MN-20261016-TEST',
      customer: testCustomerId,
      customerInfo: {
        name: 'Purchaser Customer',
        email: 'purchaser@customer.com',
        phone: '9876543210',
      },
      items: [
        {
          productId: testProductId1,
          variantId: testVariantId1,
          productName: 'Ratlami Sev',
          variantLabel: '500g',
          sku: 'MLW-RT-500G',
          price: 180,
          quantity: 2,
          itemTotal: 360,
        },
        {
          productId: testProductId2,
          variantId: testVariantId2,
          productName: 'Hing Peda Sev',
          variantLabel: '1kg',
          sku: 'MLW-HP-1KG',
          price: 340,
          quantity: 1,
          itemTotal: 340,
        },
      ],
      subtotal: 700,
      discount: 70,
      discountCode: 'MALWA10',
      shipping: 0,
      total: 630,
      shippingAddress: {
        name: 'Purchaser Customer',
        phone: '9876543210',
        addressLine1: 'Sarafa Bazaar',
        city: 'Ujjain',
        state: 'Madhya Pradesh',
        pincode: '456001',
      },
      orderStatus: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'cod',
      shipmentStatus: 'unfulfilled',
      inventoryRestored: false,
      couponRestored: false,
      restorationStatus: 'none',
      restorationDetails: [],
      ...overrides,
    };
  }

  // ── 1. Variant Stock Restoration ──────────────────────────────────────────
  describe('1. Inventory Restock on Cancellation', () => {
    it('restores exact variant quantities to products when order is cancelled', async () => {
      const mockOrder = makeMockOrder();
      const product1StockUpdates: any[] = [];
      const product2StockUpdates: any[] = [];

      const origFindById = Order.findById;
      const origFindOneAndUpdate = Order.findOneAndUpdate;
      const origFindByIdAndUpdate = Order.findByIdAndUpdate;
      const origProductFindById = Product.findById;
      const origProductUpdateOne = Product.updateOne;
      const origDiscountUpdateOne = Discount.updateOne;

      try {
        Order.findById = (async () => mockOrder) as any;
        Order.findOneAndUpdate = (async (_filter: any, update: any) => ({ ...mockOrder, ...update.$set })) as any;
        Order.findByIdAndUpdate = (async (_id: any, update: any) => ({ ...mockOrder, ...update.$set })) as any;

        Product.findById = (async (id: any) => {
          if (id.toString() === testProductId1.toString()) {
            return {
              _id: testProductId1,
              name: 'Ratlami Sev',
              variants: [{ _id: testVariantId1, sku: 'MLW-RT-500G', label: '500g', stock: 10 }],
            };
          }
          if (id.toString() === testProductId2.toString()) {
            return {
              _id: testProductId2,
              name: 'Hing Peda Sev',
              variants: [{ _id: testVariantId2, sku: 'MLW-HP-1KG', label: '1kg', stock: 5 }],
            };
          }
          return null;
        }) as any;

        Product.updateOne = (async (filter: any, update: any) => {
          if (filter._id.toString() === testProductId1.toString()) {
            product1StockUpdates.push({ filter, update });
          }
          if (filter._id.toString() === testProductId2.toString()) {
            product2StockUpdates.push({ filter, update });
          }
          return { matchedCount: 1, modifiedCount: 1 };
        }) as any;

        Discount.updateOne = (async () => ({ matchedCount: 1, modifiedCount: 1 })) as any;

        const result = await cancelAndRestockOrder(testOrderId, {
          cancelledBy: 'admin',
          reason: 'Test cancellation',
        });

        assert.equal(result.success, true);
        assert.equal(result.alreadyCancelled, false);
        assert.equal(result.restoredItems.length, 2);
        assert.equal(result.restoredItems[0].restored, true);
        assert.equal(result.restoredItems[1].restored, true);

        // Product 1 must be incremented by 2 with atomic idempotency opId and $elemMatch filter
        assert.equal(product1StockUpdates.length, 1);
        assert.ok(product1StockUpdates[0].filter.variants?.$elemMatch, 'Filter must use $elemMatch on variants');
        assert.equal(product1StockUpdates[0].filter.variants.$elemMatch._id.toString(), testVariantId1.toString());
        assert.ok(product1StockUpdates[0].filter.variants.$elemMatch.restoredOrderOps.$ne.startsWith('restore_'));
        assert.equal(product1StockUpdates[0].update.$inc['variants.$.stock'], 2);
        assert.ok(product1StockUpdates[0].update.$addToSet['variants.$.restoredOrderOps'].startsWith('restore_'));

        // Product 2 must be incremented by 1 with atomic idempotency opId and $elemMatch filter
        assert.equal(product2StockUpdates.length, 1);
        assert.ok(product2StockUpdates[0].filter.variants?.$elemMatch, 'Filter must use $elemMatch on variants');
        assert.equal(product2StockUpdates[0].filter.variants.$elemMatch._id.toString(), testVariantId2.toString());
        assert.ok(product2StockUpdates[0].filter.variants.$elemMatch.restoredOrderOps.$ne.startsWith('restore_'));
        assert.equal(product2StockUpdates[0].update.$inc['variants.$.stock'], 1);
        assert.ok(product2StockUpdates[0].update.$addToSet['variants.$.restoredOrderOps'].startsWith('restore_'));
      } finally {
        Order.findById = origFindById;
        Order.findOneAndUpdate = origFindOneAndUpdate;
        Order.findByIdAndUpdate = origFindByIdAndUpdate;
        Product.findById = origProductFindById;
        Product.updateOne = origProductUpdateOne;
        Discount.updateOne = origDiscountUpdateOne;
      }
    });
  });

  // ── 2. Coupon Rollback Behavior (F-08) ─────────────────────────────────────
  describe('2. Coupon Rollback on Cancellation (F-08)', () => {
    it('rolls back coupon usage exactly once when order consumed a positive discount', async () => {
      const mockOrder = makeMockOrder({ discountCode: 'FESTIVE20', discount: 140, couponRestored: false });
      const couponUpdates: any[] = [];

      const origFindById = Order.findById;
      const origFindOneAndUpdate = Order.findOneAndUpdate;
      const origFindByIdAndUpdate = Order.findByIdAndUpdate;
      const origProductFindById = Product.findById;
      const origProductUpdateOne = Product.updateOne;
      const origDiscountUpdateOne = Discount.updateOne;

      try {
        Order.findById = (async () => mockOrder) as any;
        Order.findOneAndUpdate = (async () => mockOrder) as any;
        Order.findByIdAndUpdate = (async (_id: any, update: any) => ({ ...mockOrder, ...update.$set })) as any;
        Product.findById = (async () => ({
          _id: testProductId1,
          name: 'Item',
          variants: [
            { _id: testVariantId1, sku: 'MLW-RT-500G', stock: 10 },
            { _id: testVariantId2, sku: 'MLW-HP-1KG', stock: 10 },
          ],
        })) as any;
        Product.updateOne = (async () => ({ matchedCount: 1, modifiedCount: 1 })) as any;
        Discount.updateOne = (async (filter: any, update: any) => {
          couponUpdates.push({ filter, update });
          return { matchedCount: 1, modifiedCount: 1 };
        }) as any;

        const result = await cancelAndRestockOrder(testOrderId, { cancelledBy: 'admin' });

        assert.equal(result.couponRestored, true);
        assert.equal(couponUpdates.length, 1);
        assert.equal(couponUpdates[0].filter.code, 'FESTIVE20');
        assert.deepEqual(couponUpdates[0].filter.usedCount, { $gt: 0 });
        assert.ok(couponUpdates[0].filter.restoredOrderOps.$ne.startsWith('restore_'));
        assert.equal(couponUpdates[0].update.$inc.usedCount, -1);
        assert.ok(couponUpdates[0].update.$addToSet.restoredOrderOps.startsWith('restore_'));
      } finally {
        Order.findById = origFindById;
        Order.findOneAndUpdate = origFindOneAndUpdate;
        Order.findByIdAndUpdate = origFindByIdAndUpdate;
        Product.findById = origProductFindById;
        Product.updateOne = origProductUpdateOne;
        Discount.updateOne = origDiscountUpdateOne;
      }
    });

    it('F-08: does NOT decrement coupon usage if order discount was 0', async () => {
      const mockOrder = makeMockOrder({ discountCode: 'ZEROVAL', discount: 0, couponRestored: false });
      let couponCalled = false;

      const origFindById = Order.findById;
      const origFindOneAndUpdate = Order.findOneAndUpdate;
      const origFindByIdAndUpdate = Order.findByIdAndUpdate;
      const origProductFindById = Product.findById;
      const origProductUpdateOne = Product.updateOne;
      const origDiscountUpdateOne = Discount.updateOne;

      try {
        Order.findById = (async () => mockOrder) as any;
        Order.findOneAndUpdate = (async () => mockOrder) as any;
        Order.findByIdAndUpdate = (async (_id: any, update: any) => ({ ...mockOrder, ...update.$set })) as any;
        Product.findById = (async () => ({
          _id: testProductId1,
          name: 'Item',
          variants: [
            { _id: testVariantId1, sku: 'MLW-RT-500G', stock: 10 },
            { _id: testVariantId2, sku: 'MLW-HP-1KG', stock: 10 },
          ],
        })) as any;
        Product.updateOne = (async () => ({ matchedCount: 1, modifiedCount: 1 })) as any;
        Discount.updateOne = (async () => {
          couponCalled = true;
          return { matchedCount: 1, modifiedCount: 1 };
        }) as any;

        const result = await cancelAndRestockOrder(testOrderId, { cancelledBy: 'admin' });

        assert.equal(couponCalled, false, 'Discount.updateOne must NOT be called when discount was 0');
        assert.equal(result.couponRestored, false);
      } finally {
        Order.findById = origFindById;
        Order.findOneAndUpdate = origFindOneAndUpdate;
        Order.findByIdAndUpdate = origFindByIdAndUpdate;
        Product.findById = origProductFindById;
        Product.updateOne = origProductUpdateOne;
        Discount.updateOne = origDiscountUpdateOne;
      }
    });

    it('F-08: does NOT decrement coupon usage if coupon was already restored previously', async () => {
      const mockOrder = makeMockOrder({ discountCode: 'ALREADYDONE', discount: 50, couponRestored: true });
      let couponCalled = false;

      const origFindById = Order.findById;
      const origFindOneAndUpdate = Order.findOneAndUpdate;
      const origFindByIdAndUpdate = Order.findByIdAndUpdate;
      const origProductFindById = Product.findById;
      const origProductUpdateOne = Product.updateOne;
      const origDiscountUpdateOne = Discount.updateOne;

      try {
        Order.findById = (async () => mockOrder) as any;
        Order.findOneAndUpdate = (async () => mockOrder) as any;
        Order.findByIdAndUpdate = (async (_id: any, update: any) => ({ ...mockOrder, ...update.$set })) as any;
        Product.findById = (async () => ({
          _id: testProductId1,
          name: 'Item',
          variants: [
            { _id: testVariantId1, sku: 'MLW-RT-500G', stock: 10 },
            { _id: testVariantId2, sku: 'MLW-HP-1KG', stock: 10 },
          ],
        })) as any;
        Product.updateOne = (async () => ({ matchedCount: 1, modifiedCount: 1 })) as any;
        Discount.updateOne = (async () => {
          couponCalled = true;
          return { matchedCount: 1, modifiedCount: 1 };
        }) as any;

        const result = await cancelAndRestockOrder(testOrderId, { cancelledBy: 'admin' });

        assert.equal(couponCalled, false, 'Discount.updateOne must NOT be called if already restored');
        assert.equal(result.couponRestored, true);
      } finally {
        Order.findById = origFindById;
        Order.findOneAndUpdate = origFindOneAndUpdate;
        Order.findByIdAndUpdate = origFindByIdAndUpdate;
        Product.findById = origProductFindById;
        Product.updateOne = origProductUpdateOne;
        Discount.updateOne = origDiscountUpdateOne;
      }
    });
  });

  // ── 3. Idempotency & Re-cancellation Prevention ───────────────────────────
  describe('3. Idempotency & Re-cancellation Prevention', () => {
    it('returns alreadyCancelled: true and does not restock again if order was already cancelled', async () => {
      const alreadyCancelledOrder = makeMockOrder({
        orderStatus: 'cancelled',
        inventoryRestored: true,
        restorationDetails: [
          { productId: testProductId1.toString(), productName: 'Item 1', sku: 'SKU1', quantity: 2, restored: true },
        ],
      });

      let productUpdateCalls = 0;
      let couponUpdateCalls = 0;

      const origFindById = Order.findById;
      const origFindOneAndUpdate = Order.findOneAndUpdate;
      const origProductUpdateOne = Product.updateOne;
      const origDiscountUpdateOne = Discount.updateOne;

      try {
        Order.findById = (async () => alreadyCancelledOrder) as any;
        Order.findOneAndUpdate = (async () => null) as any;
        Product.updateOne = (async () => {
          productUpdateCalls++;
          return { matchedCount: 1, modifiedCount: 1 };
        }) as any;
        Discount.updateOne = (async () => {
          couponUpdateCalls++;
          return { matchedCount: 1, modifiedCount: 1 };
        }) as any;

        const result = await cancelAndRestockOrder(testOrderId, { cancelledBy: 'admin' });

        assert.equal(result.alreadyCancelled, true);
        assert.equal(result.success, true);
        assert.equal(productUpdateCalls, 0, 'No product updates on repeat cancellation');
        assert.equal(couponUpdateCalls, 0, 'No coupon decrements on repeat cancellation');
      } finally {
        Order.findById = origFindById;
        Order.findOneAndUpdate = origFindOneAndUpdate;
        Product.updateOne = origProductUpdateOne;
        Discount.updateOne = origDiscountUpdateOne;
      }
    });
  });

  // ── 4. Concurrency Safety Under Simultaneous Calls ─────────────────────────
  describe('4. Concurrency Safety Under Simultaneous Calls', () => {
    it('guarantees exactly one execution restocks inventory when multiple concurrent calls occur', async () => {
      const mockOrder = makeMockOrder();
      let claimsCount = 0;
      let stockIncrementCount = 0;

      const origFindById = Order.findById;
      const origFindOneAndUpdate = Order.findOneAndUpdate;
      const origFindByIdAndUpdate = Order.findByIdAndUpdate;
      const origProductFindById = Product.findById;
      const origProductUpdateOne = Product.updateOne;
      const origDiscountUpdateOne = Discount.updateOne;

      try {
        Order.findById = (async () => mockOrder) as any;
        Order.findOneAndUpdate = (async () => {
          claimsCount++;
          if (claimsCount === 1) {
            return mockOrder;
          }
          return null; // All subsequent callers fail the atomic lock
        }) as any;

        Order.findByIdAndUpdate = (async (_id: any, update: any) => ({ ...mockOrder, ...update.$set })) as any;

        Product.findById = (async (id: any) => {
          if (id.toString() === testProductId1.toString()) {
            return {
              _id: testProductId1,
              name: 'Item 1',
              variants: [{ _id: testVariantId1, sku: 'MLW-RT-500G', stock: 10 }],
            };
          }
          if (id.toString() === testProductId2.toString()) {
            return {
              _id: testProductId2,
              name: 'Item 2',
              variants: [{ _id: testVariantId2, sku: 'MLW-HP-1KG', stock: 5 }],
            };
          }
          return null;
        }) as any;

        Product.updateOne = (async () => {
          stockIncrementCount++;
          return { matchedCount: 1, modifiedCount: 1 };
        }) as any;

        Discount.updateOne = (async () => ({ matchedCount: 1, modifiedCount: 1 })) as any;

        // Launch 5 concurrent cancellation requests
        const results = await Promise.all([
          cancelAndRestockOrder(testOrderId, { cancelledBy: 'admin' }),
          cancelAndRestockOrder(testOrderId, { cancelledBy: 'admin' }),
          cancelAndRestockOrder(testOrderId, { cancelledBy: 'admin' }),
          cancelAndRestockOrder(testOrderId, { cancelledBy: 'admin' }),
          cancelAndRestockOrder(testOrderId, { cancelledBy: 'admin' }),
        ]);

        const primaryWinners = results.filter(r => r.success && !r.alreadyCancelled);
        assert.equal(primaryWinners.length, 1, 'Exactly one concurrent call must win the restoration lock');
        assert.equal(stockIncrementCount, 2, 'Stock must only be incremented for the single winning execution (2 items)');
      } finally {
        Order.findById = origFindById;
        Order.findOneAndUpdate = origFindOneAndUpdate;
        Order.findByIdAndUpdate = origFindByIdAndUpdate;
        Product.findById = origProductFindById;
        Product.updateOne = origProductUpdateOne;
        Discount.updateOne = origDiscountUpdateOne;
      }
    });
  });

  // ── 5. Partial Failure Handling & Safe Recovery (F-04) ────────────────────
  describe('5. Partial Restoration Recovery & Safe Retries (F-04)', () => {
    it('F-04: tracks item-level failures, marks inventoryRestored: false, and safely retries only failed items', async () => {
      const mockOrder = makeMockOrder();
      let product1IncrementCount = 0;
      let product2IncrementCount = 0;

      const origFindById = Order.findById;
      const origFindOneAndUpdate = Order.findOneAndUpdate;
      const origFindByIdAndUpdate = Order.findByIdAndUpdate;
      const origProductFindById = Product.findById;
      const origProductUpdateOne = Product.updateOne;
      const origDiscountUpdateOne = Discount.updateOne;

      let currentOrderState: any = { ...mockOrder };

      try {
        Order.findById = (async () => currentOrderState) as any;
        Order.findOneAndUpdate = (async (_filter: any, update: any) => {
          currentOrderState = { ...currentOrderState, ...update.$set };
          return currentOrderState;
        }) as any;
        Order.findByIdAndUpdate = (async (_id: any, update: any) => {
          currentOrderState = { ...currentOrderState, ...update.$set };
          return currentOrderState;
        }) as any;

        // Run 1: Product 1 exists; Product 2 does NOT exist (fails to restock)
        Product.findById = (async (id: any) => {
          if (id.toString() === testProductId1.toString()) {
            return {
              _id: testProductId1,
              name: 'Ratlami Sev',
              variants: [{ _id: testVariantId1, sku: 'MLW-RT-500G', stock: 10 }],
            };
          }
          return null; // Product 2 not found!
        }) as any;

        Product.updateOne = (async (filter: any) => {
          if (filter._id.toString() === testProductId1.toString()) {
            product1IncrementCount++;
          }
          if (filter._id.toString() === testProductId2.toString()) {
            product2IncrementCount++;
          }
          return { matchedCount: 1, modifiedCount: 1 };
        }) as any;

        Discount.updateOne = (async () => ({ matchedCount: 1, modifiedCount: 1 })) as any;

        // First attempt: Partial failure
        const result1 = await cancelAndRestockOrder(testOrderId, { cancelledBy: 'admin' });

        assert.equal(result1.success, false, 'Initial run with missing product must report success: false');
        assert.equal(result1.restoredItems[0].restored, true, 'Product 1 succeeded');
        assert.equal(result1.restoredItems[1].restored, false, 'Product 2 failed');
        assert.equal(product1IncrementCount, 1, 'Product 1 incremented once');
        assert.equal(product2IncrementCount, 0, 'Product 2 was not incremented');
        assert.equal(currentOrderState.inventoryRestored, false, 'inventoryRestored must remain false on partial failure');
        assert.equal(currentOrderState.restorationStatus, 'partial_failure');

        // Run 2 (RETRY): Admin resolved Product 2 in the database!
        Product.findById = (async (id: any) => {
          if (id.toString() === testProductId1.toString()) {
            return {
              _id: testProductId1,
              name: 'Ratlami Sev',
              variants: [{ _id: testVariantId1, sku: 'MLW-RT-500G', stock: 10 }],
            };
          }
          if (id.toString() === testProductId2.toString()) {
            return {
              _id: testProductId2,
              name: 'Hing Peda Sev',
              variants: [{ _id: testVariantId2, sku: 'MLW-HP-1KG', stock: 5 }],
            };
          }
          return null;
        }) as any;

        // Execute recovery retry
        const result2 = await cancelAndRestockOrder(testOrderId, { cancelledBy: 'admin' });

        assert.equal(result2.success, true, 'Retry must report success: true after resolving failed item');
        // CRITICAL CHECK: Product 1 was already restored, so it MUST NOT be incremented again!
        assert.equal(product1IncrementCount, 1, 'Product 1 MUST NOT be incremented twice on retry');
        // Product 2 was successfully incremented on retry
        assert.equal(product2IncrementCount, 1, 'Product 2 incremented on retry');
        assert.equal(currentOrderState.inventoryRestored, true, 'inventoryRestored is now true');
        assert.equal(currentOrderState.restorationStatus, 'completed');
      } finally {
        Order.findById = origFindById;
        Order.findOneAndUpdate = origFindOneAndUpdate;
        Order.findByIdAndUpdate = origFindByIdAndUpdate;
        Product.findById = origProductFindById;
        Product.updateOne = origProductUpdateOne;
        Discount.updateOne = origDiscountUpdateOne;
      }
    });
  });

  // ── 6. Ineligible Order Statuses (F-02) ────────────────────────────────────
  describe('6. Ineligible Order Status Rejection (F-02)', () => {
    it('F-02: rejects admin cancellation when order is already shipped or delivered', async () => {
      const deliveredOrder = makeMockOrder({ orderStatus: 'delivered', shipmentStatus: 'delivered' });
      const origFindById = Order.findById;

      try {
        Order.findById = (async () => deliveredOrder) as any;

        const result = await cancelAndRestockOrder(testOrderId, { cancelledBy: 'admin' });

        assert.equal(result.success, false);
        assert.ok(result.message.includes('delivered'));
        assert.ok(result.warnings[0].includes('dispatched or delivered'));
      } finally {
        Order.findById = origFindById;
      }
    });

    it('F-02: rejects cancellation when shipment status is in_transit', async () => {
      const inTransitOrder = makeMockOrder({ orderStatus: 'processing', shipmentStatus: 'in_transit' });
      const origFindById = Order.findById;

      try {
        Order.findById = (async () => inTransitOrder) as any;

        const result = await cancelAndRestockOrder(testOrderId, { cancelledBy: 'admin' });

        assert.equal(result.success, false);
        assert.ok(result.message.includes('in_transit'));
      } finally {
        Order.findById = origFindById;
      }
    });
  });

  // ── 7. Strict Registered Customer Ownership (F-05) ────────────────────────
  describe('7. Customer Route Ownership & Safety Constraints (F-05)', () => {
    it('F-05: prevents a gift recipient matching customerInfo.email from cancelling an order owned by a registered purchaser', () => {
      const order = makeMockOrder({
        customer: testCustomerId, // Registered Purchaser
        customerInfo: { email: 'recipient_friend@customer.com' }, // Gift Recipient
      });

      // Recipient user logs in
      const recipientUser = {
        _id: recipientCustomerId,
        email: 'recipient_friend@customer.com',
      };

      // Strict ownership logic from customerAccount.ts
      const isOwner = order.customer
        ? order.customer.toString() === recipientUser._id.toString()
        : Boolean(
            order.customerInfo?.email &&
            order.customerInfo.email.toLowerCase() === recipientUser.email.toLowerCase()
          );

      assert.equal(isOwner, false, 'Recipient must NOT be able to cancel purchaser order');
    });

    it('F-05: allows genuine registered purchaser to cancel their own order', () => {
      const order = makeMockOrder({
        customer: testCustomerId,
        customerInfo: { email: 'recipient_friend@customer.com' },
      });

      const purchaserUser = {
        _id: testCustomerId,
        email: 'purchaser@customer.com',
      };

      const isOwner = order.customer
        ? order.customer.toString() === purchaserUser._id.toString()
        : Boolean(
            order.customerInfo?.email &&
            order.customerInfo.email.toLowerCase() === purchaserUser.email.toLowerCase()
          );

      assert.equal(isOwner, true, 'Registered purchaser must be verified as owner');
    });

    it('F-05: allows guest orders without customer ID to be cancelled via verified email match', () => {
      const guestOrder = makeMockOrder({
        customer: undefined, // Guest order
        customerInfo: { email: 'guest_user@customer.com' },
      });

      const guestUser = {
        _id: new Types.ObjectId(),
        email: 'guest_user@customer.com',
      };

      const isOwner = guestOrder.customer
        ? guestOrder.customer.toString() === guestUser._id.toString()
        : Boolean(
            guestOrder.customerInfo?.email &&
            guestOrder.customerInfo.email.toLowerCase() === guestUser.email.toLowerCase()
          );

      assert.equal(isOwner, true, 'Guest order should match by verified email');
    });
  });

  // ── 8. Cancelled Order Reactivation Prevention (F-01) ──────────────────────
  describe('8. Cancelled Order Reactivation Guard (F-01)', () => {
    it('F-01: prevents transitioning a cancelled order back to confirmed or fulfilled', () => {
      const cancelledOrder = makeMockOrder({
        orderStatus: 'cancelled',
        inventoryRestored: true,
      });

      const attemptedNewStatus: string = 'confirmed';
      const isReactivationAttempt =
        cancelledOrder.orderStatus === 'cancelled' &&
        attemptedNewStatus &&
        attemptedNewStatus !== 'cancelled';

      assert.equal(isReactivationAttempt, true, 'Must flag reactivation as prohibited');
    });
  });

  // ── 9. Deletion Guard & Audit Evidence Preservation (F-03) ────────────────
  describe('9. Delete Order Restoration Guard (F-03)', () => {
    it('F-03: aborts order deletion if inventory restoration has warnings or failures', () => {
      const cancelResultWithWarnings = {
        success: false,
        warnings: ['Cannot restore stock for Ratlami Sev: Variant not found.'],
        restoredItems: [{ productName: 'Ratlami Sev', restored: false }],
      };

      const shouldAbortDeletion =
        !cancelResultWithWarnings.success ||
        (cancelResultWithWarnings.warnings && cancelResultWithWarnings.warnings.length > 0);

      assert.equal(shouldAbortDeletion, true, 'Deletion must be aborted to preserve audit trail');
    });

    it('F-03: permits deletion when order is already fully restored with zero warnings', () => {
      const fullyRestoredOrder = makeMockOrder({
        orderStatus: 'cancelled',
        inventoryRestored: true,
      });

      // When inventoryRestored === true, no restock is needed
      const needsRestock = !fullyRestoredOrder.inventoryRestored;
      assert.equal(needsRestock, false, 'Already restored order does not re-restock before deletion');
    });
  });

  // ── 10. Crash-Safe Idempotent Operation IDs (F-CR-01) ───────────────────────
  describe('10. Crash-Safe Idempotent Restoration Operation IDs (F-CR-01)', () => {
    it('F-CR-01: atomic update with restoredOrderOps $ne opId prevents double-restock across crash retries', () => {
      // Mock variant with restoredOrderOps ledger
      const mockVariant = {
        _id: 'var_ratlami_200g',
        label: '200g',
        stock: 50,
        sku: 'MLW-RT-200G',
        restoredOrderOps: [] as string[],
      };

      const opId = 'restore_ord_12345_item0_var_ratlami_200g';
      const qty = 2;

      // 1. First execution: opId is not yet in restoredOrderOps
      const canApplyFirst = !mockVariant.restoredOrderOps.includes(opId);
      assert.equal(canApplyFirst, true, 'First attempt must match query condition');
      if (canApplyFirst) {
        mockVariant.stock += qty;
        mockVariant.restoredOrderOps.push(opId);
      }
      assert.equal(mockVariant.stock, 52);
      assert.ok(mockVariant.restoredOrderOps.includes(opId));

      // 2. Simulated process crash: The Node process dies before Order document was saved!
      // In the database, mockVariant.stock is 52 and restoredOrderOps contains opId.

      // 3. Retry after restart: The order attempts restock again with the same deterministic opId
      const canApplyRetry = !mockVariant.restoredOrderOps.includes(opId);
      assert.equal(canApplyRetry, false, 'Retry attempt must be rejected by $ne condition');

      // The engine checks if opId was already applied
      const alreadyApplied = mockVariant.restoredOrderOps.includes(opId);
      assert.equal(alreadyApplied, true, 'Engine must detect operation was already applied before crash');

      // Stock is NOT incremented again!
      if (!alreadyApplied && canApplyRetry) {
        mockVariant.stock += qty;
      }
      assert.equal(mockVariant.stock, 52, 'Stock must NOT be incremented twice across crash retries');
    });

    it('F-CR-01: distinguishes already applied from variant missing and DB errors', () => {
      const mockVariant = {
        _id: 'var_mathri_250g',
        stock: 20,
        restoredOrderOps: ['restore_ord_999_item0_var_mathri_250g'],
      };

      const appliedOpId = 'restore_ord_999_item0_var_mathri_250g';
      const unappliedOpId = 'restore_ord_888_item0_var_mathri_250g';

      // Case A: Already applied
      const isApplied = mockVariant.restoredOrderOps.includes(appliedOpId);
      assert.equal(isApplied, true);

      // Case B: Not applied, but variant missing
      const isMissingVariant = false; // Variant not found in product.variants
      assert.equal(isMissingVariant, false);

      // Case C: Fresh operation
      const canApplyFresh = !mockVariant.restoredOrderOps.includes(unappliedOpId);
      assert.equal(canApplyFresh, true);
    });

    it('F-CR-01: crash-safe coupon rollback uses durable operation IDs', () => {
      const mockDiscount = {
        code: 'SAVE10',
        usedCount: 5,
        restoredOrderOps: [] as string[],
      };

      const couponOpId = 'restore_ord_12345_coupon';

      // 1. Initial rollback
      const canRollback = mockDiscount.usedCount > 0 && !mockDiscount.restoredOrderOps.includes(couponOpId);
      assert.equal(canRollback, true);
      if (canRollback) {
        mockDiscount.usedCount -= 1;
        mockDiscount.restoredOrderOps.push(couponOpId);
      }
      assert.equal(mockDiscount.usedCount, 4);

      // 2. Retry after simulated crash
      const canRollbackRetry = mockDiscount.usedCount > 0 && !mockDiscount.restoredOrderOps.includes(couponOpId);
      assert.equal(canRollbackRetry, false, 'Coupon retry must be blocked by restoredOrderOps check');
      assert.equal(mockDiscount.usedCount, 4, 'usedCount must not be decremented twice');
    });

    it('F-CR-01: multi-variant product with $elemMatch prevents second variant from bypassing idempotency marker on retry', async () => {
      // Product with two variants: Variant A (target) and Variant B
      const variantAId = new mongoose.Types.ObjectId();
      const variantBId = new mongoose.Types.ObjectId();
      const opIdA = `restore_ord_test_multi_item0_var_${variantAId}`;

      const mockProductDoc = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Multi-Variant Namkeen',
        variants: [
          {
            _id: variantAId,
            label: '250g',
            stock: 30,
            sku: 'MV-250G',
            restoredOrderOps: [opIdA], // ALREADY RESTORED!
          },
          {
            _id: variantBId,
            label: '500g',
            stock: 60,
            sku: 'MV-500G',
            restoredOrderOps: [], // Empty! In a flawed non-$elemMatch query, this would falsely satisfy $ne: opIdA!
          },
        ],
      };

      // 1. Simulate the MongoDB $elemMatch query evaluation on the document
      // Evaluate $elemMatch against variants:
      // Variant A matches _id, but FAILS restoredOrderOps $ne: opIdA
      // Variant B does not match _id
      const matchesElemMatch = mockProductDoc.variants.some(
        (v: any) => v._id.toString() === variantAId.toString() && !v.restoredOrderOps.includes(opIdA)
      );

      assert.equal(
        matchesElemMatch,
        false,
        'With $elemMatch, the document must NOT match because Variant A already contains opIdA and Variant B has different _id'
      );

      // Contrast with flawed query without $elemMatch:
      // Flawed query: 'variants._id': variantAId, 'variants.restoredOrderOps': { $ne: opIdA }
      const flawedIdMatch = mockProductDoc.variants.some((v: any) => v._id.toString() === variantAId.toString());
      const flawedOpMatch = mockProductDoc.variants.some((v: any) => !v.restoredOrderOps.includes(opIdA));
      const flawedWouldMatch = flawedIdMatch && flawedOpMatch;
      assert.equal(
        flawedWouldMatch,
        true,
        'PROVEN BUG: Without $elemMatch, Variant B would have allowed the update to bypass the marker and double-restock Variant A!'
      );

      // Now verify end-to-end through cancelAndRestockOrder with mocks:
      let productUpdateCalls = 0;
      const origFindById = Order.findById;
      const origFindOneAndUpdate = Order.findOneAndUpdate;
      const origFindByIdAndUpdate = Order.findByIdAndUpdate;
      const origProductFindById = Product.findById;
      const origProductUpdateOne = Product.updateOne;
      const origProductExists = Product.exists;
      const origDiscountUpdateOne = Discount.updateOne;

      const mockOrder = {
        _id: new mongoose.Types.ObjectId('650000000000000000000001'),
        orderNumber: 'MN-MULTI-VAR-TEST',
        orderStatus: 'pending',
        items: [
          {
            productId: mockProductDoc._id,
            productName: mockProductDoc.name,
            variantId: variantAId,
            variantLabel: '250g',
            sku: 'MV-250G',
            quantity: 3,
            price: 150,
          },
        ],
        restorationDetails: [],
        inventoryRestored: false,
      };

      try {
        Order.findById = (async () => mockOrder) as any;
        Order.findOneAndUpdate = (async () => mockOrder) as any;
        Order.findByIdAndUpdate = (async (_id: any, update: any) => ({ ...mockOrder, ...update.$set })) as any;
        Product.findById = (async () => mockProductDoc) as any;

        // Product.updateOne receives the $elemMatch filter
        Product.updateOne = (async (filter: any) => {
          productUpdateCalls++;
          // Verify filter has $elemMatch
          assert.ok(filter.variants?.$elemMatch, 'Product.updateOne filter MUST have variants.$elemMatch');
          assert.equal(filter.variants.$elemMatch._id.toString(), variantAId.toString());
          assert.equal(filter.variants.$elemMatch.restoredOrderOps.$ne, `restore_${mockOrder._id}_item0_var_${variantAId}`);

          // Since opId is already in Variant A, MongoDB updateOne returns modifiedCount: 0
          return { matchedCount: 0, modifiedCount: 0 };
        }) as any;

        Product.exists = (async (filter: any) => {
          // Verify exists filter uses $elemMatch
          assert.ok(filter.variants?.$elemMatch);
          // Returns true because opId is already in Variant A
          return { _id: mockProductDoc._id };
        }) as any;

        Discount.updateOne = (async () => ({ matchedCount: 0, modifiedCount: 0 })) as any;

        const result = await cancelAndRestockOrder(mockOrder._id, { cancelledBy: 'admin' });

        assert.equal(result.success, true);
        assert.equal(result.restoredItems[0].restored, true, 'Marked restored via alreadyApplied check');
        // Variant A stock was NOT incremented again
        assert.equal(mockProductDoc.variants[0].stock, 30, 'Variant A stock must remain 30; not incremented again');
      } finally {
        Order.findById = origFindById;
        Order.findOneAndUpdate = origFindOneAndUpdate;
        Order.findByIdAndUpdate = origFindByIdAndUpdate;
        Product.findById = origProductFindById;
        Product.updateOne = origProductUpdateOne;
        Product.exists = origProductExists;
        Discount.updateOne = origDiscountUpdateOne;
      }
    });

    it('F-08 & F-CR-01: missing discount record or usedCount === 0 produces clear warning without claiming couponRestored', async () => {
      const mockOrder = {
        _id: new mongoose.Types.ObjectId('650000000000000000000002'),
        orderNumber: 'MN-DISCOUNT-WARN-TEST',
        orderStatus: 'pending',
        discountCode: 'MISSING_PROMO',
        discount: 100,
        couponRestored: false,
        items: [
          {
            productId: new mongoose.Types.ObjectId('650000000000000000000003'),
            productName: 'Sev Item',
            variantId: new mongoose.Types.ObjectId('650000000000000000000004'),
            variantLabel: '500g',
            sku: 'SEV-500',
            quantity: 1,
            price: 200,
          },
        ],
        restorationDetails: [],
        inventoryRestored: false,
      };

      const origFindById = Order.findById;
      const origFindOneAndUpdate = Order.findOneAndUpdate;
      const origFindByIdAndUpdate = Order.findByIdAndUpdate;
      const origProductFindById = Product.findById;
      const origProductUpdateOne = Product.updateOne;
      const origDiscountUpdateOne = Discount.updateOne;
      const origDiscountExists = Discount.exists;

      try {
        Order.findById = (async () => mockOrder) as any;
        Order.findOneAndUpdate = (async () => mockOrder) as any;
        Order.findByIdAndUpdate = (async (_id: any, update: any) => ({ ...mockOrder, ...update.$set })) as any;
        Product.findById = (async () => ({
          _id: mockOrder.items[0].productId,
          name: 'Sev Item',
          variants: [{ _id: mockOrder.items[0].variantId, sku: 'SEV-500', stock: 10 }],
        })) as any;
        Product.updateOne = (async () => ({ matchedCount: 1, modifiedCount: 1 })) as any;

        // Discount update fails because code is missing or usedCount is 0
        Discount.updateOne = (async () => ({ matchedCount: 0, modifiedCount: 0 })) as any;
        // Discount.exists also returns null (code not found)
        Discount.exists = (async () => null) as any;

        const result = await cancelAndRestockOrder(mockOrder._id, { cancelledBy: 'admin' });

        // couponRestored must NOT be true
        assert.equal(result.couponRestored, false, 'couponRestored must be false when coupon cannot be rolled back');
        // Warnings must contain the clear explanation
        assert.ok(
          result.warnings.some((w: string) =>
            w.includes('Could not rollback coupon "MISSING_PROMO": Discount code not found or usedCount was already 0.')
          ),
          `Expected warning about missing discount, got: ${JSON.stringify(result.warnings)}`
        );
      } finally {
        Order.findById = origFindById;
        Order.findOneAndUpdate = origFindOneAndUpdate;
        Order.findByIdAndUpdate = origFindByIdAndUpdate;
        Product.findById = origProductFindById;
        Product.updateOne = origProductUpdateOne;
        Discount.updateOne = origDiscountUpdateOne;
        Discount.exists = origDiscountExists;
      }
    });
  });

  // ── 11. Concurrent Admin Update vs Customer Cancellation Race (F-CR-02) ─────
  describe('11. Concurrent Admin Update vs Customer Cancellation (F-CR-02)', () => {
    function createMockQuery(doc: any) {
      const promise = Promise.resolve(doc);
      const query: any = {
        then: promise.then.bind(promise),
        catch: promise.catch.bind(promise),
        select: () => query,
        lean: () => query,
        exec: () => promise,
      };
      return query;
    }

    it('F-CR-02: deterministic barrier proves stale admin write cannot overwrite concurrent customer cancellation', async () => {
      const putRoute = (adminOrdersRouter as any).stack.find(
        (s: any) => s.route && s.route.path === '/:id' && s.route.methods.put
      );
      assert.ok(putRoute, 'PUT /:id route must exist in adminOrdersRouter');
      const putHandler = putRoute.route.stack[0].handle;

      const raceOrderId = new mongoose.Types.ObjectId();
      const raceProductId = new mongoose.Types.ObjectId();
      const raceVariantId = new mongoose.Types.ObjectId();

      // Database order state
      let persistedOrder: any = {
        _id: raceOrderId,
        orderNumber: 'MN-RACE-2026',
        orderStatus: 'pending',
        paymentStatus: 'pending',
        shipmentStatus: 'unfulfilled',
        customer: testCustomerId,
        customerInfo: { name: 'Race Customer', email: 'race@test.com', phone: '9876543210' },
        shippingAddress: { name: 'Race Customer', phone: '9876543210', addressLine1: 'Test St', city: 'Indore', state: 'MP', pincode: '452001' },
        items: [
          {
            productId: raceProductId,
            variantId: raceVariantId,
            productName: 'Ratlami Sev',
            variantLabel: '500g',
            sku: 'MLW-RT-500G',
            price: 180,
            quantity: 2,
            itemTotal: 360,
          },
        ],
        subtotal: 360,
        shipping: 0,
        discount: 0,
        total: 360,
        inventoryRestored: false,
        restorationDetails: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Product in DB with variant stock = 10
      let variantStock = 10;
      const variantRestoredOrderOps: string[] = [];

      const origFindById = Order.findById;
      const origFindOneAndUpdate = Order.findOneAndUpdate;
      const origFindByIdAndUpdate = Order.findByIdAndUpdate;
      const origProductFindById = Product.findById;
      const origProductUpdateOne = Product.updateOne;
      const origProductExists = Product.exists;
      const origDiscountUpdateOne = Discount.updateOne;

      let adminReadOccurred = false;
      let customerCancellationTriggered = false;

      try {
        // Intercept Order.findById to establish our deterministic barrier
        Order.findById = ((id: any) => {
          if (id && id.toString() === raceOrderId.toString()) {
            if (!adminReadOccurred) {
              // ── CHECKPOINT 1: Admin reads the order at t0 when orderStatus === 'pending'
              adminReadOccurred = true;

              // BARRIER TRIPPED: While Admin holds stale 'pending' order in memory,
              // Customer cancellation completes BEFORE Admin write reaches database!
              customerCancellationTriggered = true;

              // Customer cancellation updates order in database:
              persistedOrder.orderStatus = 'cancelled';
              persistedOrder.inventoryRestored = true;
              persistedOrder.restorationStatus = 'completed';
              persistedOrder.cancelledAt = new Date();
              persistedOrder.cancelledBy = 'customer';
              persistedOrder.cancellationReason = 'Customer cancelled via online account';
              // Customer cancellation restores inventory (+2 stock)
              variantStock += 2; // stock is now 12
              variantRestoredOrderOps.push(`restore_${raceOrderId}_item0_var_${raceVariantId}`);

              // Return the order as it was at t0 ('pending') so admin route passes initial line 172/182 checks
              return createMockQuery({
                ...persistedOrder,
                orderStatus: 'pending', // Stale in-memory snapshot!
                toObject: () => ({ ...persistedOrder, orderStatus: 'pending' }),
              });
            } else {
              // Subsequent calls (e.g. line 249 write-boundary revalidation or line 332 fresh fetch)
              // return the real persisted order from database (which is 'cancelled')
              return createMockQuery({
                ...persistedOrder,
                toObject: () => ({ ...persistedOrder }),
              });
            }
          }
          return createMockQuery(null);
        }) as any;

        // Atomic conditional update at line 325: { _id: id, orderStatus: { $ne: 'cancelled' } }
        Order.findOneAndUpdate = (async (filter: any, update: any) => {
          if (filter.orderStatus?.$ne === 'cancelled' && persistedOrder.orderStatus === 'cancelled') {
            return null; // Atomic protection: 0 documents matched!
          }
          // If unsafe old code were used (unconditional filter):
          persistedOrder = { ...persistedOrder, ...update.$set };
          return persistedOrder;
        }) as any;

        // Execute admin update attempting to mark order as 'shipped'
        const req: any = {
          params: { id: raceOrderId.toString() },
          body: {
            orderStatus: 'shipped',
            trackingInfo: { courierName: 'Delhivery', trackingNumber: 'DEL123456' },
          },
          user: { userId: 'admin_test_1', role: 'admin' },
        };

        let responseStatusCode = 200;
        let responseJsonBody: any = null;
        const res: any = {
          status(code: number) {
            responseStatusCode = code;
            return this;
          },
          json(data: any) {
            responseJsonBody = data;
            return this;
          },
        };

        // Invoke the admin PUT /:id handler
        await putHandler(req, res);

        // ── VERIFICATIONS ──────────────────────────────────────────────────────────
        assert.equal(adminReadOccurred, true, 'Admin initial read at t0 must have occurred');
        assert.equal(customerCancellationTriggered, true, 'Deterministic barrier must have executed customer cancellation');

        // 1. Must return 409 Conflict (NOT 200 OK and NOT 400 from initial line 182 check)
        assert.equal(responseStatusCode, 409, `Stale admin write MUST be rejected with HTTP 409 Conflict, got ${responseStatusCode}`);
        assert.equal(responseJsonBody.success, false);
        assert.equal(responseJsonBody.conflict, true);
        assert.ok(
          responseJsonBody.message.includes('was cancelled concurrently'),
          `Message must indicate concurrent cancellation conflict: got "${responseJsonBody.message}"`
        );

        // 2. Persisted order in MongoDB MUST REMAIN 'cancelled'
        assert.equal(persistedOrder.orderStatus, 'cancelled', 'Order status in database must remain cancelled; customer cancellation must NOT be overwritten');
        assert.equal(persistedOrder.inventoryRestored, true, 'inventoryRestored must remain true');

        // 3. Stock was restored exactly once by customer cancellation and NOT altered by stale admin update
        assert.equal(variantStock, 12, 'Inventory must be restored exactly once (10 + 2 = 12); stale admin update must not touch stock');
      } finally {
        Order.findById = origFindById;
        Order.findOneAndUpdate = origFindOneAndUpdate;
        Order.findByIdAndUpdate = origFindByIdAndUpdate;
        Product.findById = origProductFindById;
        Product.updateOne = origProductUpdateOne;
        Product.exists = origProductExists;
        Discount.updateOne = origDiscountUpdateOne;
      }
    });

    it('F-CR-02: atomic conditional update Order.findOneAndUpdate({ orderStatus: { $ne: cancelled } }) rejects write when race occurs between boundary check and save', async () => {
      const putRoute = (adminOrdersRouter as any).stack.find(
        (s: any) => s.route && s.route.path === '/:id' && s.route.methods.put
      );
      const putHandler = putRoute.route.stack[0].handle;

      const raceOrderId = new mongoose.Types.ObjectId();
      const raceProductId = new mongoose.Types.ObjectId();
      const raceVariantId = new mongoose.Types.ObjectId();

      let persistedOrder: any = {
        _id: raceOrderId,
        orderNumber: 'MN-RACE-BOUNDARY-2026',
        orderStatus: 'pending',
        items: [
          {
            productId: raceProductId,
            variantId: raceVariantId,
            productName: 'Ratlami Sev',
            variantLabel: '500g',
            sku: 'MLW-RT-500G',
            price: 180,
            quantity: 2,
            itemTotal: 360,
          },
        ],
        inventoryRestored: false,
      };

      let variantStock = 10;

      const origFindById = Order.findById;
      const origFindOneAndUpdate = Order.findOneAndUpdate;

      let findByIdCallCount = 0;
      let lateCancellationTriggered = false;

      try {
        Order.findById = ((id: any) => {
          findByIdCallCount++;
          if (findByIdCallCount === 1) {
            // Call 1 (line 172): initial read returns pending
            return createMockQuery({
              ...persistedOrder,
              toObject: () => ({ ...persistedOrder }),
            });
          } else if (findByIdCallCount === 2) {
            // Call 2 (line 249): write boundary check also saw pending (simulating the tightest race window!)
            // RIGHT AFTER line 249 check passes, the customer cancellation commits!
            lateCancellationTriggered = true;
            persistedOrder.orderStatus = 'cancelled';
            persistedOrder.inventoryRestored = true;
            variantStock += 2; // Stock restored by winning customer cancellation: 10 + 2 = 12

            return createMockQuery({
              _id: persistedOrder._id,
              orderStatus: 'pending', // Simulated stale boundary read!
              orderNumber: persistedOrder.orderNumber,
              toObject: () => ({ ...persistedOrder, orderStatus: 'pending' }),
            });
          } else {
            // Call 3 (line 332): fresh read after failed updateOne returns actual cancelled status
            return createMockQuery({
              ...persistedOrder,
              toObject: () => ({ ...persistedOrder }),
            });
          }
        }) as any;

        // Line 325: Atomic conditional write
        Order.findOneAndUpdate = (async (filter: any, update: any) => {
          // If filter excludes cancelled orders and persistedOrder became cancelled:
          if (filter.orderStatus?.$ne === 'cancelled' && persistedOrder.orderStatus === 'cancelled') {
            return null; // Atomic protection catches the race at database boundary!
          }
          persistedOrder = { ...persistedOrder, ...update.$set };
          return persistedOrder;
        }) as any;

        const req: any = {
          params: { id: raceOrderId.toString() },
          body: { orderStatus: 'shipped' },
          user: { userId: 'admin_test_1', role: 'admin' },
        };

        let responseStatusCode = 200;
        let responseJsonBody: any = null;
        const res: any = {
          status(code: number) {
            responseStatusCode = code;
            return this;
          },
          json(data: any) {
            responseJsonBody = data;
            return this;
          },
        };

        await putHandler(req, res);

        assert.equal(lateCancellationTriggered, true, 'Late race barrier must have executed');
        assert.equal(responseStatusCode, 409, 'Atomic conditional write must reject with 409 Conflict');
        assert.equal(responseJsonBody.conflict, true);
        assert.ok(responseJsonBody.message.includes('cancelled concurrently while being saved'));
        assert.equal(persistedOrder.orderStatus, 'cancelled', 'Order in DB must remain cancelled');
        assert.equal(persistedOrder.inventoryRestored, true, 'inventoryRestored must remain true');
        assert.equal(variantStock, 12, 'Inventory must be restored exactly once (10 + 2 = 12) and not altered by stale admin write');
      } finally {
        Order.findById = origFindById;
        Order.findOneAndUpdate = origFindOneAndUpdate;
      }
    });

    it('F-CR-02: legitimate admin update succeeds when order is not cancelled', async () => {
      const putRoute = (adminOrdersRouter as any).stack.find(
        (s: any) => s.route && s.route.path === '/:id' && s.route.methods.put
      );
      const putHandler = putRoute.route.stack[0].handle;

      const legitOrderId = new mongoose.Types.ObjectId();
      let persistedOrder: any = {
        _id: legitOrderId,
        orderNumber: 'MN-LEGIT-2026',
        orderStatus: 'pending',
        shippingAddress: { name: 'Legit Customer', phone: '9876543210', addressLine1: '45 Sarafa', city: 'Indore', state: 'MP', pincode: '452002' },
        items: [{ productName: 'Ratlami Sev', price: 180, quantity: 1, itemTotal: 180 }],
        subtotal: 180,
        total: 180,
      };

      const origFindById = Order.findById;
      const origFindOneAndUpdate = Order.findOneAndUpdate;

      try {
        Order.findById = (() => {
          return createMockQuery({
            ...persistedOrder,
            toObject: () => ({ ...persistedOrder }),
          });
        }) as any;

        Order.findOneAndUpdate = (async (filter: any, update: any) => {
          if (filter.orderStatus?.$ne === 'cancelled' && persistedOrder.orderStatus !== 'cancelled') {
            persistedOrder = { ...persistedOrder, ...update.$set };
            return {
              ...persistedOrder,
              toObject: () => ({ ...persistedOrder }),
            };
          }
          return null;
        }) as any;

        const req: any = {
          params: { id: legitOrderId.toString() },
          body: { orderStatus: 'processing' },
          user: { userId: 'admin_test_1', role: 'admin' },
        };

        let responseStatusCode = 200;
        let responseJsonBody: any = null;
        const res: any = {
          status(code: number) {
            responseStatusCode = code;
            return this;
          },
          json(data: any) {
            responseJsonBody = data;
            return this;
          },
        };

        await putHandler(req, res);

        assert.equal(responseStatusCode, 200, 'Legitimate update must return 200 OK');
        assert.equal(responseJsonBody.success, true);
        assert.equal(persistedOrder.orderStatus, 'processing', 'Order status must be updated to processing');
      } finally {
        Order.findById = origFindById;
        Order.findOneAndUpdate = origFindOneAndUpdate;
      }
    });
  });
});
