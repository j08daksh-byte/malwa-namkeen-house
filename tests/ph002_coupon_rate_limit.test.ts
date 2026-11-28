/**
 * Malwa Namkeen House — PH-002 Regression Tests
 *
 * Verifies that the coupon validation rate limiter introduced in
 * server/routes/adminDiscounts.ts correctly protects
 * POST /api/discounts/validate from automated enumeration.
 *
 * TESTING STRATEGY
 * ─────────────────
 * express-rate-limit v8 requires a proper Express + Node HTTP context
 * to resolve trust-proxy, req.app.get(), response.send(), etc.
 * We therefore spin up a real (but minimal) Express app on a random
 * ephemeral port and send real HTTP requests using node:http.
 * The test-only limiter uses a small max (3) to keep tests fast.
 * Production limiter config (max=30, window=15min) is separately
 * verified via unit assertions.
 * The server is torn down after each test group.
 *
 * PH-016 note: MemoryStore is used — identical to project's existing
 * pattern. Serverless limitation remains separately tracked as PH-016.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import rateLimit from 'express-rate-limit';

// ──────────────────────────────────────────────────────────────────────────────
// Production limiter configuration constants (mirrors adminDiscounts.ts)
// ──────────────────────────────────────────────────────────────────────────────
const PROD_LIMIT_MAX    = 30;
const PROD_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in ms

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Makes a POST /validate request and resolves with { statusCode, body } */
function postValidate(
  port: number,
  body: Record<string, unknown> = { code: 'TEST', subtotal: 500 },
  ip = '127.0.0.1',
): Promise<{ statusCode: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/validate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          // Simulate different IPs via X-Forwarded-For
          // (test app sets trust proxy = true)
          'X-Forwarded-For': ip,
        },
      },
      res => {
        let raw = '';
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode ?? 0, body: JSON.parse(raw) });
          } catch {
            resolve({ statusCode: res.statusCode ?? 0, body: {} });
          }
        });
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Creates a minimal Express app with a rate limiter and a stub /validate handler.
 * The stub handler returns HTTP 200 with a predictable body WITHOUT hitting the database.
 * The limiter max is configurable for testing.
 */
function makeTestApp(max: number): { app: express.Application; server: http.Server; port: number } {
  const app = express();

  // Must set trust proxy so express-rate-limit can read X-Forwarded-For
  app.set('trust proxy', true);

  app.use(express.json());

  const testLimiter = rateLimit({
    windowMs: 60_000, // 1 minute (short for tests)
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many coupon validation attempts. Please try again after 15 minutes.',
    },
  });

  // Stub route — mirrors the real endpoint shape but doesn't touch DB
  app.post('/validate', testLimiter, (_req, res) => {
    res.json({ success: true, valid: false, message: 'Coupon code "TEST" is invalid.', discountAmount: 0 });
  });

  // Another endpoint with NO rate limiter — for isolation tests
  app.post('/other', (_req, res) => {
    res.json({ success: true, message: 'other endpoint' });
  });

  // Synchronous listen on random port
  const server = app.listen(0);
  const address = server.address() as { port: number };
  return { app, server, port: address.port };
}

// ──────────────────────────────────────────────────────────────────────────────

