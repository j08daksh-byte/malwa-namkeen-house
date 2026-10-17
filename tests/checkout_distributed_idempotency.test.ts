/**
 * Malwa Namkeen House — Distributed Checkout Idempotency Hardening Test Suite
 *
 * Verifies durable, database-enforced idempotency across concurrent requests
 * and simulated separate serverless instances:
 * 1. Sequential duplicate checkout requests return identical orders with isDuplicateReplay: true.
 * 2. In-flight concurrent race conditions create exactly one order and deduct stock only once.
 * 3. Separate application instances (no shared memory) arbitrate via MongoDB unique lock.
 * 4. Reusing the same key with different checkout payload is rejected with HTTP 400.
 * 5. Different customers with identical idempotency keys are isolated and do not collide.
 * 6. Unauthorized customers cannot retrieve another customer's order through idempotency replay.
 * 7. Unauthenticated (guest) checkouts are rejected with HTTP 401 and do not create locks.
 * 8. Stock exhaustion / validation failure cleanly releases lock and allows immediate correction.
 * 9. Retry after validation failure is permitted without 409 lockout.
 * 10. COD and Razorpay checkout modes both function idempotently without double-charging or duplicate stock deduction.
 * 11. Database duplicate-key collision (E11000) is explicitly caught and handled safely.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express, { Express } from 'express';
import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

import { Order } from '../server/models/Order.ts';
import { Product } from '../server/models/Product.ts';
import { User } from '../server/models/User.ts';
import { StoreSettings } from '../server/models/StoreSettings.ts';
import { IdempotencyRecord } from '../server/models/IdempotencyRecord.ts';
import { Discount } from '../server/models/Discount.ts';
import customerOrdersRouter, { computeCheckoutRequestHash } from '../server/routes/customerOrders.ts';
import customerAccountRouter from '../server/routes/customerAccount.ts';
import { generateToken } from '../server/lib/auth.ts';
import { assertSafeTestDatabaseEnvironment } from './test_db_guard.ts';
import { _setRazorpayClientForTesting } from '../server/lib/razorpayService.ts';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

describe('Distributed Checkout Idempotency Hardening Suite', () => {
  let server1: http.Server;
  let server2: http.Server;
  let port1: number;
  let port2: number;
  let baseUrl1: string;
  let baseUrl2: string;

  // Track created test record IDs for guaranteed cleanup
  const cleanupOrderIds: Types.ObjectId[] = [];
  const cleanupUserIds: Types.ObjectId[] = [];
  const cleanupProductIds: Types.ObjectId[] = [];
  const cleanupDiscountIds: Types.ObjectId[] = [];
  const cleanupScopeKeys: string[] = [];

  let testProduct: any;
  let testVariantId: Types.ObjectId;

  function createTestApp(): Express {
    const app = express();
    app.use(express.json());
    app.use('/api/orders', customerOrdersRouter);
    app.use('/api/customer', customerAccountRouter);
    return app;
  }

  async function createTestCustomer(prefix: string) {
    const user = await User.create({
      name: `Test Customer ${prefix}`,
      email: `test_${prefix.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}_${Math.random().toString(36).substring(7)}@malwanamkeentest.com`,
      password: 'HashedPasswordTest123!',
      role: 'customer',
      active: true,
      phone: '9876543210',
    });
    cleanupUserIds.push(user._id);
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: 'customer',
    });
    return { user, token };
  }

  before(async () => {
    // Verify test database safety guard
    assertSafeTestDatabaseEnvironment();

    if (mongoose.connection.readyState !== 1 && process.env.MONGODB_TEST_URI) {
      await mongoose.connect(process.env.MONGODB_TEST_URI, {
        dbName: process.env.MONGODB_TEST_DB_NAME || 'malwa_namkeen_test',
        serverSelectionTimeoutMS: 8000,
      });
    }

    // Ensure database unique indexes exist on test DB
    await IdempotencyRecord.createIndexes();
    await Order.createIndexes();

    // Ensure store delivery settings exist
    const existingSettings = await StoreSettings.findOne();
    if (!existingSettings) {
      await StoreSettings.create({
        deliverySettings: {
          minOrderValue: 0,
          freeShippingThreshold: 500,
          standardShippingFee: 50,
        },
      });
    }

    // Create a test product with ample stock
    testVariantId = new Types.ObjectId();
    testProduct = await Product.create({
      name: 'Idempotency Test Ratlami Sev',
      slug: `idemp-test-ratlami-${Date.now()}`,
      category: new Types.ObjectId(),
      description: 'Delicious authentic crispy Ratlami Sev for testing idempotency.',
      images: ['/test-ratlami.jpg'],
      active: true,
      variants: [
        {
          _id: testVariantId,
          label: '500g',
          sku: `IDEMP-500G-${Date.now()}`,
          price: 200,
          salePrice: 180,
          stock: 50,
          active: true,
          sortOrder: 0,
        },
      ],
    });
    cleanupProductIds.push(testProduct._id);

    // Spin up Server 1 (Instance 1)
    const app1 = createTestApp();
    server1 = http.createServer(app1);
    await new Promise<void>(resolve => {
      server1.listen(0, '127.0.0.1', () => {
        const addr = server1.address() as any;
        port1 = addr.port;
        baseUrl1 = `http://127.0.0.1:${port1}`;
        resolve();
      });
    });

    // Spin up Server 2 (Instance 2 simulating a separate Vercel Serverless Lambda)
    const app2 = createTestApp();
    server2 = http.createServer(app2);
    await new Promise<void>(resolve => {
      server2.listen(0, '127.0.0.1', () => {
        const addr = server2.address() as any;
        port2 = addr.port;
        baseUrl2 = `http://127.0.0.1:${port2}`;
        resolve();
      });
    });
  });

  after(async () => {
    // Close HTTP servers
    if (server1) server1.close();
    if (server2) server2.close();

    // Clean up created orders
    if (cleanupOrderIds.length > 0) {
      await Order.deleteMany({ _id: { $in: cleanupOrderIds } });
    }

    // Clean up created users
    if (cleanupUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: cleanupUserIds } });
    }

    // Clean up created products
    if (cleanupProductIds.length > 0) {
      await Product.deleteMany({ _id: { $in: cleanupProductIds } });
    }

    // Clean up created discounts
    if (cleanupDiscountIds.length > 0) {
      await Discount.deleteMany({ _id: { $in: cleanupDiscountIds } });
    }

    // Clean up idempotency records
    if (cleanupScopeKeys.length > 0) {
      await IdempotencyRecord.deleteMany({ scopeKey: { $in: cleanupScopeKeys } });
    }

    _setRazorpayClientForTesting(null);

    // Allow background non-blocking email dispatch promises to settle
    await new Promise(r => setTimeout(r, 300));

    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  beforeEach(() => {
    _setRazorpayClientForTesting(null);
  });

  function makeValidCheckoutPayload(overrides: Record<string, any> = {}) {
    return {
      items: [
        {
          productId: testProduct._id.toString(),
          variantId: testVariantId.toString(),
          quantity: 2,
        },
      ],
      shippingAddress: {
        name: 'Idempotency Tester',
        phone: '9876543210',
        addressLine1: '123 Market Street',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
      },
      paymentMethod: 'cod',
      ...overrides,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Test 1: Sequential Replay with Same Idempotency Key
  // ────────────────────────────────────────────────────────────────────────────
  it('1. Sequential requests with same key return identical order with isDuplicateReplay: true', async () => {
    const { user, token } = await createTestCustomer('Seq');
    const key = `test-seq-${Date.now()}`;
    const scopeKey = `cust_${user._id.toString()}:${key}`;
    cleanupScopeKeys.push(scopeKey);

    const payload = makeValidCheckoutPayload({ idempotencyKey: key });

    // Request 1: Original Order Creation
    const res1 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data1 = await res1.json();
    assert.equal(res1.status, 201);
    assert.equal(data1.success, true);
    assert.ok(data1.order?._id);
    const firstOrderId = data1.order._id;
    cleanupOrderIds.push(new Types.ObjectId(firstOrderId));

    // Request 2: Sequential Retry with same key
    const res2 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data2 = await res2.json();
    assert.ok([200, 201].includes(res2.status));
    assert.equal(data2.success, true);
    assert.equal(data2.isDuplicateReplay, true);
    assert.equal(data2.order._id.toString(), firstOrderId.toString());
    assert.equal(data2.order.orderNumber, data1.order.orderNumber);

    // Verify only 1 order exists in database for this key
    const orderCount = await Order.countDocuments({
      customer: user._id,
      idempotencyKey: key,
    });
    assert.equal(orderCount, 1);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 2: Concurrent Race Condition (Same Key against Real Database)
  // ────────────────────────────────────────────────────────────────────────────
  it('2. Concurrent requests with same key create exactly ONE order and deduct stock only ONCE', async () => {
    const { user, token } = await createTestCustomer('Conc');
    const key = `test-conc-${Date.now()}`;
    const scopeKey = `cust_${user._id.toString()}:${key}`;
    cleanupScopeKeys.push(scopeKey);

    const prodBefore = await Product.findById(testProduct._id).lean();
    const variantBefore = prodBefore?.variants?.find((v: any) => v._id.toString() === testVariantId.toString());
    const initialStock = variantBefore?.stock || 0;

    const payload = makeValidCheckoutPayload({
      idempotencyKey: key,
      items: [
        {
          productId: testProduct._id.toString(),
          variantId: testVariantId.toString(),
          quantity: 3,
        },
      ],
    });

    // Fire 2 concurrent requests simultaneously
    const [resA, resB] = await Promise.all([
      fetch(`${baseUrl1}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }),
      fetch(`${baseUrl1}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }),
    ]);

    const dataA = await resA.json();
    const dataB = await resB.json();

    // Verify exactly one order exists in database
    const orders = await Order.find({ customer: user._id, idempotencyKey: key });
    assert.equal(orders.length, 1);
    cleanupOrderIds.push(orders[0]._id);

    // Both requests must not create separate orders
    const successResponses = [dataA, dataB].filter(d => d.success);
    assert.ok(successResponses.length >= 1);
    for (const d of successResponses) {
      assert.equal(d.order._id.toString(), orders[0]._id.toString());
    }

    // Verify inventory was deducted exactly ONCE (by 3 units, NOT 6)
    const prodAfter = await Product.findById(testProduct._id).lean();
    const variantAfter = prodAfter?.variants?.find((v: any) => v._id.toString() === testVariantId.toString());
    const finalStock = variantAfter?.stock || 0;
    assert.equal(initialStock - finalStock, 3);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 3: Cross-Instance Concurrency (Separate Express Server Instances)
  // ────────────────────────────────────────────────────────────────────────────
  it('3. Cross-instance concurrent requests (simulating separate Vercel Lambdas) arbitrate via MongoDB unique lock', async () => {
    const { user, token } = await createTestCustomer('CrossInst');
    const key = `test-cross-inst-${Date.now()}`;
    const scopeKey = `cust_${user._id.toString()}:${key}`;
    cleanupScopeKeys.push(scopeKey);

    const payload = makeValidCheckoutPayload({
      idempotencyKey: key,
      items: [
        {
          productId: testProduct._id.toString(),
          variantId: testVariantId.toString(),
          quantity: 1,
        },
      ],
    });

    // Fire simultaneously to Instance 1 and Instance 2 (no shared process memory)
    const [resInst1, resInst2] = await Promise.all([
      fetch(`${baseUrl1}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }),
      fetch(`${baseUrl2}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }),
    ]);

    const dataInst1 = await resInst1.json();
    const dataInst2 = await resInst2.json();

    // Verify exactly one order exists in the shared MongoDB database
    const orders = await Order.find({ customer: user._id, idempotencyKey: key });
    assert.equal(orders.length, 1);
    cleanupOrderIds.push(orders[0]._id);

    // Neither instance created a duplicate
    const validOrders = [dataInst1, dataInst2].filter(d => d.order?._id);
    for (const d of validOrders) {
      assert.equal(d.order._id.toString(), orders[0]._id.toString());
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 4: Key Reused with Materially Different Checkout Data
  // ────────────────────────────────────────────────────────────────────────────
  it('4. Reusing the same key with different checkout payload is rejected with HTTP 400', async () => {
    const { user, token } = await createTestCustomer('Diff');
    const key = `test-diff-${Date.now()}`;
    const scopeKey = `cust_${user._id.toString()}:${key}`;
    cleanupScopeKeys.push(scopeKey);

    const payload1 = makeValidCheckoutPayload({
      idempotencyKey: key,
      shippingAddress: {
        name: 'Original Name',
        phone: '9876543210',
        addressLine1: 'Address 1',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
      },
    });

    // Initial order
    const res1 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload1),
    });
    const data1 = await res1.json();
    assert.equal(res1.status, 201);
    cleanupOrderIds.push(new Types.ObjectId(data1.order._id));

    // Materially different payload (different address and quantity) with same key
    const payload2 = makeValidCheckoutPayload({
      idempotencyKey: key,
      items: [
        {
          productId: testProduct._id.toString(),
          variantId: testVariantId.toString(),
          quantity: 5,
        },
      ],
      shippingAddress: {
        name: 'Different Name',
        phone: '9999999999',
        addressLine1: 'Completely Different Street',
        city: 'Bhopal',
        state: 'Madhya Pradesh',
        pincode: '462001',
      },
    });

    const res2 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload2),
    });

    const data2 = await res2.json();
    assert.equal(res2.status, 400);
    assert.equal(data2.success, false);
    assert.match(data2.message, /Idempotency key was previously used with different checkout data/i);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 5: Different Customers Using Otherwise Identical Checkout Requests
  // ────────────────────────────────────────────────────────────────────────────
  it('5. Different customers using identical idempotency keys are isolated and do not collide', async () => {
    const { user: userA, token: tokenA } = await createTestCustomer('CustA');
    const { user: userB, token: tokenB } = await createTestCustomer('CustB');

    const key = `shared-client-key-${Date.now()}`;
    const scopeKey1 = `cust_${userA._id.toString()}:${key}`;
    const scopeKey2 = `cust_${userB._id.toString()}:${key}`;
    cleanupScopeKeys.push(scopeKey1, scopeKey2);

    const payload = makeValidCheckoutPayload({ idempotencyKey: key });

    // Customer 1 places order
    const res1 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(payload),
    });
    const data1 = await res1.json();
    assert.equal(res1.status, 201);
    const dbOrder1 = await Order.findById(data1.order._id).lean();
    assert.equal(dbOrder1?.customer?.toString(), userA._id.toString());
    cleanupOrderIds.push(new Types.ObjectId(data1.order._id));

    // Customer 2 places order with the EXACT same idempotency key
    const res2 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify(payload),
    });
    const data2 = await res2.json();
    assert.equal(res2.status, 201);
    const dbOrder2 = await Order.findById(data2.order._id).lean();
    assert.equal(dbOrder2?.customer?.toString(), userB._id.toString());
    cleanupOrderIds.push(new Types.ObjectId(data2.order._id));

    // Both orders must exist independently
    assert.notEqual(data1.order._id, data2.order._id);
    assert.notEqual(data1.order.orderNumber, data2.order.orderNumber);

    // Verify both scoped records exist in IdempotencyRecord
    const records = await IdempotencyRecord.find({ key });
    assert.equal(records.length, 2);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 6: Unauthorized Customer Cannot Replay or Access Other User's Order
  // ────────────────────────────────────────────────────────────────────────────
  it('6. Unauthorized customer cannot retrieve another customer order details', async () => {
    const { user: ownerUser, token: ownerToken } = await createTestCustomer('Owner');
    const { token: attackerToken } = await createTestCustomer('Attacker');

    const key = `test-unauth-leak-${Date.now()}`;
    const scopeKey = `cust_${ownerUser._id.toString()}:${key}`;
    cleanupScopeKeys.push(scopeKey);

    const payload = makeValidCheckoutPayload({ idempotencyKey: key });

    // Customer 1 creates order
    const res1 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data1 = await res1.json();
    assert.equal(res1.status, 201);
    const orderId = data1.order._id;
    cleanupOrderIds.push(new Types.ObjectId(orderId));

    // Customer 2 attempts to query Customer 1's order via customer account route
    const res2 = await fetch(`${baseUrl1}/api/customer/orders/${orderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${attackerToken}`,
      },
    });
    assert.equal(res2.status, 403);

    // Customer 2 attempts to replay Customer 1's key:
    const resReplay = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attackerToken}`,
      },
      body: JSON.stringify(payload),
    });
    const dataReplay = await resReplay.json();
    assert.equal(resReplay.status, 201);
    // Customer 2 receives their own newly created order, never Customer 1's order
    assert.notEqual(dataReplay.order._id.toString(), orderId.toString());
    cleanupOrderIds.push(new Types.ObjectId(dataReplay.order._id));
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 7: Unauthenticated (Guest) Checkout Rejection
  // ────────────────────────────────────────────────────────────────────────────
  it('7. Unauthenticated checkout requests are rejected with HTTP 401 without creating locks', async () => {
    const key = `test-guest-${Date.now()}`;
    const payload = makeValidCheckoutPayload({ idempotencyKey: key });

    const res = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No Authorization header
      },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 401);
    const records = await IdempotencyRecord.find({ key });
    assert.equal(records.length, 0);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 8: Stock Exhaustion & Insufficient Inventory Safety
  // ────────────────────────────────────────────────────────────────────────────
  it('8. Insufficient stock cleanly releases the lock and allows immediate correction', async () => {
    const { user, token } = await createTestCustomer('Stock');
    const key = `test-stock-fail-${Date.now()}`;
    const scopeKey = `cust_${user._id.toString()}:${key}`;
    cleanupScopeKeys.push(scopeKey);

    // Request exceeding variant stock (500 units)
    const payloadExcess = makeValidCheckoutPayload({
      idempotencyKey: key,
      items: [
        {
          productId: testProduct._id.toString(),
          variantId: testVariantId.toString(),
          quantity: 500,
        },
      ],
    });

    const res1 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payloadExcess),
    });

    assert.equal(res1.status, 400);
    const data1 = await res1.json();
    assert.match(data1.message, /Insufficient stock/i);

    // Verify lock is cleared from IdempotencyRecord
    const record = await IdempotencyRecord.findOne({ scopeKey });
    assert.equal(record, null);

    // User corrects quantity to 1 unit with a new key and checkout succeeds
    const keyValid = `test-stock-valid-${Date.now()}`;
    cleanupScopeKeys.push(`cust_${user._id.toString()}:${keyValid}`);
    const payloadValid = makeValidCheckoutPayload({
      idempotencyKey: keyValid,
      items: [
        {
          productId: testProduct._id.toString(),
          variantId: testVariantId.toString(),
          quantity: 1,
        },
      ],
    });

    const res2 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payloadValid),
    });

    assert.equal(res2.status, 201);
    const data2 = await res2.json();
    assert.equal(data2.success, true);
    cleanupOrderIds.push(new Types.ObjectId(data2.order._id));
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 9: Retry After Transient Failure
  // ────────────────────────────────────────────────────────────────────────────
  it('9. Retry after validation failure is permitted without 409 lockout', async () => {
    const { user, token } = await createTestCustomer('Retry');
    const key = `test-retry-invalid-pin-${Date.now()}`;
    const scopeKey = `cust_${user._id.toString()}:${key}`;
    cleanupScopeKeys.push(scopeKey);

    // Step 1: Invalid PIN code
    const payloadBad = makeValidCheckoutPayload({
      idempotencyKey: key,
      shippingAddress: {
        name: 'Idempotency Tester',
        phone: '9876543210',
        addressLine1: '123 Market Street',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: 'INVALID',
      },
    });

    const res1 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payloadBad),
    });
    assert.equal(res1.status, 400);

    // Lock was released: IdempotencyRecord must not be left in 'started' state
    const recordCheck = await IdempotencyRecord.findOne({ scopeKey });
    assert.equal(recordCheck, null);

    // Step 2: Retry with valid PIN code
    const payloadGood = makeValidCheckoutPayload({
      idempotencyKey: key,
      shippingAddress: {
        name: 'Idempotency Tester',
        phone: '9876543210',
        addressLine1: '123 Market Street',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
      },
    });

    const res2 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payloadGood),
    });

    assert.equal(res2.status, 201);
    const data2 = await res2.json();
    assert.equal(data2.success, true);
    cleanupOrderIds.push(new Types.ObjectId(data2.order._id));
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 10: COD and Razorpay Checkout Compatibility
  // ────────────────────────────────────────────────────────────────────────────
  it('10. COD and Razorpay checkout modes both support idempotent retry', async () => {
    const { user, token } = await createTestCustomer('PaymentModes');

    // 10A: COD mode
    const keyCod = `test-cod-mode-${Date.now()}`;
    cleanupScopeKeys.push(`cust_${user._id.toString()}:${keyCod}`);
    const payloadCod = makeValidCheckoutPayload({
      idempotencyKey: keyCod,
      paymentMethod: 'cod',
    });

    const resCod1 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payloadCod),
    });
    assert.equal(resCod1.status, 201);
    const dataCod1 = await resCod1.json();
    cleanupOrderIds.push(new Types.ObjectId(dataCod1.order._id));

    // Retry COD
    const resCod2 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payloadCod),
    });
    const dataCod2 = await resCod2.json();
    assert.ok([200, 201].includes(resCod2.status));
    assert.equal(dataCod2.isDuplicateReplay, true);
    assert.equal(dataCod2.order._id, dataCod1.order._id);

    // 10B: Razorpay online mode
    const mockRzpOrderId = `order_test_${Date.now()}`;
    _setRazorpayClientForTesting({
      orders: {
        create: async (opts: any) => ({
          id: mockRzpOrderId,
          amount: opts.amount,
          currency: opts.currency,
          receipt: opts.receipt,
          status: 'created',
        } as any),
      },
    } as any);

    const keyOnline = `test-online-mode-${Date.now()}`;
    cleanupScopeKeys.push(`cust_${user._id.toString()}:${keyOnline}`);
    const payloadOnline = makeValidCheckoutPayload({
      idempotencyKey: keyOnline,
      paymentMethod: 'online',
    });

    const resRzp1 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payloadOnline),
    });
    assert.equal(resRzp1.status, 201);
    const dataRzp1 = await resRzp1.json();
    assert.ok(dataRzp1.razorpay?.orderId);
    cleanupOrderIds.push(new Types.ObjectId(dataRzp1.order._id));

    // Retry Razorpay online order with same key
    const resRzp2 = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payloadOnline),
    });
    const dataRzp2 = await resRzp2.json();
    assert.ok([200, 201].includes(resRzp2.status));
    assert.equal(dataRzp2.isDuplicateReplay, true);
    assert.equal(dataRzp2.order._id, dataRzp1.order._id);
    assert.equal(dataRzp2.razorpay?.orderId, dataRzp1.razorpay.orderId);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 11: Explicit Mongo Duplicate-Key (E11000) Collision Handling
  // ────────────────────────────────────────────────────────────────────────────
  it('11. Database duplicate-key collision is handled gracefully without uncaught exceptions', async () => {
    const { user, token } = await createTestCustomer('E11000');
    const key = `test-e11000-${Date.now()}`;
    const scopeKey = `cust_${user._id.toString()}:${key}`;
    cleanupScopeKeys.push(scopeKey);

    const payload = makeValidCheckoutPayload({ idempotencyKey: key });
    const reqHash = computeCheckoutRequestHash(payload);

    // Pre-create a dummy order
    const dummyOrder = await Order.create({
      orderNumber: `MN-PRE-${Date.now()}`,
      customer: user._id,
      customerInfo: {
        name: 'Pre-existing Order',
        email: user.email,
        phone: '9876543210',
      },
      items: [
        {
          productId: testProduct._id,
          variantId: testVariantId,
          productName: testProduct.name,
          variantLabel: '500g',
          sku: 'SKU',
          price: 180,
          quantity: 2,
          itemTotal: 360,
        },
      ],
      subtotal: 360,
      total: 360,
      shipping: 0,
      discount: 0,
      shippingAddress: payload.shippingAddress,
      orderStatus: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'cod',
    });
    cleanupOrderIds.push(dummyOrder._id);

    // Pre-insert an IdempotencyRecord with status: 'completed'
    await IdempotencyRecord.create({
      scopeKey,
      key,
      user: user._id,
      requestHash: reqHash,
      status: 'completed',
      order: dummyOrder._id,
      orderNumber: dummyOrder.orderNumber,
      statusCode: 201,
      responsePayload: {
        order: {
          _id: dummyOrder._id.toString(),
          orderNumber: dummyOrder.orderNumber,
          total: dummyOrder.total,
        },
      },
      expiresAt: new Date(Date.now() + 86400000),
    });

    // Make request: router's IdempotencyRecord.create will encounter duplicate-key E11000
    const res = await fetch(`${baseUrl1}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert.ok([200, 201].includes(res.status));
    assert.equal(data.success, true);
    assert.equal(data.isDuplicateReplay, true);
    assert.equal(data.order._id.toString(), dummyOrder._id.toString());
  });
});
