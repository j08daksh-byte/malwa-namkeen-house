/**
 * Malwa Namkeen House — Administrator Authorization & Least-Privilege Role Matrix Test Suite
 *
 * Validates Gate 2 requirements:
 * 1. Token extraction and Bearer header priority (cookie-shadowing bug prevention).
 * 2. Role-based authorization matrix: super_admin vs admin vs customer.
 * 3. Rejection of unauthenticated, missing, expired, and tampered credentials (401).
 * 4. Least-privilege boundary enforcement: regular admin cannot mutate super-admin settings (403).
 * 5. Ordinary customers cannot access admin management or upload endpoints (403).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import {
  extractToken,
  generateToken,
  requireAdmin,
  requireSuperAdmin,
  requireAuth,
  AUTH_COOKIE_NAME,
  type AuthPayload,
  type AuthenticatedRequest,
} from '../server/lib/auth.ts';

// Helper to create mock Express Request & Response objects
function createMockHttp({
  headers = {},
  cookies = {},
  body = {},
  user,
}: {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: any;
  user?: AuthPayload;
} = {}) {
  const req: any = {
    headers,
    cookies,
    body,
    user,
  };

  let statusCode = 200;
  let responseData: any = null;

  const res: any = {
    locals: {},
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      responseData = data;
      return this;
    },
    send(data: any) {
      responseData = data;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get data() {
      return responseData;
    },
  };

  return { req, res };
}

describe('Gate 2: Administrator Permissions & Least-Privilege Role Suite', () => {
  const adminPayload: AuthPayload = {
    userId: '65f01234567890abcdef0001',
    email: 'admin@malwanamkeen.com',
    role: 'admin',
  };

  const superAdminPayload: AuthPayload = {
    userId: '65f01234567890abcdef0002',
    email: 'owner@malwanamkeen.com',
    role: 'super_admin',
  };

  const customerPayload: AuthPayload = {
    userId: '65f01234567890abcdef0003',
    email: 'customer@gmail.com',
    role: 'customer',
  };

  // ── 1. Token Extraction & Cookie-Shadowing Prevention ───────────────────────
  describe('1. Token Extraction & Cookie-Shadowing Prevention', () => {
    it('prioritizes explicit Bearer header when both Bearer and customer cookie exist', () => {
      const adminToken = generateToken(adminPayload);
      const customerToken = generateToken(customerPayload);

      const req: any = {
        headers: { authorization: `Bearer ${adminToken}` },
        cookies: { [AUTH_COOKIE_NAME]: customerToken },
      };

      const extracted = extractToken(req);
      assert.equal(extracted, adminToken, 'Bearer header must override ambient customer cookie');
    });

    it('falls back to cookie when no Authorization header is present', () => {
      const customerToken = generateToken(customerPayload);
      const req: any = {
        headers: {},
        cookies: { [AUTH_COOKIE_NAME]: customerToken },
      };

      const extracted = extractToken(req);
      assert.equal(extracted, customerToken);
    });

    it('returns null when neither header nor cookie is present', () => {
      const req: any = { headers: {}, cookies: {} };
      assert.equal(extractToken(req), null);
    });
  });

  // ── 2. Missing, Tampered, and Expired Credentials Rejection ─────────────────
  describe('2. Credential Verification & 401 Rejections', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const { req, res } = createMockHttp();
      let nextCalled = false;

      await requireAdmin(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 401);
      assert.equal(res.data.success, false);
      assert.ok(res.data.message.includes('Authentication required'));
    });

    it('rejects forged/tampered tokens with 401', async () => {
      const forgedToken = jwt.sign(adminPayload, 'wrong_untrusted_secret_key_1234567890');
      const { req, res } = createMockHttp({
        headers: { authorization: `Bearer ${forgedToken}` },
      });
      let nextCalled = false;

      await requireAdmin(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 401);
      assert.equal(res.data.success, false);
      assert.ok(res.data.message.includes('Invalid or expired session'));
    });

    it('rejects expired tokens with 401', async () => {
      const secret = process.env.JWT_SECRET || 'malwa-namkeen-dev-only-secret-key-2026';
      const expiredToken = jwt.sign(adminPayload, secret, { expiresIn: -10 }); // Expired in past
      const { req, res } = createMockHttp({
        headers: { authorization: `Bearer ${expiredToken}` },
      });
      let nextCalled = false;

      await requireAdmin(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 401);
    });
  });

  // ── 3. Role Authorization Matrix (Admin vs Customer) ────────────────────────
  describe('3. Role Authorization Matrix (requireAdmin)', () => {
    it('grants access to authorized admin (role: admin)', async () => {
      const token = generateToken(adminPayload);
      const { req, res } = createMockHttp({
        headers: { authorization: `Bearer ${token}` },
      });
      let nextCalled = false;

      await requireAdmin(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, true, 'Admin must be authorized');
      assert.equal(req.user?.role, 'admin');
    });

    it('grants access to super administrator (role: super_admin)', async () => {
      const token = generateToken(superAdminPayload);
      const { req, res } = createMockHttp({
        headers: { authorization: `Bearer ${token}` },
      });
      let nextCalled = false;

      await requireAdmin(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, true, 'Super Admin must be authorized');
      assert.equal(req.user?.role, 'super_admin');
    });

    it('strictly forbids customer role from accessing admin endpoints (403)', async () => {
      const token = generateToken(customerPayload);
      const { req, res } = createMockHttp({
        headers: { authorization: `Bearer ${token}` },
      });
      let nextCalled = false;

      await requireAdmin(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, false, 'Customer must not pass requireAdmin');
      assert.equal(res.statusCode, 403);
      assert.equal(res.data.success, false);
      assert.ok(res.data.message.includes('Access denied'));
    });
  });

  // ── 4. Least-Privilege Protection (Super Admin vs Admin) ────────────────────
  describe('4. Least-Privilege Boundary (requireSuperAdmin)', () => {
    it('grants access to super_admin for restricted settings endpoints', async () => {
      const token = generateToken(superAdminPayload);
      const { req, res } = createMockHttp({
        headers: { authorization: `Bearer ${token}` },
      });
      let nextCalled = false;

      await requireSuperAdmin(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, true, 'Super Admin must pass requireSuperAdmin');
      assert.equal(req.user?.role, 'super_admin');
    });

    it('denies standard admin from modifying super-admin restricted settings (403)', async () => {
      const token = generateToken(adminPayload);
      const { req, res } = createMockHttp({
        headers: { authorization: `Bearer ${token}` },
      });
      let nextCalled = false;

      await requireSuperAdmin(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, false, 'Standard admin must NOT pass requireSuperAdmin');
      assert.equal(res.statusCode, 403);
      assert.equal(res.data.success, false);
      assert.ok(res.data.message.includes('Super Administrator privilege required'));
    });

    it('denies customer from modifying super-admin restricted settings (403)', async () => {
      const token = generateToken(customerPayload);
      const { req, res } = createMockHttp({
        headers: { authorization: `Bearer ${token}` },
      });
      let nextCalled = false;

      await requireSuperAdmin(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 403);
    });
  });

  // ── 5. Customer Profile Endpoints (requireAuth) ──────────────────────────────
  describe('5. General Authenticated Access (requireAuth)', () => {
    it('allows valid customer to access personal account routes', async () => {
      const token = generateToken(customerPayload);
      const { req, res } = createMockHttp({
        headers: { authorization: `Bearer ${token}` },
      });
      let nextCalled = false;

      await requireAuth(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, true);
      assert.equal(req.user?.role, 'customer');
    });

    it('allows admin to access account routes', async () => {
      const token = generateToken(adminPayload);
      const { req, res } = createMockHttp({
        headers: { authorization: `Bearer ${token}` },
      });
      let nextCalled = false;

      await requireAuth(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, true);
      assert.equal(req.user?.role, 'admin');
    });
  });

  // ── 6. Customer Role Promotion Authorization Guard ─────────────────────────
  describe('6. Customer Role Promotion & Privilege Delegation Guard', () => {
    it('strictly forbids standard admin from promoting customer to admin (403)', async () => {
      const token = generateToken(adminPayload);
      const { req, res } = createMockHttp({
        headers: { authorization: `Bearer ${token}` },
        body: { role: 'admin' },
      });
      let nextCalled = false;

      await requireSuperAdmin(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, false, 'Standard admin must NOT be able to invoke role promotion');
      assert.equal(res.statusCode, 403);
      assert.equal(res.data.success, false);
      assert.ok(res.data.message.includes('Super Administrator privilege required'));
    });

    it('strictly forbids customer from self-promoting or invoking role endpoint (403)', async () => {
      const token = generateToken(customerPayload);
      const { req, res } = createMockHttp({
        headers: { authorization: `Bearer ${token}` },
        body: { role: 'admin' },
      });
      let nextCalled = false;

      await requireSuperAdmin(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, false, 'Ordinary customer must NOT pass super admin check');
      assert.equal(res.statusCode, 403);
      assert.equal(res.data.success, false);
    });

    it('authorizes super_admin to perform customer role promotion', async () => {
      const token = generateToken(superAdminPayload);
      const { req, res } = createMockHttp({
        headers: { authorization: `Bearer ${token}` },
        body: { role: 'admin' },
      });
      let nextCalled = false;

      await requireSuperAdmin(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, true, 'Super Admin must pass authorization check for promotion');
      assert.equal(req.user?.role, 'super_admin');
    });

    it('rejects unauthenticated role promotion attempt with 401', async () => {
      const { req, res } = createMockHttp({
        body: { role: 'admin' },
      });
      let nextCalled = false;

      await requireSuperAdmin(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 401);
      assert.equal(res.data.success, false);
    });
  });
});
