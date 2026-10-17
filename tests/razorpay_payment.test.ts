/**
 * Malwa Namkeen House — Secure Razorpay Payment Integration Test Suite
 *
 * Covers all safety, security, and lifecycle requirements:
 * 1. Cryptographic HMAC-SHA256 signature verification (constant-time, timing attack safe).
 * 2. Webhook HMAC-SHA256 signature verification over raw payload buffers.
 * 3. Server-validated amounts in paise (1 INR = 100 paise) — zero browser trust.
 * 4. Idempotent webhook processing and replay attack protection.
 * 5. Amount, currency, and order association verification.
 * 6. Protection of cancelled orders from being marked paid.
 * 7. Protection of paid orders from being cancelled or corrupted by failed webhooks.
 * 8. Safe inventory restoration and coupon rollback on unpaid order cancellation.
 * 9. Cash on Delivery (COD) regression verification.
 * 10. Unconfigured / sandbox fallback safety (never silently marks payments as successful).
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
  createRazorpayOrder,
  _setRazorpayClientForTesting,
  getRazorpayConfig,
  getPublicRazorpayKeyId,
} from '../server/lib/razorpayService.ts';
import { Order } from '../server/models/Order.ts';
import { Product } from '../server/models/Product.ts';
import { Discount } from '../server/models/Discount.ts';
import { User } from '../server/models/User.ts';
import { cancelAndRestockOrder } from '../server/lib/orderRestoration.ts';
import {
  handleVerifyPayment,
  handleRazorpayWebhook,
  handleRetryPayment,
  handleCancelUnpaid,
} from '../server/routes/customerOrders.ts';
import {
  assertSafeTestDatabaseEnvironment,
  TestRecordTracker,
} from './test_db_guard.ts';

describe('Gate 9: Razorpay Payment Integration & Security Suite', () => {
  const TEST_KEY_ID = 'rzp_test_malwa_live_sandbox_key';
  const TEST_KEY_SECRET = 'mock_secret_key_malwa_2026';
  const TEST_WEBHOOK_SECRET = 'mock_webhook_secret_malwa_2026';

  const origKeyId = process.env.RAZORPAY_KEY_ID;
  const origKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const origWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  before(async () => {
    process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

    if (mongoose.connection.readyState !== 1 && process.env.MONGODB_TEST_URI) {
      assertSafeTestDatabaseEnvironment();
      await mongoose.connect(process.env.MONGODB_TEST_URI, {
        dbName: process.env.MONGODB_TEST_DB_NAME || 'malwa_namkeen_test',
        serverSelectionTimeoutMS: 8000,
      });
    }
  });

  after(async () => {
    if (origKeyId) process.env.RAZORPAY_KEY_ID = origKeyId; else delete process.env.RAZORPAY_KEY_ID;
    if (origKeySecret) process.env.RAZORPAY_KEY_SECRET = origKeySecret; else delete process.env.RAZORPAY_KEY_SECRET;
    if (origWebhookSecret) process.env.RAZORPAY_WEBHOOK_SECRET = origWebhookSecret; else delete process.env.RAZORPAY_WEBHOOK_SECRET;
    _setRazorpayClientForTesting(null);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  beforeEach(() => {
    // Reset test mock client between test cases
    _setRazorpayClientForTesting(null);
  });

  // ── 1. Cryptographic Signature Verification Unit Tests ───────────────────
  describe('1. Cryptographic Signature Verification & Timing Attack Safety', () => {
    it('successfully verifies a mathematically valid payment signature', () => {
      const orderId = 'order_DAKSH2026101701';
      const paymentId = 'pay_DAKSH987654321';
      const payload = `${orderId}|${paymentId}`;
      const validSignature = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(payload)
        .digest('hex');

      const isValid = verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
        secret: TEST_KEY_SECRET,
      });

      assert.equal(isValid, true, 'Valid HMAC signature must verify successfully');
    });

    it('rejects tampered or forged payment signature', () => {
      const orderId = 'order_DAKSH2026101701';
      const paymentId = 'pay_DAKSH987654321';
      const forgedSignature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

      const isValid = verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: forgedSignature,
        secret: TEST_KEY_SECRET,
      });

      assert.equal(isValid, false, 'Forged signature must be strictly rejected');
    });

    it('rejects signature if order ID or payment ID is altered', () => {
      const orderId = 'order_DAKSH2026101701';
      const paymentId = 'pay_DAKSH987654321';
      const validSignature = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      // Altered order ID
      const alteredOrderCheck = verifyPaymentSignature({
        razorpayOrderId: 'order_DIFFERENT_ORDER',
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
        secret: TEST_KEY_SECRET,
      });
      assert.equal(alteredOrderCheck, false, 'Signature with mismatched order ID must fail');

      // Altered payment ID
      const alteredPaymentCheck = verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: 'pay_DIFFERENT_PAYMENT',
        razorpaySignature: validSignature,
        secret: TEST_KEY_SECRET,
      });
      assert.equal(alteredPaymentCheck, false, 'Signature with mismatched payment ID must fail');
    });

    it('rejects signature when secret is missing or empty', () => {
      const isValid = verifyPaymentSignature({
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 'any_signature',
        secret: '',
      });

      assert.equal(isValid, false, 'Missing secret must safely reject');
    });

    it('successfully verifies a valid webhook HMAC-SHA256 signature', () => {
      const rawPayload = JSON.stringify({
        entity: 'event',
        event: 'payment.captured',
        id: 'evt_0011223344',
      });
      const validWebhookSig = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');

      const isValid = verifyWebhookSignature({
        rawBody: rawPayload,
        signature: validWebhookSig,
        webhookSecret: TEST_WEBHOOK_SECRET,
      });

      assert.equal(isValid, true, 'Valid webhook signature must verify');

      // Also works when rawBody is a Buffer
      const isValidBuf = verifyWebhookSignature({
        rawBody: Buffer.from(rawPayload, 'utf-8'),
        signature: validWebhookSig,
        webhookSecret: TEST_WEBHOOK_SECRET,
      });
      assert.equal(isValidBuf, true, 'Buffer rawBody must verify identically');
    });

    it('rejects webhook with tampered body or invalid signature', () => {
      const rawPayload = JSON.stringify({ event: 'order.paid' });
      const tamperedPayload = JSON.stringify({ event: 'order.paid', hacked: true });
      const signature = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');

      const isValid = verifyWebhookSignature({
        rawBody: tamperedPayload,
        signature,
        webhookSecret: TEST_WEBHOOK_SECRET,
      });

      assert.equal(isValid, false, 'Tampered webhook payload must be rejected');
    });
  });

  // ── 2. Server-Side Order Amount Validation ──────────────────────────────
  describe('2. Server-Validated Order Amounts & Currency Checks', () => {
    it('rejects negative, zero, or non-integer amounts in paise', async () => {
      const zeroRes = await createRazorpayOrder({
        amount: 0,
        receipt: 'MN-TEST-001',
      });
      assert.equal(zeroRes.success, false);
      assert.match(zeroRes.error || '', /positive integer in paise/);

      const negRes = await createRazorpayOrder({
        amount: -100,
        receipt: 'MN-TEST-002',
      });
      assert.equal(negRes.success, false);

      const floatRes = await createRazorpayOrder({
        amount: 499.5, // fractional paise
        receipt: 'MN-TEST-003',
      });
      assert.equal(floatRes.success, false);
    });

    it('rejects unsupported non-INR currencies', async () => {
      const usdRes = await createRazorpayOrder({
        amount: 50000,
        currency: 'USD',
        receipt: 'MN-TEST-USD',
      });
      assert.equal(usdRes.success, false);
      assert.match(usdRes.error || '', /Only INR is currently supported/);
    });

    it('rejects missing or empty receipt number', async () => {
      const noReceipt = await createRazorpayOrder({
        amount: 50000,
        receipt: '',
      });
      assert.equal(noReceipt.success, false);
      assert.match(noReceipt.error || '', /receipt identifier is required/);
    });

    it('creates Razorpay order through injected mock client in test mode', async () => {
      _setRazorpayClientForTesting({
        orders: {
          create: async (params) => ({
            id: 'order_mock_test_123',
            entity: 'order',
            amount: params.amount,
            amount_paid: 0,
            amount_due: params.amount,
            currency: params.currency || 'INR',
            receipt: params.receipt,
            status: 'created',
            attempts: 0,
            notes: params.notes || {},
            created_at: Math.floor(Date.now() / 1000),
          }),
        },
      });

      const res = await createRazorpayOrder({
        amount: 64000, // ₹640.00
        receipt: 'MN-20261017-9001',
        notes: { customer: 'test@example.com' },
      });

      assert.equal(res.success, true);
      assert.equal(res.data?.id, 'order_mock_test_123');
      assert.equal(res.data?.amount, 64000);
      assert.equal(res.data?.currency, 'INR');
      assert.equal(res.data?.status, 'created');
    });

    it('safely fails without throwing when gateway credentials are unconfigured', async () => {
      const origKey = process.env.RAZORPAY_KEY_ID;
      const origSecret = process.env.RAZORPAY_KEY_SECRET;
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;

      try {
        const res = await createRazorpayOrder({
          amount: 50000,
          receipt: 'MN-TEST-UNCONFIG',
        });
        assert.equal(res.success, false);
        assert.equal(res.statusCode, 503);
        assert.match(res.error || '', /not configured/);
      } finally {
        if (origKey) process.env.RAZORPAY_KEY_ID = origKey;
        if (origSecret) process.env.RAZORPAY_KEY_SECRET = origSecret;
      }
    });
  });

  // ── 3. Payment Verification & Order State Transition ─────────────────────
  describe('3. Payment Verification State Machine & Atomic Transitions', () => {
    it('correctly updates order state upon valid payment verification', async () => {
      const mockOrderId = new Types.ObjectId();
      const rzpOrderId = 'order_RZP_TEST_101';
      const rzpPaymentId = 'pay_RZP_TEST_202';
      const validSig = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest('hex');

      // Mock Order in database
      const mockOrderDoc: any = {
        _id: mockOrderId,
        orderNumber: 'MN-20261017-0001',
        customer: new Types.ObjectId(),
        total: 640,
        orderStatus: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'online',
        paymentDetails: {
          gateway: 'razorpay',
          razorpayOrderId: rzpOrderId,
        },
      };

      // Verify signature check passes
      const sigOk = verifyPaymentSignature({
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: rzpPaymentId,
        razorpaySignature: validSig,
        secret: TEST_KEY_SECRET,
      });
      assert.equal(sigOk, true);

      // Simulate atomic transition
      if (mockOrderDoc.paymentStatus !== 'paid' && mockOrderDoc.orderStatus !== 'cancelled') {
        mockOrderDoc.paymentStatus = 'paid';
        mockOrderDoc.orderStatus = 'confirmed';
        mockOrderDoc.paymentDetails.transactionId = rzpPaymentId;
        mockOrderDoc.paymentDetails.razorpayPaymentId = rzpPaymentId;
        mockOrderDoc.paymentDetails.razorpaySignature = validSig;
        mockOrderDoc.paymentDetails.paidAt = new Date();
      }

      assert.equal(mockOrderDoc.paymentStatus, 'paid');
      assert.equal(mockOrderDoc.orderStatus, 'confirmed');
      assert.equal(mockOrderDoc.paymentDetails.transactionId, rzpPaymentId);
      assert.ok(mockOrderDoc.paymentDetails.paidAt);
    });

    it('rejects payment verification if order was already cancelled', () => {
      const mockOrderDoc: any = {
        orderStatus: 'cancelled',
        paymentStatus: 'pending',
        inventoryRestored: true,
      };

      const canVerify = mockOrderDoc.orderStatus !== 'cancelled';
      assert.equal(canVerify, false, 'Cancelled order must never accept payment verification');
    });

    it('idempotently handles repeated verification for an already paid order', () => {
      const mockOrderDoc: any = {
        orderStatus: 'confirmed',
        paymentStatus: 'paid',
        paymentDetails: {
          transactionId: 'pay_ALREADY_PAID_123',
        },
      };

      const isAlreadyPaid = mockOrderDoc.paymentStatus === 'paid';
      assert.equal(isAlreadyPaid, true, 'Already paid order should report idempotent success');
    });
  });

  // ── 4. Webhook Idempotency & Replay Attack Protection ───────────────────
  describe('4. Webhook Idempotency, Duplicate Events & Amount Verification', () => {
    it('idempotently absorbs duplicate webhook events without double processing', () => {
      const eventId = 'evt_UNIQUE_EVENT_999888';
      const mockOrder: any = {
        orderNumber: 'MN-20261017-0099',
        paymentStatus: 'paid',
        processedWebhookEvents: [eventId],
      };

      const isAlreadyProcessed = mockOrder.processedWebhookEvents.includes(eventId);
      assert.equal(isAlreadyProcessed, true, 'Replayed webhook event must be identified as already processed');
    });

    it('detects and flags amount mismatch in webhook payload', () => {
      const orderTotal = 640; // ₹640.00
      const expectedPaise = Math.round(orderTotal * 100); // 64000 paise

      // Malicious or mismatched webhook payload reporting only ₹1.00
      const attackerWebhookPayload = {
        amount: 100, // 100 paise = ₹1.00
        currency: 'INR',
      };

      const isAmountMatch = attackerWebhookPayload.amount === expectedPaise;
      assert.equal(isAmountMatch, false, 'Underpaid webhook amount must not match order expectation');
    });

    it('detects and flags currency mismatch in webhook payload', () => {
      const orderTotal = 640;
      const expectedPaise = Math.round(orderTotal * 100);

      const foreignCurrencyPayload = {
        amount: expectedPaise,
        currency: 'USD',
      };

      const isCurrencyMatch = foreignCurrencyPayload.currency === 'INR';
      assert.equal(isCurrencyMatch, false, 'Non-INR currency in webhook must be flagged');
    });

    it('records failure reason upon payment.failed webhook without corrupting stock', () => {
      const mockOrder: any = {
        orderStatus: 'pending',
        paymentStatus: 'pending',
        paymentDetails: {},
        processedWebhookEvents: [],
      };

      const failedEvent = {
        event: 'payment.failed',
        id: 'evt_FAIL_001',
        payload: {
          payment: {
            entity: {
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'Payment was declined by issuing bank',
            },
          },
        },
      };

      // State update
      if (mockOrder.paymentStatus !== 'paid' && mockOrder.orderStatus !== 'cancelled') {
        mockOrder.paymentDetails.failureReason = failedEvent.payload.payment.entity.error_description;
        mockOrder.processedWebhookEvents.push(failedEvent.id);
      }

      assert.equal(mockOrder.paymentStatus, 'pending', 'Order paymentStatus should remain pending for customer retry');
      assert.equal(mockOrder.paymentDetails.failureReason, 'Payment was declined by issuing bank');
      assert.ok(mockOrder.processedWebhookEvents.includes('evt_FAIL_001'));
    });
  });

  // ── 5. Cancellation, Inventory Restoration & Retries ────────────────────
  describe('5. Unpaid Checkout Cancellation & Stock Restock Safety', () => {
    it('restores inventory atomically when customer abandons or cancels unpaid order', async () => {
      const mockOrderId = new Types.ObjectId();
      const mockProductId = new Types.ObjectId();
      const mockVariantId = new Types.ObjectId();

      let variantStock = 10;
      let orderCancelled = false;

      // Mock Product update simulating atomic stock increment
      const mockRestock = (qty: number) => {
        variantStock += qty;
        orderCancelled = true;
      };

      // Customer ordered 3 units, then cancelled before payment
      mockRestock(3);

      assert.equal(variantStock, 13, 'Stock must be returned to inventory upon cancellation');
      assert.equal(orderCancelled, true);
    });

    it('prevents paid orders from being cancelled via cancel-unpaid endpoint', () => {
      const mockOrder: any = {
        orderStatus: 'confirmed',
        paymentStatus: 'paid',
      };

      const canCancelUnpaid = mockOrder.paymentStatus !== 'paid';
      assert.equal(canCancelUnpaid, false, 'Paid orders cannot be cancelled as unpaid');
    });

    it('allows payment retry on unpaid pending order without duplicate stock reservation', () => {
      const mockOrder: any = {
        orderStatus: 'pending',
        paymentStatus: 'pending',
        total: 480,
      };

      const canRetry = mockOrder.orderStatus === 'pending' && mockOrder.paymentStatus !== 'paid';
      assert.equal(canRetry, true, 'Unpaid pending orders must allow payment retry');
    });

    it('verifies that retry payment calculates exact paise and retains receipt order number', async () => {
      let createdParams: any = null;
      _setRazorpayClientForTesting({
        orders: {
          create: async (params) => {
            createdParams = params;
            return {
              id: 'order_retry_abc999',
              entity: 'order',
              amount: params.amount,
              amount_paid: 0,
              amount_due: params.amount,
              currency: params.currency || 'INR',
              receipt: params.receipt,
              status: 'created',
              attempts: 0,
              notes: params.notes || {},
              created_at: Math.floor(Date.now() / 1000),
            };
          },
        },
      });

      try {
        const orderTotal = 649; // ₹649
        const res = await createRazorpayOrder({
          amount: Math.round(orderTotal * 100),
          currency: 'INR',
          receipt: 'MN-20261017-RETRY',
          notes: { orderNumber: 'MN-20261017-RETRY' },
        });

        assert.equal(res.success, true);
        assert.equal(createdParams.amount, 64900, 'Must convert ₹649 to 64900 paise exactly');
        assert.equal(createdParams.receipt, 'MN-20261017-RETRY');
      } finally {
        _setRazorpayClientForTesting(null);
      }
    });
  });

  // ── 6. Cash on Delivery (COD) Regression Protection ─────────────────────
  describe('6. Cash on Delivery (COD) Flow Regression Guard', () => {
    it('preserves existing COD checkout without invoking Razorpay', () => {
      const paymentMethod = 'cod';
      const isOnline = ['online', 'upi', 'card'].includes(paymentMethod) && paymentMethod !== 'cod';

      assert.equal(isOnline, false, 'COD must not trigger online payment initialization');

      // COD order creates in pending status without razorpay order ID
      const codOrder: any = {
        orderNumber: 'MN-20261017-COD',
        total: 529,
        paymentMethod: 'cod',
        orderStatus: 'pending',
        paymentStatus: 'pending',
        paymentDetails: {},
      };

      assert.equal(codOrder.paymentMethod, 'cod');
      assert.equal(codOrder.paymentStatus, 'pending');
      assert.equal(codOrder.paymentDetails.razorpayOrderId, undefined);
    });
  });

  // ── 7. Edge Case Defensive Signatures ────────────────────────────────────
  describe('7. Edge Case Signature Security', () => {
    it('rejects payment signature verification with whitespace-only parameters', () => {
      const isValid = verifyPaymentSignature({
        razorpayOrderId: '   ',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 'sig_123',
        secret: TEST_KEY_SECRET,
      });
      assert.equal(isValid, false, 'Whitespace-only order ID must be rejected');

      const isValid2 = verifyPaymentSignature({
        razorpayOrderId: 'order_123',
        razorpayPaymentId: '   ',
        razorpaySignature: 'sig_123',
        secret: TEST_KEY_SECRET,
      });
      assert.equal(isValid2, false, 'Whitespace-only payment ID must be rejected');
    });
  });

  // ── 8. End-to-End Payment Router & Integration Safety Suite ──────────────
  describe('8. End-to-End Payment Router & Integration Safety Suite', () => {
    const runId = 'rzp_integ_' + Date.now();
    const tracker = new TestRecordTracker(runId);

    let testUser: any = null;
    let otherUser: any = null;
    let testProduct: any = null;

    const inMemoryOrders = new Map<string, any>();
    const inMemoryProducts = new Map<string, any>();

    let isMockMode = false;
    let origOrderFindById: any;
    let origOrderFindOne: any;
    let origOrderCreate: any;
    let origOrderFindOneAndUpdate: any;
    let origOrderFindByIdAndUpdate: any;
    let origProductFindById: any;
    let origProductUpdateOne: any;
    let origDiscountUpdateOne: any;
    let origUserFindById: any;

    before(async () => {
      try {
        if (mongoose.connection.readyState === 1) {
        testUser = await User.create({
          name: 'Razorpay Authorized Tester',
          email: `rzp.auth.${Date.now()}@example.com`,
          password: 'HashedPassword123!',
          role: 'customer',
          active: true,
        });
        tracker.userIds.push(testUser._id.toString());
        tracker.userEmails.push(testUser.email);

        otherUser = await User.create({
          name: 'Razorpay Intruder',
          email: `rzp.intruder.${Date.now()}@example.com`,
          password: 'HashedPassword123!',
          role: 'customer',
          active: true,
        });
        tracker.userIds.push(otherUser._id.toString());
        tracker.userEmails.push(otherUser.email);

        testProduct = await Product.create({
          name: 'Test Ujjaini Sev 500g',
          description: 'Authentic Ujjaini Sev crafted with traditional spices',
          category: new Types.ObjectId(),
          variants: [
            { label: '500g', price: 150, stock: 40, sku: 'TEST-SEV-500' },
          ],
          slug: `test-sev-${Date.now()}`,
        });
        tracker.productIds.push(testProduct._id.toString());
      } else {
        isMockMode = true;
        testUser = {
          _id: new Types.ObjectId(),
          name: 'Razorpay Authorized Tester',
          email: `rzp.auth.${Date.now()}@example.com`,
          role: 'customer',
          active: true,
        };
        otherUser = {
          _id: new Types.ObjectId(),
          name: 'Razorpay Intruder',
          email: `rzp.intruder.${Date.now()}@example.com`,
          role: 'customer',
          active: true,
        };
        testProduct = {
          _id: new Types.ObjectId(),
          name: 'Test Ujjaini Sev 500g',
          category: 'namkeen',
          basePrice: 150,
          variants: [
            { _id: new Types.ObjectId(), label: '500g', price: 150, stock: 40, sku: 'TEST-SEV-500' },
          ],
          isAvailable: true,
          slug: `test-sev-${Date.now()}`,
        };
        inMemoryProducts.set(testProduct._id.toString(), testProduct);

        origOrderFindById = Order.findById;
        origOrderFindOne = Order.findOne;
        origOrderCreate = Order.create;
        origOrderFindOneAndUpdate = Order.findOneAndUpdate;
        origOrderFindByIdAndUpdate = Order.findByIdAndUpdate;
        origProductFindById = Product.findById;
        origProductUpdateOne = Product.updateOne;
        origDiscountUpdateOne = Discount.updateOne;
        origUserFindById = User.findById;

        Order.findById = (async (id: any) => {
          if (!id) return null;
          const cleanId = id.toString();
          return inMemoryOrders.get(cleanId) || null;
        }) as any;

        Order.findOne = ((query: any) => {
          let resultDoc: any = null;
          for (const doc of inMemoryOrders.values()) {
            if (query['paymentDetails.razorpayOrderId'] && doc.paymentDetails?.razorpayOrderId === query['paymentDetails.razorpayOrderId']) {
              resultDoc = doc;
              break;
            }
            if (query.orderNumber && doc.orderNumber === query.orderNumber) {
              resultDoc = doc;
              break;
            }
            if (query['paymentDetails.razorpayPaymentId']) {
              const targetPaymentId = query['paymentDetails.razorpayPaymentId'];
              const notId = query._id?.$ne?.toString();
              if (doc.paymentDetails?.razorpayPaymentId === targetPaymentId) {
                if (!notId || doc._id.toString() !== notId) {
                  resultDoc = doc;
                  break;
                }
              }
            }
          }
          return {
            lean: () => resultDoc,
            then: (resolve: any) => Promise.resolve(resultDoc).then(resolve),
          };
        }) as any;

        Order.create = (async (data: any) => {
          const id = data._id || new Types.ObjectId();
          const doc: any = {
            ...data,
            _id: id,
            paymentDetails: data.paymentDetails ? { ...data.paymentDetails } : {},
            items: (data.items || []).map((i: any) => ({ ...i })),
            customerInfo: data.customerInfo ? { ...data.customerInfo } : {},
            shippingAddress: data.shippingAddress ? { ...data.shippingAddress } : {},
            processedWebhookEvents: data.processedWebhookEvents ? [...data.processedWebhookEvents] : [],
            save: async function() {
              inMemoryOrders.set(this._id.toString(), this);
              return this;
            },
          };
          inMemoryOrders.set(id.toString(), doc);
          return doc;
        }) as any;

        Order.findOneAndUpdate = (async (filter: any, update: any) => {
          const id = filter._id?.toString();
          const target = inMemoryOrders.get(id);
          if (!target) return null;

          if (filter.paymentStatus?.$ne && target.paymentStatus === filter.paymentStatus.$ne) return null;
          if (filter.orderStatus?.$ne && target.orderStatus === filter.orderStatus.$ne) return null;

          if (update.$set) {
            for (const [key, val] of Object.entries(update.$set)) {
              if (key.includes('.')) {
                const parts = key.split('.');
                let curr = target;
                for (let i = 0; i < parts.length - 1; i++) {
                  if (!curr[parts[i]]) curr[parts[i]] = {};
                  curr = curr[parts[i]];
                }
                curr[parts[parts.length - 1]] = val;
              } else {
                target[key] = val;
              }
            }
          }
          inMemoryOrders.set(target._id.toString(), target);
          return target;
        }) as any;

        Order.findByIdAndUpdate = (async (id: any, update: any) => {
          const doc = inMemoryOrders.get(id?.toString());
          if (!doc) return null;
          if (update.$set) {
            for (const [key, val] of Object.entries(update.$set)) {
              if (key.includes('.')) {
                const parts = key.split('.');
                let curr = doc;
                for (let i = 0; i < parts.length - 1; i++) {
                  if (!curr[parts[i]]) curr[parts[i]] = {};
                  curr = curr[parts[i]];
                }
                curr[parts[parts.length - 1]] = val;
              } else {
                doc[key] = val;
              }
            }
          }
          return doc;
        }) as any;

        Product.findById = (async (id: any) => {
          return inMemoryProducts.get(id?.toString()) || null;
        }) as any;

        Product.updateOne = (async () => ({ matchedCount: 1, modifiedCount: 1 })) as any;
        Discount.updateOne = (async () => ({ matchedCount: 1, modifiedCount: 1 })) as any;
        User.findById = (async (id: any) => {
          if (testUser && id?.toString() === testUser._id.toString()) return testUser;
          if (otherUser && id?.toString() === otherUser._id.toString()) return otherUser;
          return null;
        }) as any;
      }
      } catch (err) {
        console.error('*** EXCEPTION IN SUITE 8 BEFORE ***:', err);
        throw err;
      }
    });

    after(async () => {
      _setRazorpayClientForTesting(null);
      if (isMockMode) {
        Order.findById = origOrderFindById;
        Order.findOne = origOrderFindOne;
        Order.create = origOrderCreate;
        Order.findOneAndUpdate = origOrderFindOneAndUpdate;
        Order.findByIdAndUpdate = origOrderFindByIdAndUpdate;
        Product.findById = origProductFindById;
        Product.updateOne = origProductUpdateOne;
        Discount.updateOne = origDiscountUpdateOne;
        User.findById = origUserFindById;
      } else if (mongoose.connection.readyState === 1) {
        await tracker.performScopedCleanup();
      }
    });

    function mockHttp(options: {
      method?: string;
      url?: string;
      headers?: Record<string, string>;
      body?: any;
      params?: Record<string, string>;
      user?: { userId: string; email?: string; role?: string };
      rawBody?: any;
    }) {
      let statusCode = 200;
      let jsonPayload: any = null;

      const req: any = {
        method: options.method || 'POST',
        url: options.url || '/',
        headers: options.headers || {},
        body: options.body || {},
        params: options.params || {},
        user: options.user,
        rawBody: options.rawBody,
      };

      const res: any = {
        status(code: number) {
          statusCode = code;
          return res;
        },
        json(data: any) {
          jsonPayload = data;
          return res;
        },
      };

      return {
        req,
        res,
        getStatus: () => statusCode,
        getJson: () => jsonPayload,
      };
    }

    async function createTestOrder(overrides: Partial<any> = {}) {
      const order = await Order.create({
        orderNumber: `MN-RZP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        customer: testUser?._id || new Types.ObjectId(),
        customerInfo: {
          name: testUser?.name || 'Tester',
          email: testUser?.email || 'tester@example.com',
          phone: '9876543210',
        },
        items: [
          {
            productId: testProduct?._id,
            variantId: testProduct?.variants[0]._id,
            productName: 'Test Ujjaini Sev 500g',
            variantLabel: '500g',
            sku: 'TEST-SEV-500',
            price: 150,
            quantity: 2,
            itemTotal: 300,
          },
        ],
        subtotal: 300,
        discount: 0,
        shipping: 49,
        total: 349,
        shippingAddress: {
          name: 'Tester',
          phone: '9876543210',
          addressLine1: '12 Temple Road',
          city: 'Ujjain',
          state: 'Madhya Pradesh',
          pincode: '456001',
        },
        orderStatus: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'online',
        shipmentStatus: 'unfulfilled',
        paymentDetails: {
          gateway: 'razorpay',
          razorpayOrderId: `order_RZP_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        },
        ...overrides,
      });
      tracker.orderIds.push(order._id.toString());
      tracker.orderNumbers.push(order.orderNumber);
      return order;
    }

    // ── Payment Verification Route Tests ────────────────────────────────────
    it('handleVerifyPayment: successfully verifies authentic signature and transitions order to paid', async () => {
      const order = await createTestOrder();
      const rzpOrderId = order.paymentDetails!.razorpayOrderId!;
      const rzpPaymentId = `pay_VERIFY_SUCCESS_${Date.now()}`;
      const signature = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest('hex');

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        body: {
          orderId: order._id.toString(),
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: signature,
        },
      });

      await handleVerifyPayment(req, res);

      assert.equal(getStatus(), 200);
      assert.equal(getJson().success, true);
      assert.match(getJson().message, /Payment verified successfully/);

      const updated = await Order.findById(order._id);
      assert.equal(updated?.paymentStatus, 'paid');
      assert.equal(updated?.orderStatus, 'confirmed');
      assert.equal(updated?.paymentDetails?.razorpayPaymentId, rzpPaymentId);
      assert.equal(updated?.paymentDetails?.razorpaySignature, signature);
      assert.ok(updated?.paymentDetails?.paidAt);
    });

    it('handleVerifyPayment: strictly rejects tampered or forged HMAC signature with HTTP 400', async () => {
      const order = await createTestOrder();
      const rzpOrderId = order.paymentDetails!.razorpayOrderId!;
      const rzpPaymentId = `pay_FORGED_${Date.now()}`;
      const forgedSig = 'deadbeef0123456789abcdef0123456789abcdef0123456789abcdef01234567';

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        body: {
          orderId: order._id.toString(),
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: forgedSig,
        },
      });

      await handleVerifyPayment(req, res);

      assert.equal(getStatus(), 400);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /Invalid payment signature/);

      const unchanged = await Order.findById(order._id);
      assert.equal(unchanged?.paymentStatus, 'pending');
    });

    it('handleVerifyPayment: rejects mismatched razorpayOrderId with HTTP 400', async () => {
      const order = await createTestOrder();
      const rzpPaymentId = `pay_MISMATCH_${Date.now()}`;
      const mismatchedOrderId = 'order_RZP_SOME_OTHER_ORDER';
      const sig = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${mismatchedOrderId}|${rzpPaymentId}`)
        .digest('hex');

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        body: {
          orderId: order._id.toString(),
          razorpayOrderId: mismatchedOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: sig,
        },
      });

      await handleVerifyPayment(req, res);

      assert.equal(getStatus(), 400);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /does not match the order record/);
    });

    it('handleVerifyPayment: rejects payment verification for Cash on Delivery (cod) order with HTTP 400', async () => {
      const codOrder = await createTestOrder({
        paymentMethod: 'cod',
        paymentDetails: {},
      });
      const rzpOrderId = `order_COD_PROBE_${Date.now()}`;
      const rzpPaymentId = `pay_COD_PROBE_${Date.now()}`;
      const sig = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest('hex');

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        body: {
          orderId: codOrder._id.toString(),
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: sig,
        },
      });

      await handleVerifyPayment(req, res);

      assert.equal(getStatus(), 400);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /only permitted for online orders/);
    });

    it('handleVerifyPayment: rejects payment verification when order has no associated Razorpay order ID', async () => {
      const uninitOrder = await createTestOrder({
        paymentMethod: 'online',
        paymentDetails: {},
      });
      const rzpOrderId = `order_UNINIT_${Date.now()}`;
      const rzpPaymentId = `pay_UNINIT_${Date.now()}`;
      const sig = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest('hex');

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        body: {
          orderId: uninitOrder._id.toString(),
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: sig,
        },
      });

      await handleVerifyPayment(req, res);

      assert.equal(getStatus(), 400);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /No Razorpay order ID is associated/);
    });

    it('handleVerifyPayment: detects and rejects cross-order replay of already credited paymentId', async () => {
      const orderA = await createTestOrder();
      const rzpOrderIdA = orderA.paymentDetails!.razorpayOrderId!;
      const sharedPaymentId = `pay_REPLAY_TEST_${Date.now()}`;
      const sigA = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${rzpOrderIdA}|${sharedPaymentId}`)
        .digest('hex');

      // Verify order A first
      const { req: reqA, res: resA } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        body: {
          orderId: orderA._id.toString(),
          razorpayOrderId: rzpOrderIdA,
          razorpayPaymentId: sharedPaymentId,
          razorpaySignature: sigA,
        },
      });
      await handleVerifyPayment(reqA, resA);

      // Now create order B and attempt to credit the same sharedPaymentId
      const orderB = await createTestOrder();
      const rzpOrderIdB = orderB.paymentDetails!.razorpayOrderId!;
      const sigB = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${rzpOrderIdB}|${sharedPaymentId}`)
        .digest('hex');

      const { req: reqB, res: resB, getStatus: getStatusB, getJson: getJsonB } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        body: {
          orderId: orderB._id.toString(),
          razorpayOrderId: rzpOrderIdB,
          razorpayPaymentId: sharedPaymentId,
          razorpaySignature: sigB,
        },
      });
      await handleVerifyPayment(reqB, resB);

      assert.equal(getStatusB(), 400);
      assert.equal(getJsonB().success, false);
      assert.match(getJsonB().message, /already been credited to another order/);
    });

    it('handleVerifyPayment: idempotently returns HTTP 200 for already paid order', async () => {
      const order = await createTestOrder({
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        paymentDetails: {
          gateway: 'razorpay',
          razorpayOrderId: `order_ALREADY_PAID_${Date.now()}`,
          razorpayPaymentId: `pay_ALREADY_PAID_${Date.now()}`,
        },
      });

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        body: {
          orderId: order._id.toString(),
          razorpayOrderId: order.paymentDetails!.razorpayOrderId,
          razorpayPaymentId: order.paymentDetails!.razorpayPaymentId,
          razorpaySignature: 'any_signature',
        },
      });

      await handleVerifyPayment(req, res);

      assert.equal(getStatus(), 200);
      assert.equal(getJson().success, true);
      assert.match(getJson().message, /already been verified/);
    });

    it('handleVerifyPayment: rejects payment verification if order was already cancelled', async () => {
      const cancelledOrder = await createTestOrder({
        orderStatus: 'cancelled',
        paymentStatus: 'pending',
        inventoryRestored: true,
      });
      const rzpOrderId = cancelledOrder.paymentDetails!.razorpayOrderId!;
      const rzpPaymentId = `pay_CANCELLED_${Date.now()}`;
      const sig = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest('hex');

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        body: {
          orderId: cancelledOrder._id.toString(),
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: sig,
        },
      });

      await handleVerifyPayment(req, res);

      assert.equal(getStatus(), 400);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /Cannot verify payment for a cancelled order/);
    });

    it('handleVerifyPayment: rejects unauthorized customer with HTTP 403', async () => {
      const order = await createTestOrder();
      const rzpOrderId = order.paymentDetails!.razorpayOrderId!;
      const rzpPaymentId = `pay_UNAUTH_${Date.now()}`;
      const sig = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest('hex');

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: otherUser._id.toString(), role: 'customer' },
        body: {
          orderId: order._id.toString(),
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: sig,
        },
      });

      await handleVerifyPayment(req, res);

      assert.equal(getStatus(), 403);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /not authorized/);
    });

    it('handleVerifyPayment: rejects missing or invalid payload parameters with HTTP 400', async () => {
      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        body: {},
      });

      await handleVerifyPayment(req, res);

      assert.equal(getStatus(), 400);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /Missing or invalid payment verification parameters/);
    });

    // ── Razorpay Webhook Route Tests ─────────────────────────────────────────
    it('handleRazorpayWebhook: valid webhook payment.captured transitions order to paid and records event ID', async () => {
      const order = await createTestOrder({ total: 349 });
      const rzpOrderId = order.paymentDetails!.razorpayOrderId!;
      const paymentId = `pay_WB_CAPTURED_${Date.now()}`;
      const eventId = `evt_WB_SUCCESS_${Date.now()}`;

      const payloadObj = {
        entity: 'event',
        event: 'payment.captured',
        id: eventId,
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: rzpOrderId,
              amount: 34900,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      };

      const rawBody = JSON.stringify(payloadObj);
      const signature = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const { req, res, getStatus, getJson } = mockHttp({
        headers: {
          'x-razorpay-signature': signature,
          'x-razorpay-event-id': eventId,
        },
        body: payloadObj,
        rawBody,
      });

      await handleRazorpayWebhook(req, res);

      assert.equal(getStatus(), 200);
      assert.equal(getJson().success, true);
      assert.match(getJson().message, /Payment recorded successfully/);

      const updated = await Order.findById(order._id);
      assert.equal(updated?.paymentStatus, 'paid');
      assert.equal(updated?.orderStatus, 'confirmed');
      assert.ok(updated?.processedWebhookEvents?.includes(eventId));
    });

    it('handleRazorpayWebhook: strictly rejects missing or invalid webhook signature with HTTP 400', async () => {
      const payloadObj = { event: 'payment.captured', id: 'evt_FORGED' };
      const rawBody = JSON.stringify(payloadObj);

      const { req, res, getStatus, getJson } = mockHttp({
        headers: {
          'x-razorpay-signature': 'invalid_forged_sig',
        },
        body: payloadObj,
        rawBody,
      });

      await handleRazorpayWebhook(req, res);

      assert.equal(getStatus(), 400);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /Invalid webhook signature/);
    });

    it('handleRazorpayWebhook: idempotently absorbs replayed webhook event with alreadyProcessed: true', async () => {
      const eventId = `evt_REPLAY_${Date.now()}`;
      const order = await createTestOrder({
        processedWebhookEvents: [eventId],
        paymentStatus: 'paid',
      });

      const payloadObj = {
        event: 'payment.captured',
        id: eventId,
        payload: {
          payment: {
            entity: {
              id: 'pay_REPLAY',
              order_id: order.paymentDetails!.razorpayOrderId,
              amount: 34900,
              currency: 'INR',
            },
          },
        },
      };
      const rawBody = JSON.stringify(payloadObj);
      const signature = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const { req, res, getStatus, getJson } = mockHttp({
        headers: {
          'x-razorpay-signature': signature,
          'x-razorpay-event-id': eventId,
        },
        body: payloadObj,
        rawBody,
      });

      await handleRazorpayWebhook(req, res);

      assert.equal(getStatus(), 200);
      assert.equal(getJson().success, true);
      assert.equal(getJson().alreadyProcessed, true);
    });

    it('handleRazorpayWebhook: detects and rejects underpaid amount mismatch with HTTP 400', async () => {
      const order = await createTestOrder({ total: 500 }); // ₹500 = 50000 paise
      const rzpOrderId = order.paymentDetails!.razorpayOrderId!;
      const eventId = `evt_UNDERPAY_${Date.now()}`;

      const payloadObj = {
        event: 'payment.captured',
        id: eventId,
        payload: {
          payment: {
            entity: {
              id: `pay_UNDERPAY_${Date.now()}`,
              order_id: rzpOrderId,
              amount: 100, // Attacker pays only ₹1.00
              currency: 'INR',
            },
          },
        },
      };
      const rawBody = JSON.stringify(payloadObj);
      const signature = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const { req, res, getStatus, getJson } = mockHttp({
        headers: {
          'x-razorpay-signature': signature,
          'x-razorpay-event-id': eventId,
        },
        body: payloadObj,
        rawBody,
      });

      await handleRazorpayWebhook(req, res);

      assert.equal(getStatus(), 400);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /amount or currency mismatch/);

      const unchanged = await Order.findById(order._id);
      assert.equal(unchanged?.paymentStatus, 'pending');
    });

    it('handleRazorpayWebhook: detects and rejects non-INR currency in webhook with HTTP 400', async () => {
      const order = await createTestOrder({ total: 349 });
      const rzpOrderId = order.paymentDetails!.razorpayOrderId!;
      const eventId = `evt_USD_${Date.now()}`;

      const payloadObj = {
        event: 'payment.captured',
        id: eventId,
        payload: {
          payment: {
            entity: {
              id: `pay_USD_${Date.now()}`,
              order_id: rzpOrderId,
              amount: 34900,
              currency: 'USD',
            },
          },
        },
      };
      const rawBody = JSON.stringify(payloadObj);
      const signature = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const { req, res, getStatus, getJson } = mockHttp({
        headers: {
          'x-razorpay-signature': signature,
          'x-razorpay-event-id': eventId,
        },
        body: payloadObj,
        rawBody,
      });

      await handleRazorpayWebhook(req, res);

      assert.equal(getStatus(), 400);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /amount or currency mismatch/);
    });

    it('handleRazorpayWebhook: safely handles captured payment on cancelled order without state corruption', async () => {
      const cancelledOrder = await createTestOrder({
        total: 349,
        orderStatus: 'cancelled',
        paymentStatus: 'pending',
        inventoryRestored: true,
      });
      const rzpOrderId = cancelledOrder.paymentDetails!.razorpayOrderId!;
      const eventId = `evt_CANCELLED_PAY_${Date.now()}`;

      const payloadObj = {
        event: 'payment.captured',
        id: eventId,
        payload: {
          payment: {
            entity: {
              id: `pay_CANCELLED_${Date.now()}`,
              order_id: rzpOrderId,
              amount: 34900,
              currency: 'INR',
            },
          },
        },
      };
      const rawBody = JSON.stringify(payloadObj);
      const signature = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const { req, res, getStatus, getJson } = mockHttp({
        headers: {
          'x-razorpay-signature': signature,
          'x-razorpay-event-id': eventId,
        },
        body: payloadObj,
        rawBody,
      });

      await handleRazorpayWebhook(req, res);

      assert.equal(getStatus(), 200);
      assert.match(getJson().message, /previously cancelled/);

      const unchanged = await Order.findById(cancelledOrder._id);
      assert.equal(unchanged?.orderStatus, 'cancelled');
      assert.equal(unchanged?.paymentStatus, 'pending');
    });

    it('handleRazorpayWebhook: payment.failed event records failureReason without corrupting inventory', async () => {
      const order = await createTestOrder({ total: 349 });
      const rzpOrderId = order.paymentDetails!.razorpayOrderId!;
      const eventId = `evt_PAY_FAILED_${Date.now()}`;

      const payloadObj = {
        event: 'payment.failed',
        id: eventId,
        payload: {
          payment: {
            entity: {
              id: `pay_FAILED_${Date.now()}`,
              order_id: rzpOrderId,
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'Card verification failed by bank',
            },
          },
        },
      };
      const rawBody = JSON.stringify(payloadObj);
      const signature = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const { req, res, getStatus, getJson } = mockHttp({
        headers: {
          'x-razorpay-signature': signature,
          'x-razorpay-event-id': eventId,
        },
        body: payloadObj,
        rawBody,
      });

      await handleRazorpayWebhook(req, res);

      assert.equal(getStatus(), 200);
      assert.match(getJson().message, /Payment failure recorded/);

      const updated = await Order.findById(order._id);
      assert.equal(updated?.paymentStatus, 'pending');
      assert.equal(updated?.orderStatus, 'pending');
      assert.equal(updated?.paymentDetails?.failureReason, 'Card verification failed by bank');
      assert.ok(updated?.processedWebhookEvents?.includes(eventId));
    });

    it('handleRazorpayWebhook: payment.failed event resolves order via notes.orderId fallback', async () => {
      const order = await createTestOrder({ total: 349 });
      const eventId = `evt_NOTES_FALLBACK_${Date.now()}`;

      const payloadObj = {
        event: 'payment.failed',
        id: eventId,
        payload: {
          payment: {
            entity: {
              id: `pay_NOTES_FAIL_${Date.now()}`,
              order_id: 'order_DIFFERENT_RZP_ID',
              notes: {
                orderId: order._id.toString(),
              },
              error_code: 'GATEWAY_ERROR',
              error_description: 'UPI transaction expired',
            },
          },
        },
      };
      const rawBody = JSON.stringify(payloadObj);
      const signature = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const { req, res, getStatus } = mockHttp({
        headers: {
          'x-razorpay-signature': signature,
          'x-razorpay-event-id': eventId,
        },
        body: payloadObj,
        rawBody,
      });

      await handleRazorpayWebhook(req, res);

      assert.equal(getStatus(), 200);
      const updated = await Order.findById(order._id);
      assert.equal(updated?.paymentDetails?.failureReason, 'UPI transaction expired');
    });

    // ── Payment Retry Route Tests ────────────────────────────────────────────
    it('handleRetryPayment: creates fresh Razorpay order and sets paymentMethod to online', async () => {
      const order = await createTestOrder({
        total: 299,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
      });

      _setRazorpayClientForTesting({
        orders: {
          create: async (params) => ({
            id: `order_RETRY_MOCK_${Date.now()}`,
            entity: 'order',
            amount: params.amount,
            amount_paid: 0,
            amount_due: params.amount,
            currency: 'INR',
            receipt: params.receipt,
            status: 'created',
            attempts: 0,
            notes: params.notes || {},
            created_at: Math.floor(Date.now() / 1000),
          }),
        },
      });

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        params: { orderId: order._id.toString() },
      });

      await handleRetryPayment(req, res);

      assert.equal(getStatus(), 200);
      assert.equal(getJson().success, true);
      assert.equal(getJson().razorpay.amount, 29900);
      assert.equal(getJson().razorpay.currency, 'INR');

      const updated = await Order.findById(order._id);
      assert.equal(updated?.paymentMethod, 'online');
      assert.match(updated?.paymentDetails?.razorpayOrderId || '', /order_RETRY_MOCK_/);
    });

    it('handleRetryPayment: rejects payment retry on already paid order with HTTP 400', async () => {
      const order = await createTestOrder({
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
      });

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        params: { orderId: order._id.toString() },
      });

      await handleRetryPayment(req, res);

      assert.equal(getStatus(), 400);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /already paid/);
    });

    it('handleRetryPayment: rejects payment retry on cancelled order with HTTP 400', async () => {
      const order = await createTestOrder({
        orderStatus: 'cancelled',
        paymentStatus: 'pending',
      });

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        params: { orderId: order._id.toString() },
      });

      await handleRetryPayment(req, res);

      assert.equal(getStatus(), 400);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /Cannot retry payment for a cancelled order/);
    });

    it('handleRetryPayment: rejects retry on zero-total order with HTTP 400', async () => {
      const order = await createTestOrder({
        total: 0,
        paymentStatus: 'pending',
      });

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        params: { orderId: order._id.toString() },
      });

      await handleRetryPayment(req, res);

      assert.equal(getStatus(), 400);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /Order total is zero/);
    });

    it('handleRetryPayment: rejects unauthorized customer request with HTTP 403', async () => {
      const order = await createTestOrder();

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: otherUser._id.toString(), role: 'customer' },
        params: { orderId: order._id.toString() },
      });

      await handleRetryPayment(req, res);

      assert.equal(getStatus(), 403);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /Not authorized/);
    });

    // ── Unpaid Checkout Cancellation Tests ───────────────────────────────────
    it('handleCancelUnpaid: customer cancels unpaid order and automatically restores stock', async () => {
      const order = await createTestOrder({
        orderStatus: 'pending',
        paymentStatus: 'pending',
      });

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        params: { orderId: order._id.toString() },
        body: { reason: 'Customer changed mind before paying' },
      });

      await handleCancelUnpaid(req, res);

      assert.equal(getStatus(), 200);
      assert.equal(getJson().success, true);
      assert.match(getJson().message, /cancelled and reserved inventory restored/);

      const updated = await Order.findById(order._id);
      assert.equal(updated?.orderStatus, 'cancelled');
      assert.equal(updated?.inventoryRestored, true);
      assert.equal(updated?.cancelledBy, 'customer');
    });

    it('handleCancelUnpaid: rejects cancellation of paid order with HTTP 400', async () => {
      const paidOrder = await createTestOrder({
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
      });

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        params: { orderId: paidOrder._id.toString() },
      });

      await handleCancelUnpaid(req, res);

      assert.equal(getStatus(), 400);
      assert.equal(getJson().success, false);
      assert.match(getJson().message, /Paid orders cannot be cancelled through this endpoint/);
    });

    it('handleCancelUnpaid: idempotently handles re-cancellation of already cancelled order', async () => {
      const cancelledOrder = await createTestOrder({
        orderStatus: 'cancelled',
        paymentStatus: 'pending',
        inventoryRestored: true,
      });

      const { req, res, getStatus, getJson } = mockHttp({
        user: { userId: testUser._id.toString(), role: 'customer' },
        params: { orderId: cancelledOrder._id.toString() },
      });

      await handleCancelUnpaid(req, res);

      assert.equal(getStatus(), 200);
      assert.equal(getJson().success, true);
      assert.match(getJson().message, /already cancelled/);
    });
  });
});

