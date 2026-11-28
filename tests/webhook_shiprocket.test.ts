/**
 * Malwa Namkeen House — Shiprocket Webhook Route-Level Regression Tests
 *
 * Sends real HTTP requests through /api/shipping/webhook/shiprocket using an isolated
 * test database and mocked external services (no live Shiprocket calls, no customer
 * emails, no production writes).
 *
 * Coverage:
 *  1. Valid authentication passes; invalid/missing tokens return 401.
 *  2. Missing shipment identifiers return 400.
 *  3. Ordinary tracking update (IN TRANSIT) persists correct state.
 *  4. Duplicate delivery of the same event is idempotent (no double transition).
 *  5. Concurrent duplicate deliveries — only one applies the state change.
 *  6. Cancelled-order delivery event is acknowledged without mutating the order.
 *  7. COD reconciliation on DELIVERED — payment marked paid exactly once.
 *  8. Repeated DELIVERED events do not re-apply COD payment side effect.
 *  9. Non-COD (prepaid) DELIVERED event does not alter payment status.
 * 10. RTO/RETURN event does not mark COD as paid.
 * 11. Unidentifiable events (no AWB, no shipmentId, no status) are acknowledged safely.
 *
 * Safety constraints enforced:
 *  - Uses only malwa_namkeen_test database.
 *  - Pre-seeded order MN-QA-20261017-001 is never touched.
 *  - All test orders are created and cleaned up within this run.
 *  - No real Shiprocket API calls.
 *  - No customer emails sent (emailService mocked at server env level).
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { spawn, type ChildProcess } from 'child_process';
import dotenv from 'dotenv';
import mongoose, { Types } from 'mongoose';

import {
  assertSafeTestDatabaseEnvironment,
  verifyLiveServerDatabaseIsolation,
  TestRecordTracker,
} from './test_db_guard.ts';

dotenv.config();
if (fs.existsSync(path.resolve('.env.local'))) {
  dotenv.config({ path: path.resolve('.env.local'), override: true });
}
process.env.IS_E2E_TEST = 'true';
process.env.NODE_ENV = 'test';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const WEBHOOK_PATH = '/api/shipping/webhook/shiprocket';

/** Token configured in SHIPROCKET_WEBHOOK_TOKEN env var for the test server */
const VALID_TOKEN = (process.env.SHIPROCKET_WEBHOOK_TOKEN || '').trim() || 'shiprocket_webhook_secret_daksh_2026';
const INVALID_TOKEN = 'attacker_wrong_token_xyz';

const tracker = new TestRecordTracker('wh_sr');
let spawnedServerProcess: ChildProcess | null = null;
let effectiveDbName = '';

// ── Helpers ─────────────────────────────────────────────────────────────────

async function checkServerHealth(url: string, dbName: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return false;
    const data = await res.json();
    return data.database === dbName && data.status === 'ok';
  } catch {
    return false;
  }
}

async function ensureTestServer(url: string, dbName: string): Promise<void> {
  if (await checkServerHealth(url, dbName)) {
    console.log(`[Webhook Tests] Test server active at ${url} (db: "${dbName}").`);
    return;
  }

  console.log('[Webhook Tests] Spawning isolated test server...');
  const serverPath = fs.existsSync(path.resolve('dist/server.cjs'))
    ? path.resolve('dist/server.cjs')
    : path.resolve('server.ts');

  const serverEnv = {
    ...process.env,
    CI: 'true',
    NODE_ENV: 'test',
    IS_E2E_TEST: 'true',
    PORT: '3000',
    MONGODB_TEST_URI: process.env.MONGODB_TEST_URI,
    MONGODB_TEST_DB_NAME: dbName,
    // Use the configured webhook token so auth tests are deterministic
    SHIPROCKET_WEBHOOK_TOKEN: VALID_TOKEN,
  };

  let serverLogs = '';
  if (serverPath.endsWith('.cjs')) {
    spawnedServerProcess = spawn('node', [serverPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: path.resolve('.'),
      env: serverEnv,
    });
  } else {
    spawnedServerProcess = spawn('npx', ['tsx', serverPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      cwd: path.resolve('.'),
      env: serverEnv,
    });
  }

  spawnedServerProcess.stdout?.on('data', (d) => { serverLogs += d.toString(); });
  spawnedServerProcess.stderr?.on('data', (d) => { serverLogs += d.toString(); });

  const startTime = Date.now();
  while (Date.now() - startTime < 45000) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await checkServerHealth(url, dbName)) {
      console.log(`[Webhook Tests] Test server ready at ${url} (db: "${dbName}").`);
      return;
    }
  }
  throw new Error(`[Webhook Tests] Server did not become healthy within 45s.\n${serverLogs}`);
}

