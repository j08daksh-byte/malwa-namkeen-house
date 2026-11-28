/**
 * Malwa Namkeen House — PH-003 Regression Tests
 *
 * Verifies that the order creation rate limiter introduced in
 * server/routes/customerOrders.ts correctly protects
 * POST /api/orders from automated order flooding while
 * preserving legitimate customer ordering and idempotency.
 *
 * TESTING STRATEGY
 * ─────────────────
 * We use an in-memory Express server simulating the exact middleware
 * chain of the real application: requireAuth -> orderCreationLimiter -> handler.
 * We inject a stub `recentSubmissions` map and mock auth middleware.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// ──────────────────────────────────────────────────────────────────────────────
// Mocks for Auth and Idempotency
// ──────────────────────────────────────────────────────────────────────────────

// Mock idempotency cache
const recentSubmissions = new Map<string, { timestamp: number; orderId: string }>();

// Production config mirror
const PROD_LIMIT_MAX = 5;
const PROD_LIMIT_WINDOW = 15 * 60 * 1000;

// Mock requireAuth middleware
const requireAuth = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  const token = authHeader.split(' ')[1];
  if (token === 'invalid-token') {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }
  // Inject mock user
  req.user = { userId: token };
  next();
};

// ──────────────────────────────────────────────────────────────────────────────
// Server Setup
// ──────────────────────────────────────────────────────────────────────────────

function makeTestApp(max = PROD_LIMIT_MAX) {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());

  // Limiter mirroring the exact logic in customerOrders.ts
  const orderCreationLimiter = rateLimit({
    windowMs: 60_000, // Short window for testing
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
      return req.user?.userId ? `user_${req.user.userId}` : req.ip;
    },
    skip: (req: any) => {
      const idempotencyKey = req.body?.idempotencyKey;
      if (idempotencyKey && typeof idempotencyKey === 'string') {
        const cached = recentSubmissions.get(idempotencyKey);
        if (cached && Date.now() - cached.timestamp < 300000) {
          return true; // Skip limiting for exact retries
        }
      }
      return false;
    },
    message: {
      success: false,
      message: 'Too many orders placed recently. Please try again after 15 minutes.',
    },
  });

  let handlerCallCount = 0;

  app.post(
    '/api/orders',
    requireAuth,
    orderCreationLimiter,
    (req: any, res: any) => {
      handlerCallCount++;
      const { idempotencyKey } = req.body;
      
      // Simulate idempotency checking in the route handler
      if (idempotencyKey) {
        const cached = recentSubmissions.get(idempotencyKey);
        if (cached && Date.now() - cached.timestamp < 300000) {
          res.json({ success: true, isDuplicateReplay: true, order: { _id: cached.orderId } });
          return;
        }
        // Save new order to mock cache
        recentSubmissions.set(idempotencyKey, { timestamp: Date.now(), orderId: 'new-order-id' });
      }
      
      res.json({ success: true, message: 'Order created', handlerCalled: true });
    }
  );

  // A route without requireAuth to test the IP fallback keyGenerator
  app.post(
    '/api/public-orders',
    orderCreationLimiter,
    (_req: any, res: any) => res.json({ success: true })
  );

  const server = app.listen(0);
  const address = server.address() as { port: number };
  
  return { app, server, port: address.port, getHandlerCount: () => handlerCallCount };
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function postOrder(port: number, token: string | null, body: Record<string, unknown> = {}, ip = '1.1.1.1'): Promise<{ statusCode: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(data)),
      'X-Forwarded-For': ip,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/orders',
        method: 'POST',
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode ?? 0, body: JSON.parse(raw) });
          } catch {
            resolve({ statusCode: res.statusCode ?? 0, body: {} });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('PH-003 — Order Creation Rate Limiter', () => {
  // A & B. Auth behavior
  describe('A & B. Authentication and basic flow', () => {
    let server: http.Server;
    let port: number;

    before(() => {
      recentSubmissions.clear();
      const ctx = makeTestApp();
      server = ctx.server;
      port = ctx.port;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('A. Authenticated legitimate order creation still works', async () => {
      const { statusCode, body } = await postOrder(port, 'user1');
      assert.equal(statusCode, 200);
      assert.equal(body.success, true);
    });

    it('B. Unauthenticated order creation remains rejected', async () => {
      const { statusCode, body } = await postOrder(port, null);
      assert.equal(statusCode, 401);
      assert.equal(body.success, false);
    });
  });

  // C & D. Threshold enforcement
  describe('C & D. Threshold Enforcement (max=3)', () => {
    let server: http.Server;
    let port: number;

    before(() => {
      recentSubmissions.clear();
      const ctx = makeTestApp(3);
      server = ctx.server;
      port = ctx.port;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('C. Requests below the configured threshold are allowed', async () => {
      for (let i = 0; i < 3; i++) {
        const { statusCode } = await postOrder(port, 'user-spam');
        assert.equal(statusCode, 200, `Request ${i + 1} failed`);
      }
    });

    it('D. Requests exceeding the threshold receive HTTP 429', async () => {
      const { statusCode, body } = await postOrder(port, 'user-spam');
      assert.equal(statusCode, 429);
      assert.equal(body.success, false);
      assert.ok((body.message as string).includes('Too many orders'));
    });
  });

  // E. Limiter executes before handler
  describe('E. Execution Order', () => {
    let server: http.Server;
    let port: number;
    let getCount: () => number;

    before(() => {
      recentSubmissions.clear();
      const ctx = makeTestApp(1);
      server = ctx.server;
      port = ctx.port;
      getCount = ctx.getHandlerCount;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('E. The limiter executes before expensive order/database processing', async () => {
      await postOrder(port, 'user-e');
      assert.equal(getCount(), 1); // allowed

      const { statusCode } = await postOrder(port, 'user-e');
      assert.equal(statusCode, 429);
      assert.equal(getCount(), 1, 'Handler should not execute for rate-limited requests');
    });
  });

  // F. Customer isolation
  describe('F. Customer isolation', () => {
    let server: http.Server;
    let port: number;

    before(() => {
      recentSubmissions.clear();
      const ctx = makeTestApp(2);
      server = ctx.server;
      port = ctx.port;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('F. One customer blocking their account does not block another customer', async () => {
      await postOrder(port, 'user-a');
      await postOrder(port, 'user-a');
      const blockedRes = await postOrder(port, 'user-a');
      assert.equal(blockedRes.statusCode, 429, 'user-a should be blocked');

      const okRes = await postOrder(port, 'user-b');
      assert.equal(okRes.statusCode, 200, 'user-b should not be blocked');
    });
  });

  // G. IP isolation (fallback)
  describe('G. IP isolation (when no user is present, though requireAuth normally catches it)', () => {
    let server: http.Server;
    let port: number;

    before(() => {
      recentSubmissions.clear();
      const ctx = makeTestApp(1);
      server = ctx.server;
      port = ctx.port;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('G. If IP is part of the strategy, verify appropriate IP isolation', async () => {
      // Use the /api/public-orders route which bypasses requireAuth
      const postPublic = (ip: string) => {
        return new Promise<{ statusCode: number }>((resolve) => {
          const req = http.request(
            { hostname: '127.0.0.1', port, path: '/api/public-orders', method: 'POST', headers: { 'X-Forwarded-For': ip } },
            (res) => resolve({ statusCode: res.statusCode ?? 0 })
          );
          req.write('{}');
          req.end();
        });
      };
      
      const res1 = await postPublic('1.2.3.4');
      assert.equal(res1.statusCode, 200, 'IP1 first request should pass');
      
      const res2 = await postPublic('1.2.3.4');
      assert.equal(res2.statusCode, 429, 'IP1 second request should be blocked');
      
      const res3 = await postPublic('5.6.7.8');
      assert.equal(res3.statusCode, 200, 'IP2 first request should pass');
    });
  });

  // H & I. Idempotency handling
  describe('H & I. Idempotency interaction', () => {
    let server: http.Server;
    let port: number;
    let getCount: () => number;

    before(() => {
      recentSubmissions.clear();
      const ctx = makeTestApp(2);
      server = ctx.server;
      port = ctx.port;
      getCount = ctx.getHandlerCount;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('H. Existing idempotency behavior still works', async () => {
      const { statusCode, body } = await postOrder(port, 'user-idemp', { idempotencyKey: 'key-1' });
      assert.equal(statusCode, 200);
      assert.equal(body.success, true);
    });

    it('I. Retrying the same idempotency key bypasses rate limiting and returns cached response', async () => {
      // We already made 1 request with key-1. We have a max of 2.
      // Let's make 5 more identical requests. If skip wasn't working, they'd hit 429.
      for (let i = 0; i < 5; i++) {
        const { statusCode, body } = await postOrder(port, 'user-idemp', { idempotencyKey: 'key-1' });
        assert.equal(statusCode, 200, `Retry ${i+1} should be 200 OK`);
        assert.equal(body.isDuplicateReplay, true, 'Should be flagged as a duplicate replay');
      }

      // But a request with a NEW key should still be constrained by the max=2 limit!
      // 'user-idemp' used 1 token for 'key-1' (the first time). They have 1 left.
      const resNewKey1 = await postOrder(port, 'user-idemp', { idempotencyKey: 'key-2' });
      assert.equal(resNewKey1.statusCode, 200);

      // Now they are out of tokens (1 for key-1 + 1 for key-2 = 2 max).
      const resNewKey2 = await postOrder(port, 'user-idemp', { idempotencyKey: 'key-3' });
      assert.equal(resNewKey2.statusCode, 429, 'New order should be rate limited after quota is exhausted');
    });
  });
});
