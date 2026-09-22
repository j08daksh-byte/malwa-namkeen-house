/**
 * Malwa Namkeen House — PH-005 Regression Tests
 *
 * Verifies that the public inquiry endpoint (POST /api/admin/inquiries/public)
 * correctly validates email addresses using a practical, ReDoS-safe rule
 * without breaking legitimate business flow.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import mongoose from 'mongoose';

// Since we are not querying real DB in this isolated test, we can mock the router slightly
// or just mount the real router but intercept Mongoose.
// To keep it ISOLATED/MOCKED RUNTIME and test just the boundary validation,
// we will import the router directly but mock Mongoose connection to prevent actual writes,
// or we can test the exact regex logic directly.
// The prompt requires testing the endpoint boundary. We'll build an isolated app with the router.

import inquiriesRouter from '../server/routes/adminInquiries.ts';

// ──────────────────────────────────────────────────────────────────────────────
// Server Setup (Isolated Mock Runtime)
// ──────────────────────────────────────────────────────────────────────────────

function makeTestApp() {
  const app = express();
  app.use(express.json());
  
  // Fake requireAdmin to bypass auth on admin endpoints if needed,
  // but we are only testing the public endpoint which is mounted at /public and /
  app.use('/api/inquiries', inquiriesRouter);

  const server = app.listen(0);
  const address = server.address() as { port: number };
  
  return { app, server, port: address.port };
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function postInquiry(port: number, body: Record<string, unknown>): Promise<{ statusCode: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/inquiries/public',
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

describe('PH-005 — Email Validation', () => {
  let server: http.Server;
  let port: number;

  before(() => {
    // Force mongoose to appear disconnected so handlePublicInquiry uses the fallback path (no DB write)
    Object.defineProperty(mongoose.connection, 'readyState', { get: () => 0 });
    
    const ctx = makeTestApp();
    server = ctx.server;
    port = ctx.port;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  const basePayload = {
    name: 'Test User',
    phone: '9876543210',
    message: 'This is a test message for validation.',
  };

  it('A. Normal valid email succeeds', async () => {
    const { statusCode, body } = await postInquiry(port, { ...basePayload, email: 'test@example.com' });
    assert.equal(statusCode, 201);
    assert.equal(body.success, true);
  });

  it('B. Several realistic legitimate email formats succeed', async () => {
    const validEmails = [
      'user.name+tag@example.co.uk',
      'firstname-lastname@example.org',
      '12345@example.net',
    ];
    for (const email of validEmails) {
      const { statusCode } = await postInquiry(port, { ...basePayload, email });
      assert.equal(statusCode, 201, `Failed on valid email: ${email}`);
    }
  });

  it('C. Missing email is rejected', async () => {
    const { statusCode, body } = await postInquiry(port, { name: 'Test', message: 'Hello World' });
    assert.equal(statusCode, 400);
    assert.equal(body.success, false);
  });

  it('D. Empty/whitespace email is rejected', async () => {
    const { statusCode, body } = await postInquiry(port, { ...basePayload, email: '   ' });
    assert.equal(statusCode, 400);
    assert.equal(body.success, false);
  });

  it('E. `abc` is rejected', async () => {
    const { statusCode } = await postInquiry(port, { ...basePayload, email: 'abc' });
    assert.equal(statusCode, 400);
  });

  it('F. `abc@` is rejected', async () => {
    const { statusCode } = await postInquiry(port, { ...basePayload, email: 'abc@' });
    assert.equal(statusCode, 400);
  });

  it('G. `@example.com` is rejected', async () => {
    const { statusCode } = await postInquiry(port, { ...basePayload, email: '@example.com' });
    assert.equal(statusCode, 400);
  });

  it('H. `abc@example` is rejected (no dot in domain)', async () => {
    const { statusCode } = await postInquiry(port, { ...basePayload, email: 'abc@example' });
    assert.equal(statusCode, 400);
  });

  it('I. `abc@@example.com` is rejected (multiple @)', async () => {
    const { statusCode } = await postInquiry(port, { ...basePayload, email: 'abc@@example.com' });
    assert.equal(statusCode, 400);
  });

  it('J. Emails containing whitespace are rejected', async () => {
    const { statusCode } = await postInquiry(port, { ...basePayload, email: 'test user@example.com' });
    assert.equal(statusCode, 400);
  });

  it('K. Extremely oversized input is rejected safely', async () => {
    const longEmail = 'a'.repeat(250) + '@example.com'; // Total > 254
    const { statusCode } = await postInquiry(port, { ...basePayload, email: longEmail });
    assert.equal(statusCode, 400);
  });

  it('M. Existing unrelated validation behavior remains unchanged (missing name)', async () => {
    const { statusCode } = await postInquiry(port, { email: 'test@example.com', message: 'Hello' });
    assert.equal(statusCode, 400);
  });
});