/**
 * Sends a webhook request to the route under test.
 * @param body  Webhook payload
 * @param token Override auth token (defaults to VALID_TOKEN)
 */
async function sendWebhook(body: Record<string, any>, token?: string | null): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token !== null) {
    headers['x-api-key'] = token ?? VALID_TOKEN;
  }
  return fetch(`${BASE_URL}${WEBHOOK_PATH}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Inserts a minimal order document into the test database and registers it for cleanup.
 */
async function createTestOrder(overrides: Record<string, any> = {}): Promise<string> {
  const orderNumber = `MN-WH-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const result = await mongoose.connection.collection('orders').insertOne({
    orderNumber,
    customerInfo: { name: 'Webhook Test Customer', email: 'webhook@test.invalid', phone: '9000000001' },
    shippingAddress: {
      name: 'Webhook Test Customer',
      phone: '9000000001',
      addressLine1: '1 Test Lane',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452001',
    },
    items: [
      {
        productName: 'Ratlami Sev',
        variantLabel: '250g',
        sku: 'SR-WH-TEST',
        price: 150,
        quantity: 1,
        itemTotal: 150,
      },
    ],
    subtotal: 150,
    discount: 0,
    shipping: 0,
    total: 150,
    orderStatus: 'confirmed',
    paymentStatus: 'pending',
    paymentMethod: 'cod',
    shipmentStatus: 'unfulfilled',
    inventoryRestored: false,
    couponRestored: false,
    restorationStatus: 'none',
    processedShippingEvents: [],
    shiprocketDetails: {
      shipmentId: 900000 + Math.floor(Math.random() * 99999),
      awbCode: `AWB-WH-${Date.now()}`,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const id = result.insertedId.toString();
  tracker.orderIds.push(id);
  tracker.orderNumbers.push(orderNumber);
  return orderNumber;
}

async function getOrder(orderNumber: string): Promise<any> {
  return mongoose.connection.collection('orders').findOne({ orderNumber });
}

// ── Test Suite ───────────────────────────────────────────────────────────────

describe('Shiprocket Webhook Route — Safety & Regression Tests', () => {
  before(async () => {
    effectiveDbName = assertSafeTestDatabaseEnvironment();

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_TEST_URI!, {
        dbName: effectiveDbName,
        serverSelectionTimeoutMS: 5000,
      });
    }

    await ensureTestServer(BASE_URL, effectiveDbName);
    const isolation = await verifyLiveServerDatabaseIsolation(BASE_URL);
    if (!isolation.safe) {
      throw new Error(`[Webhook Tests] ABORT: Live server safety check failed: ${isolation.error}`);
    }

    // Verify seeded order is untouched
    const preSeeded = await mongoose.connection.collection('orders').findOne({
      orderNumber: 'MN-QA-20261017-001',
    });
    assert.ok(preSeeded, 'Pre-seeded order MN-QA-20261017-001 must exist in test database');
    assert.equal(preSeeded.orderStatus, 'pending', 'Pre-seeded order must be in pending status');
  });

  after(async () => {
    // Final safety check: pre-seeded order must remain untouched
    const preSeededPost = await mongoose.connection.collection('orders').findOne({
      orderNumber: 'MN-QA-20261017-001',
    });
    if (preSeededPost) {
      assert.equal(
        preSeededPost.orderStatus,
        'pending',
        'CRITICAL: Pre-seeded order MN-QA-20261017-001 must NEVER be mutated by webhook tests!'
      );
    }

    const { cleanedCount, failures } = await tracker.performScopedCleanup();
    console.log(`[Webhook Tests] Teardown: Cleaned ${cleanedCount} test records.`);
    if (failures.length > 0) {
      console.warn('[Webhook Tests] Teardown warnings:', failures);
    }

    if (spawnedServerProcess) {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(spawnedServerProcess.pid), '/T', '/F']);
        } else {
          spawnedServerProcess.kill('SIGTERM');
        }
      } catch { /* ignore */ }
    }

    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // ── 1. Authentication ──────────────────────────────────────────────────────
  describe('1. Authentication — valid and invalid tokens', () => {
    it('accepts requests with the correct x-api-key token', async () => {
      const orderNumber = await createTestOrder();
      const awb = (await getOrder(orderNumber)).shiprocketDetails.awbCode;

      const res = await sendWebhook(
        { awb_code: awb, current_status: 'In Transit', scanned_date: '2026-10-17 09:00:00' },
        VALID_TOKEN
      );
      assert.equal(res.status, 200, `Expected 200 with valid token, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.success, true);
    });

    it('rejects requests with an incorrect token (HTTP 401)', async () => {
      const orderNumber = await createTestOrder();
      const awb = (await getOrder(orderNumber)).shiprocketDetails.awbCode;

      const res = await sendWebhook(
        { awb_code: awb, current_status: 'In Transit', scanned_date: '2026-10-17 09:00:00' },
        INVALID_TOKEN
      );
      assert.equal(res.status, 401, `Expected 401 with invalid token, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    it('rejects requests with no auth header (HTTP 401)', async () => {
      const res = await fetch(`${BASE_URL}${WEBHOOK_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ awb_code: 'AWB-TEST-001', current_status: 'In Transit' }),
      });
      assert.equal(res.status, 401, `Expected 401 with missing token, got ${res.status}`);
    });
  });

  // ── 2. Missing Identifiers ─────────────────────────────────────────────────
  describe('2. Missing shipment identifiers return 400', () => {
    it('rejects webhook payload with no AWB, no shipmentId, and no orderNumber (HTTP 400)', async () => {
      const res = await sendWebhook({ current_status: 'In Transit' });
      assert.equal(res.status, 400, `Expected 400 for missing identifiers, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /missing shipment identifier/i);
    });
  });

  // ── 3. Ordinary Tracking Update ────────────────────────────────────────────
  describe('3. Ordinary tracking update persists correct state', () => {
    it('IN TRANSIT event transitions confirmed order to shipped/in_transit in database', async () => {
      const orderNumber = await createTestOrder({ orderStatus: 'confirmed', shipmentStatus: 'ready_to_ship' });
      const order = await getOrder(orderNumber);
      const awb = order.shiprocketDetails.awbCode;

      const res = await sendWebhook({
        awb_code: awb,
        current_status: 'In Transit',
        scanned_date: '2026-10-17 10:00:00',
      });
      assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.orderStatus, 'shipped');
      assert.equal(data.shipmentStatus, 'in_transit');

      // Verify persisted database state
      const updated = await getOrder(orderNumber);
      assert.equal(updated.orderStatus, 'shipped', 'DB: orderStatus must be shipped');
      assert.equal(updated.shipmentStatus, 'in_transit', 'DB: shipmentStatus must be in_transit');
      assert.ok(
        Array.isArray(updated.processedShippingEvents) && updated.processedShippingEvents.length > 0,
        'DB: processedShippingEvents must contain the event identifier'
      );
    });

    it('accepts tracking updates through endpoint alias /api/shipping/webhook', async () => {
      const orderNumber = await createTestOrder({ orderStatus: 'confirmed', shipmentStatus: 'ready_to_ship' });
      const order = await getOrder(orderNumber);
      const awb = order.shiprocketDetails.awbCode;

      const res = await fetch(`${BASE_URL}/api/shipping/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': VALID_TOKEN },
        body: JSON.stringify({
          awb_code: awb,
          current_status: 'In Transit',
          scanned_date: '2026-10-17 10:15:00',
        }),
      });
      assert.equal(res.status, 200, `Expected 200 from alias route, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.success, true);
    });

    it('correctly resolves order using channel_order_id payload field', async () => {
      const orderNumber = await createTestOrder({ orderStatus: 'confirmed', shipmentStatus: 'ready_to_ship' });

      const res = await sendWebhook({
        channel_order_id: orderNumber,
        current_status: 'In Transit',
        scanned_date: '2026-10-17 10:30:00',
      });
      assert.equal(res.status, 200, `Expected 200 when resolving via channel_order_id, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.success, true);

      const updated = await getOrder(orderNumber);
      assert.equal(updated.orderStatus, 'shipped');
    });
  });

  // ── 4. Duplicate Event (Serial) ────────────────────────────────────────────
  describe('4. Duplicate delivery of the same event is idempotent', () => {
    it('second identical event is acknowledged as already-processed without re-applying state', async () => {
      const orderNumber = await createTestOrder({ orderStatus: 'confirmed', shipmentStatus: 'ready_to_ship' });
      const order = await getOrder(orderNumber);
      const awb = order.shiprocketDetails.awbCode;
      const payload = { awb_code: awb, current_status: 'In Transit', scanned_date: '2026-10-17 11:00:00' };

      // First delivery
      const res1 = await sendWebhook(payload);
      assert.equal(res1.status, 200);
      const data1 = await res1.json();
      assert.equal(data1.success, true);
      assert.equal(data1.alreadyProcessed, undefined, 'First delivery must NOT be flagged as duplicate');

      // Second delivery — same payload
      const res2 = await sendWebhook(payload);
      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.equal(data2.success, true);
      assert.equal(data2.alreadyProcessed, true, 'Second delivery MUST be flagged as duplicate');

      // DB: orderStatus should remain 'shipped' (not reset or doubled)
      const updated = await getOrder(orderNumber);
      assert.equal(updated.orderStatus, 'shipped', 'DB: orderStatus must still be shipped after duplicate');
      // processedShippingEvents should contain exactly one entry (no duplicates in the array)
      const eventCount = updated.processedShippingEvents.length;
      assert.equal(eventCount, 1, `DB: processedShippingEvents must have exactly 1 entry, found ${eventCount}`);
    });
  });

  // ── 5. Concurrent Duplicate Deliveries ────────────────────────────────────
  describe('5. Concurrent duplicate deliveries — atomic protection', () => {
    it('only one of two simultaneous identical events applies the state transition', async () => {
      const orderNumber = await createTestOrder({ orderStatus: 'confirmed', shipmentStatus: 'ready_to_ship' });
      const order = await getOrder(orderNumber);
      const awb = order.shiprocketDetails.awbCode;
      const payload = { awb_code: awb, current_status: 'In Transit', scanned_date: '2026-10-17 12:00:00' };

      // Fire two requests truly concurrently
      const [res1, res2] = await Promise.all([
        sendWebhook(payload),
        sendWebhook(payload),
      ]);

      assert.equal(res1.status, 200, `Concurrent req1 must return 200, got ${res1.status}`);
      assert.equal(res2.status, 200, `Concurrent req2 must return 200, got ${res2.status}`);

      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

      // Exactly one must have applied, the other must be flagged as duplicate or unidentifiable
      const processedCount = [data1, data2].filter((d) => d.success && !d.alreadyProcessed && !d.unidentifiable).length;
      const duplicateCount = [data1, data2].filter((d) => d.alreadyProcessed).length;

      assert.equal(processedCount, 1, `Exactly one concurrent request must apply the event (processed=${processedCount})`);
      assert.equal(duplicateCount, 1, `Exactly one concurrent request must be flagged as duplicate (dup=${duplicateCount})`);

      // DB: orderStatus should be shipped (transitioned exactly once)
      const updated = await getOrder(orderNumber);
      assert.equal(updated.orderStatus, 'shipped', 'DB: orderStatus must be shipped after concurrent events');

      // DB: processedShippingEvents must have exactly one entry
      const eventCount = updated.processedShippingEvents.length;
      assert.equal(eventCount, 1, `DB: event must be recorded exactly once, found ${eventCount}`);
    });
  });

  // ── 6. Cancelled Order — Delivery Event ────────────────────────────────────
  describe('6. Cancelled order — late delivery event is ignored', () => {
    it('DELIVERED event for a cancelled order does not change orderStatus, shipmentStatus, or paymentStatus', async () => {
      const orderNumber = await createTestOrder({
        orderStatus: 'cancelled',
        shipmentStatus: 'in_transit',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        cancelledAt: new Date(),
        cancelledBy: 'customer',
        cancellationReason: 'Customer changed mind',
      });
      const order = await getOrder(orderNumber);
      const awb = order.shiprocketDetails.awbCode;

      const res = await sendWebhook({
        awb_code: awb,
        current_status: 'Delivered',
        scanned_date: '2026-10-17 14:00:00',
      });
      assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.cancelledOrderGuard, true, 'Response must set cancelledOrderGuard: true');

      // Verify database state is completely unchanged
      const updated = await getOrder(orderNumber);
      assert.equal(updated.orderStatus, 'cancelled', 'DB: orderStatus must remain cancelled');
      assert.equal(updated.shipmentStatus, 'in_transit', 'DB: shipmentStatus must not change for cancelled order');
      assert.equal(updated.paymentStatus, 'pending', 'DB: paymentStatus must NOT be marked paid for cancelled order');
      assert.equal(updated.paymentDetails?.gateway, undefined, 'DB: paymentDetails.gateway must not be set');
    });

    it('SHIPPED event for a cancelled order does not restore or change orderStatus', async () => {
      const orderNumber = await createTestOrder({
        orderStatus: 'cancelled',
        shipmentStatus: 'unfulfilled',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        cancelledAt: new Date(),
        cancelledBy: 'admin',
        cancellationReason: 'Admin cancellation test',
      });
      const order = await getOrder(orderNumber);
      const awb = order.shiprocketDetails.awbCode;

      const res = await sendWebhook({
        awb_code: awb,
        current_status: 'Picked Up',
        scanned_date: '2026-10-17 08:00:00',
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.cancelledOrderGuard, true, 'Must guard cancelled order against PICKED UP event too');

      const updated = await getOrder(orderNumber);
      assert.equal(updated.orderStatus, 'cancelled', 'DB: cancelled order must never transition to shipped');
      assert.equal(updated.shipmentStatus, 'unfulfilled', 'DB: shipmentStatus must remain unfulfilled');
    });
  });

  // ── 7. COD Reconciliation on DELIVERED ─────────────────────────────────────
  describe('7. COD reconciliation on DELIVERED event', () => {
    it('marks a COD order as paid on DELIVERED — verifies DB paymentStatus and paidAt', async () => {
      const orderNumber = await createTestOrder({
        orderStatus: 'shipped',
        shipmentStatus: 'out_for_delivery',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
      });
      const order = await getOrder(orderNumber);
      const awb = order.shiprocketDetails.awbCode;

      const before = Date.now();
      const res = await sendWebhook({
        awb_code: awb,
        current_status: 'Delivered',
        scanned_date: '2026-10-17 15:00:00',
      });
      assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.orderStatus, 'delivered');
      assert.equal(data.shipmentStatus, 'delivered');

      // Verify database state
      const updated = await getOrder(orderNumber);
      assert.equal(updated.orderStatus, 'delivered', 'DB: orderStatus must be delivered');
      assert.equal(updated.shipmentStatus, 'delivered', 'DB: shipmentStatus must be delivered');
      assert.equal(updated.paymentStatus, 'paid', 'DB: paymentStatus must be paid after COD delivery');
      assert.equal(updated.paymentDetails?.gateway, 'cod', 'DB: paymentDetails.gateway must be cod');
      assert.ok(updated.paymentDetails?.paidAt, 'DB: paymentDetails.paidAt must be set');
      const paidAt = new Date(updated.paymentDetails.paidAt).getTime();
      assert.ok(paidAt >= before, 'DB: paidAt must be >= request start time');
    });

    it('repeated DELIVERED events do not re-set paidAt or duplicate COD side effects', async () => {
      const orderNumber = await createTestOrder({
        orderStatus: 'shipped',
        shipmentStatus: 'out_for_delivery',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
      });
      const order = await getOrder(orderNumber);
      const awb = order.shiprocketDetails.awbCode;
      const payload = { awb_code: awb, current_status: 'Delivered', scanned_date: '2026-10-17 15:30:00' };

      // First delivery
      const res1 = await sendWebhook(payload);
      assert.equal(res1.status, 200);
      await res1.json(); // consume

      const afterFirst = await getOrder(orderNumber);
      const firstPaidAt = new Date(afterFirst.paymentDetails?.paidAt).getTime();

      // Second delivery — same event
      const res2 = await sendWebhook(payload);
      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.equal(data2.alreadyProcessed, true, 'Second DELIVERED event must be idempotent');

      const afterSecond = await getOrder(orderNumber);
      // paidAt must not have changed
      const secondPaidAt = new Date(afterSecond.paymentDetails?.paidAt).getTime();
      assert.equal(secondPaidAt, firstPaidAt, 'paidAt must not be modified by replay');
      // processedShippingEvents must still have exactly one entry
      assert.equal(
        afterSecond.processedShippingEvents.length,
        1,
        'processedShippingEvents must not grow on replay'
      );
    });

    it('prepaid order DELIVERED event does not alter paymentStatus', async () => {
      const originalPaidAt = new Date('2026-10-15T10:00:00Z');
      const orderNumber = await createTestOrder({
        orderStatus: 'shipped',
        shipmentStatus: 'out_for_delivery',
        paymentMethod: 'online',
        paymentStatus: 'paid',
        paymentDetails: {
          gateway: 'razorpay',
          transactionId: 'pay_PREPAID_WH_TEST',
          paidAt: originalPaidAt,
        },
      });
      const order = await getOrder(orderNumber);
      const awb = order.shiprocketDetails.awbCode;

      const res = await sendWebhook({
        awb_code: awb,
        current_status: 'Delivered',
        scanned_date: '2026-10-17 16:00:00',
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);

      const updated = await getOrder(orderNumber);
      assert.equal(updated.paymentStatus, 'paid', 'Prepaid: paymentStatus must remain paid');
      assert.equal(updated.paymentDetails?.gateway, 'razorpay', 'Prepaid: gateway must remain razorpay');
      const updatedPaidAt = new Date(updated.paymentDetails?.paidAt).toISOString();
      assert.equal(
        updatedPaidAt,
        originalPaidAt.toISOString(),
        'Prepaid: paidAt must NOT be overwritten by delivery event'
      );
    });
  });

  // ── 8. RTO Does Not Mark COD as Paid ──────────────────────────────────────
  describe('8. RTO/RETURN event does not mark COD as paid', () => {
    it('RTO DELIVERED event transitions to returned but never sets paymentStatus to paid', async () => {
      const orderNumber = await createTestOrder({
        orderStatus: 'shipped',
        shipmentStatus: 'in_transit',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
      });
      const order = await getOrder(orderNumber);
      const awb = order.shiprocketDetails.awbCode;

      const res = await sendWebhook({
        awb_code: awb,
        current_status: 'RTO Delivered',
        scanned_date: '2026-10-17 17:00:00',
      });
      assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.success, true);

      const updated = await getOrder(orderNumber);
      assert.equal(updated.shipmentStatus, 'returned', 'DB: shipmentStatus must be returned on RTO');
      assert.equal(updated.paymentStatus, 'pending', 'DB: COD paymentStatus must remain pending on RTO');
      assert.equal(updated.orderStatus, 'shipped', 'DB: orderStatus must not change to delivered on RTO');
    });
  });

  // ── 9. Unidentifiable Events ───────────────────────────────────────────────
  describe('9. Unidentifiable events are acknowledged safely without state change', () => {
    it('event with no stable identifier is acknowledged without applying state transitions', async () => {
      // Payload missing AWB, shipment_id, and order_id — but providing orderNumber that matches
      // This tests the path where we have an orderNumber but no status/scanned_date for stable ID.
      // We'll use a payload where status is blank (making stable ID impossible).
      const orderNumber = await createTestOrder();
      const order = await getOrder(orderNumber);

      const res = await sendWebhook({
        order_id: orderNumber,
        current_status: '', // empty status → stable ID cannot be derived
        // No scanned_date either
      });
      // The route should acknowledge (200) without processing
      assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.unidentifiable, true, 'Must flag unidentifiable event');

      // DB: order must remain completely unchanged
      const updated = await getOrder(orderNumber);
      assert.equal(updated.orderStatus, 'confirmed', 'DB: unidentifiable event must not change orderStatus');
      assert.equal(
        (updated.processedShippingEvents || []).length,
        0,
        'DB: no event must be recorded for unidentifiable events'
      );
    });
  });

  // ── 10. Status Regression Prevention (Out-of-Order Webhook Protection) ──────
  describe('10. Status regression prevention on out-of-order delivery events', () => {
    it('delivered order does not regress back to in_transit when delayed IN TRANSIT scan arrives', async () => {
      const orderNumber = await createTestOrder({
        orderStatus: 'delivered',
        shipmentStatus: 'delivered',
        paymentMethod: 'online',
        paymentStatus: 'paid',
      });
      const order = await getOrder(orderNumber);
      const awb = order.shiprocketDetails.awbCode;

      const res = await sendWebhook({
        awb_code: awb,
        current_status: 'In Transit',
        scanned_date: '2026-10-17 10:00:00', // earlier scan arriving late
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);

      // Verify database state did NOT regress
      const updated = await getOrder(orderNumber);
      assert.equal(updated.orderStatus, 'delivered', 'DB: orderStatus must remain delivered');
      assert.equal(updated.shipmentStatus, 'delivered', 'DB: shipmentStatus must remain delivered and NOT regress to in_transit');
      assert.equal(updated.paymentStatus, 'paid');
    });

    it('out_for_delivery order does not regress back to ready_to_ship when delayed scan arrives', async () => {
      const orderNumber = await createTestOrder({
        orderStatus: 'shipped',
        shipmentStatus: 'out_for_delivery',
        paymentMethod: 'online',
        paymentStatus: 'paid',
      });
      const order = await getOrder(orderNumber);
      const awb = order.shiprocketDetails.awbCode;

      const res = await sendWebhook({
        awb_code: awb,
        current_status: 'Ready To Ship',
        scanned_date: '2026-10-17 07:00:00',
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);

      const updated = await getOrder(orderNumber);
      assert.equal(updated.shipmentStatus, 'out_for_delivery', 'DB: shipmentStatus must remain out_for_delivery');
      assert.equal(updated.orderStatus, 'shipped');
    });
  });
});