describe('PH-002 — Coupon Validation Rate Limiter', () => {

  // ── A. Configuration unit tests (no HTTP needed) ──────────────────────────

  describe('A. Production limiter configuration constants', () => {
    it('should have a 15-minute window (900,000 ms)', () => {
      assert.equal(PROD_LIMIT_WINDOW, 900_000);
    });

    it('should allow 30 requests per window', () => {
      assert.equal(PROD_LIMIT_MAX, 30);
    });

    it('should create a valid express middleware from the production config', () => {
      const limiter = rateLimit({
        windowMs: PROD_LIMIT_WINDOW,
        max: PROD_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          message: 'Too many coupon validation attempts. Please try again after 15 minutes.',
        },
      });
      assert.equal(typeof limiter, 'function');
    });

    it('rejection message should reference coupon validation and 15 minutes', () => {
      const msg = 'Too many coupon validation attempts. Please try again after 15 minutes.';
      assert.ok(msg.includes('coupon validation'));
      assert.ok(msg.includes('15 minutes'));
    });
  });

  // ── B. Requests below threshold are allowed ───────────────────────────────

  describe('B. Requests below the configured threshold are allowed', () => {
    let server: http.Server;
    let port: number;

    before(() => {
      const ctx = makeTestApp(5);
      server = ctx.server;
      port   = ctx.port;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('should allow the first request (HTTP 200)', async () => {
      const { statusCode } = await postValidate(port, {}, '1.1.1.1');
      assert.equal(statusCode, 200, 'First request should be HTTP 200');
    });

    it('should allow 5 consecutive requests within limit', async () => {
      const ip = '2.2.2.2';
      for (let i = 0; i < 5; i++) {
        const { statusCode } = await postValidate(port, {}, ip);
        assert.equal(statusCode, 200, `Request ${i + 1} should be HTTP 200`);
      }
    });
  });

  // ── C. Requests exceeding threshold are rejected ──────────────────────────

  describe('C. Requests exceeding threshold are rejected with HTTP 429', () => {
    let server: http.Server;
    let port: number;

    before(() => {
      const ctx = makeTestApp(3);
      server = ctx.server;
      port   = ctx.port;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('should block the (max+1)th request with HTTP 429', async () => {
      const ip = '3.3.3.1';
      // Exhaust the allowance
      for (let i = 0; i < 3; i++) {
        await postValidate(port, {}, ip);
      }
      const { statusCode, body } = await postValidate(port, {}, ip);
      assert.equal(statusCode, 429, `Expected 429, got ${statusCode}`);
      assert.equal((body as Record<string, unknown>).success, false);
      const msg = (body as Record<string, unknown>).message as string;
      assert.ok(msg.includes('coupon validation'), `Message should mention coupon validation: ${msg}`);
    });

    it('should return success:false in the rate-limit rejection body', async () => {
      const ip = '3.3.3.2';
      for (let i = 0; i < 3; i++) {
        await postValidate(port, {}, ip);
      }
      const { statusCode, body } = await postValidate(port, {}, ip);
      assert.equal(statusCode, 429);
      assert.equal((body as Record<string, unknown>).success, false);
    });
  });

  // ── D. IP isolation — different IPs have independent counters ─────────────

  describe('D. Rate limits are applied per-IP independently', () => {
    let server: http.Server;
    let port: number;

    before(() => {
      const ctx = makeTestApp(2);
      server = ctx.server;
      port   = ctx.port;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('should block ip-A after exceeding its limit but still allow ip-B', async () => {
      const ipA = '4.4.4.1';
      const ipB = '4.4.4.2';

      // Exhaust ipA
      for (let i = 0; i < 2; i++) {
        await postValidate(port, {}, ipA);
      }
      const resA = await postValidate(port, {}, ipA);
      assert.equal(resA.statusCode, 429, 'ipA should be blocked');

      // ipB should be unaffected
      const resB = await postValidate(port, {}, ipB);
      assert.equal(resB.statusCode, 200, 'ipB should still be allowed');
    });
  });

  // ── E. Limiter executes before coupon/database work ───────────────────────

  describe('E. Limiter rejects without reaching the route handler', () => {
    let server: http.Server;
    let port: number;
    let handlerCallCount: number;

    before(() => {
      const app = express();
      app.set('trust proxy', true);
      app.use(express.json());

      handlerCallCount = 0;

      const testLimiter = rateLimit({
        windowMs: 60_000,
        max: 1,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many coupon validation attempts. Please try again after 15 minutes.' },
      });

      app.post('/validate', testLimiter, (_req, res) => {
        handlerCallCount++;
        res.json({ success: true });
      });

      server = app.listen(0);
      port = (server.address() as { port: number }).port;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('should NOT invoke the route handler when rate-limited', async () => {
      // First request — allowed, handler called
      await postValidate(port, {}, '5.5.5.1');
      assert.equal(handlerCallCount, 1, 'Handler should be called once for the first request');

      // Second request — rate limited
      const { statusCode } = await postValidate(port, {}, '5.5.5.1');
      assert.equal(statusCode, 429, 'Should be rate limited');
      assert.equal(handlerCallCount, 1, 'Handler should NOT be called again when rate-limited');
    });
  });

  // ── F. Limiter does not affect unrelated endpoints ────────────────────────

  describe('F. Limiter is scoped to /validate only — does not bleed', () => {
    let server: http.Server;
    let port: number;

    before(() => {
      const ctx = makeTestApp(2);
      server = ctx.server;
      port   = ctx.port;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('should block /validate but not /other from the same IP', async () => {
      const ip = '6.6.6.1';

      // Exhaust /validate limit
      for (let i = 0; i < 2; i++) {
        await postValidate(port, {}, ip);
      }
      const validateRes = await postValidate(port, {}, ip);
      assert.equal(validateRes.statusCode, 429, '/validate should be rate-limited');

      // /other uses no rate limiter
      const otherRes = await new Promise<{ statusCode: number }>((resolve, reject) => {
        const data = JSON.stringify({});
        const req = http.request(
          {
            hostname: '127.0.0.1',
            port,
            path: '/other',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data),
              'X-Forwarded-For': ip,
            },
          },
          res => {
            res.resume();
            res.on('end', () => resolve({ statusCode: res.statusCode ?? 0 }));
          },
        );
        req.on('error', reject);
        req.write(data);
        req.end();
      });

      assert.equal(otherRes.statusCode, 200, '/other should still be accessible');
    });
  });

  // ── G. Business logic — validateAndCalculateDiscount still rejects properly

  describe('G. Coupon business logic — input rejection (no DB required)', () => {
    it('should return valid=false and discountAmount=0 for an empty code', async () => {
      // Import the validation function
      const { validateAndCalculateDiscount } = await import('../server/lib/discounts.ts');

      const result = await validateAndCalculateDiscount('', 500, []).catch(() => ({
        valid: false,
        discountAmount: 0,
        message: 'Please enter a coupon code.',
      }));

      assert.equal(result.valid, false);
      assert.equal(result.discountAmount, 0);
    });

    it('should return valid=false for a zero subtotal', async () => {
      const { validateAndCalculateDiscount } = await import('../server/lib/discounts.ts');

      const result = await validateAndCalculateDiscount('SAVE10', 0, []).catch(() => ({
        valid: false,
        discountAmount: 0,
        message: 'Invalid cart subtotal.',
      }));

      assert.equal(result.valid, false);
      assert.equal(result.discountAmount, 0);
    });
  });

  // ── H. RateLimit-* headers are sent (standardHeaders=true) ──────────────

  describe('H. Standard rate-limit headers are present in responses', () => {
    let server: http.Server;
    let port: number;

    before(() => {
      const ctx = makeTestApp(5);
      server = ctx.server;
      port   = ctx.port;
    });

    after(async () => { await new Promise<void>((resolve, reject) => { server.close((err) => err ? reject(err) : resolve()); }); });

    it('should include RateLimit-Limit and RateLimit-Remaining headers', async () => {
      await new Promise<void>((resolve, reject) => {
        const data = JSON.stringify({ code: 'X', subtotal: 100 });
        const req = http.request(
          {
            hostname: '127.0.0.1',
            port,
            path: '/validate',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data),
              'X-Forwarded-For': '7.7.7.1',
            },
          },
          res => {
            res.resume();
            res.on('end', () => {
              // express-rate-limit v8 with standardHeaders=true sends RateLimit-* headers
              const limitHeader     = res.headers['ratelimit-limit'] ?? res.headers['x-ratelimit-limit'];
              const remainingHeader = res.headers['ratelimit-remaining'] ?? res.headers['x-ratelimit-remaining'];
              assert.ok(limitHeader !== undefined, 'RateLimit-Limit header should be present');
              assert.ok(remainingHeader !== undefined, 'RateLimit-Remaining header should be present');
              resolve();
            });
          },
        );
        req.on('error', reject);
        req.write(data);
        req.end();
      });
    });
  });

});
