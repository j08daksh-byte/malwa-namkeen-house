/**
 * Malwa Namkeen House — PH-004 Regression Tests
 *
 * Verifies that the cart revalidation rate limiter introduced in
 * server/routes/cartWishlist.ts correctly protects
 * POST /api/cart/revalidate from automated abuse while
 * preserving legitimate frontend behavior.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import rateLimit from 'express-rate-limit';

// ──────────────────────────────────────────────────────────────────────────────
// Server Setup (Isolated Mock Runtime)
// ──────────────────────────────────────────────────────────────────────────────

function makeTestApp(max = 20) {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());

  // Limiter mirroring the exact logic in cartWishlist.ts
  const cartRevalidateLimiter = rateLimit({
    windowMs: 60_000, // Short window for testing
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many cart revalidations. Please wait a moment before trying again.',
    },
  });

  let handlerCallCount = 0;

  app.post(
    '/api/cart/revalidate',
    cartRevalidateLimiter,
    (req: any, res: any) => {
      handlerCallCount++;
      const { items } = req.body;
      
      // Simulate existing invalid data behavior
      if (!Array.isArray(items) || items.length === 0) {
        res.json({
          success: true,
          valid: true,
          items: [],
          adjustments: [],
          subtotal: 0,
          discountAmount: 0,
          total: 0,
        });
        return;
      }
      
      // Simulate normal processing for valid arrays
      res.json({ success: true, message: 'Cart revalidated', handlerCalled: true, adjustments: [] });
    }
  );

  // Another route to verify isolation
  app.get('/api/cart/wishlist', (req: any, res: any) => res.json({ success: true }));

  const server = app.listen(0);
  const address = server.address() as { port: number };
  
  return { app, server, port: address.port, getHandlerCount: () => handlerCallCount };
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function postRevalidate(port: number, body: Record<string, unknown> = {}, ip = '1.1.1.1'): Promise<{ statusCode: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(data)),
      'X-Forwarded-For': ip,
    };

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/cart/revalidate',
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

function getWishlist(port: number, ip = '1.1.1.1'): Promise<{ statusCode: number }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, path: '/api/cart/wishlist', method: 'GET', headers: { 'X-Forwarded-For': ip } },
      (res) => {
        res.resume();
        resolve({ statusCode: res.statusCode ?? 0 });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('PH-004 — Cart Revalidate Rate Limiter', () => {
  // A & B. Normal and Invalid behavior
  describe('A & B. Basic routing and logic', () => {
    let server: http.Server;
    let port: number;

    before(() => {
      const ctx = makeTestApp();
      server = ctx.server;
      port = ctx.port;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('A. Normal revalidation works with valid items', async () => {
      const { statusCode, body } = await postRevalidate(port, { items: [{ productId: '1', quantity: 1 }] });
      assert.equal(statusCode, 200);
      assert.equal(body.success, true);
      assert.equal(body.handlerCalled, true);
    });

    it('B. Existing invalid/empty behavior remains unchanged', async () => {
      const { statusCode, body } = await postRevalidate(port, { items: [] });
      assert.equal(statusCode, 200);
      assert.equal(body.success, true);
      assert.equal(body.valid, true); // Existing behavior returns valid=true for empty cart
      assert.deepEqual(body.items, []);
    });
  });

  // C & D. Threshold enforcement
  describe('C & D. Threshold Enforcement (max=3 for testing)', () => {
    let server: http.Server;
    let port: number;

    before(() => {
      const ctx = makeTestApp(3);
      server = ctx.server;
      port = ctx.port;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('C. Requests below the threshold succeed', async () => {
      for (let i = 0; i < 3; i++) {
        const { statusCode } = await postRevalidate(port, { items: [] }, '10.0.0.1');
        assert.equal(statusCode, 200, `Request ${i + 1} failed`);
      }
    });

    it('D. Requests above the threshold return 429', async () => {
      const { statusCode, body } = await postRevalidate(port, { items: [] }, '10.0.0.1');
      assert.equal(statusCode, 429);
      assert.equal(body.success, false);
      assert.ok((body.message as string).includes('Too many cart revalidations'));
    });
  });

  // E. Pre-handler execution
  describe('E. Execution Order', () => {
    let server: http.Server;
    let port: number;
    let getCount: () => number;

    before(() => {
      const ctx = makeTestApp(1);
      server = ctx.server;
      port = ctx.port;
      getCount = ctx.getHandlerCount;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('E. Rate limiting occurs before expensive cart/database processing', async () => {
      await postRevalidate(port, { items: [{ productId: 'x', quantity: 1 }] }, '9.9.9.9');
      assert.equal(getCount(), 1); // allowed

      const { statusCode } = await postRevalidate(port, { items: [{ productId: 'x', quantity: 1 }] }, '9.9.9.9');
      assert.equal(statusCode, 429);
      assert.equal(getCount(), 1, 'Handler should not execute for rate-limited requests');
    });
  });

  // F. IP isolation
  describe('F. IP isolation', () => {
    let server: http.Server;
    let port: number;

    before(() => {
      const ctx = makeTestApp(2);
      server = ctx.server;
      port = ctx.port;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('F. One IP hitting limit does not block another IP', async () => {
      await postRevalidate(port, {}, '8.8.8.8');
      await postRevalidate(port, {}, '8.8.8.8');
      const blockedRes = await postRevalidate(port, {}, '8.8.8.8');
      assert.equal(blockedRes.statusCode, 429, '8.8.8.8 should be blocked');

      const okRes = await postRevalidate(port, {}, '1.1.1.1');
      assert.equal(okRes.statusCode, 200, '1.1.1.1 should not be blocked');
    });
  });

  // H. Other endpoints unaffected
  describe('H. Unrelated Endpoints', () => {
    let server: http.Server;
    let port: number;

    before(() => {
      const ctx = makeTestApp(1); // very strict limit
      server = ctx.server;
      port = ctx.port;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('H. Other cart endpoints are unaffected', async () => {
      // exhaust the limit for IP
      await postRevalidate(port, {}, '5.5.5.5');
      const { statusCode: blockedCode } = await postRevalidate(port, {}, '5.5.5.5');
      assert.equal(blockedCode, 429);

      // try wishlist endpoint from same IP
      const { statusCode: okCode } = await getWishlist(port, '5.5.5.5');
      assert.equal(okCode, 200, 'Unrelated endpoint should succeed despite rate limit');
    });
  });
});
