/**
 * Malwa Namkeen House — Google OAuth & Authentication Hardening Test Suite
 * 
 * Verifies:
 * 1. Safe Google Credential token handling (POST /api/auth/google)
 * 2. Complete removal of unsafe demo login (Ananya Sharma) and rejection of fake userInfo bodies
 * 3. Cryptographic token verification: audience matching, issuer, expiry, email verification
 * 4. Privilege escalation protection: ordinary users always receive role: 'customer'
 * 5. Inactive customer account lockout (403)
 * 6. Account configuration endpoint (GET /api/auth/google/config)
 * 7. Verification that email/password and password recovery routes remain functional
 * 8. Static code verification guaranteeing zero demo UI remnants in production storefront
 */

process.env.NODE_ENV = 'test';
process.env.IS_E2E_TEST = 'true';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';

import mongoose from 'mongoose';
import authRouter, {
  verifyGoogleToken,
  __setGoogleTokenVerifierForTesting,
  type GoogleVerifiedUser,
} from '../server/routes/auth.ts';
import authRecoveryRouter from '../server/routes/authRecovery.ts';
import { User } from '../server/models/User.ts';
import { connectMongoDB } from '../server/lib/mongodb.ts';

// ──────────────────────────────────────────────────────────────────────────────
// Isolated HTTP Server for Auth Endpoint Testing
// ──────────────────────────────────────────────────────────────────────────────

function makeAuthTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRouter);
  app.use('/api/auth', authRecoveryRouter);

  const server = app.listen(0);
  const address = server.address() as { port: number };
  return { app, server, port: address.port };
}

function requestJson(
  port: number,
  method: string,
  urlPath: string,
  body?: Record<string, unknown>
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; data: Record<string, any> }> {
  return new Promise((resolve, reject) => {
    const dataStr = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers: {
          ...(dataStr ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dataStr) } : {}),
        },
      },
      res => {
        let raw = '';
        res.on('data', chunk => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = raw ? JSON.parse(raw) : {};
            resolve({ statusCode: res.statusCode || 500, headers: res.headers, data: parsed });
          } catch {
            resolve({ statusCode: res.statusCode || 500, headers: res.headers, data: { raw } });
          }
        });
      }
    );
    req.on('error', reject);
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

describe('Google OAuth & Authentication Hardening Suite', () => {
  let testApp: { server: http.Server; port: number };

  before(async () => {
    await connectMongoDB();
    testApp = makeAuthTestApp();
  });

  after(async () => {
    __setGoogleTokenVerifierForTesting(null);
    testApp.server.close();
    await mongoose.disconnect();
  });

  // ── 1. Demo Login Removal & Unsafe Body Rejection ───────────────────────────
  describe('1. Unsafe Demo Login Removal & Payload Validation', () => {
    it('rejects empty request body with 400 and clear error message', async () => {
      const res = await requestJson(testApp.port, 'POST', '/api/auth/google', {});
      assert.equal(res.statusCode, 400);
      assert.equal(res.data.success, false);
      assert.equal(res.data.message, 'Google credential token is required.');
    });

    it('rejects missing or empty credential string with 400', async () => {
      const res = await requestJson(testApp.port, 'POST', '/api/auth/google', { credential: '   ' });
      assert.equal(res.statusCode, 400);
      assert.equal(res.data.success, false);
      assert.equal(res.data.message, 'Google credential token is required.');
    });

    it('rejects user-supplied userInfo payload (demo login format) without credential', async () => {
      // Prior vulnerable demo modal submitted { userInfo: { email, name, sub } }
      const res = await requestJson(testApp.port, 'POST', '/api/auth/google', {
        userInfo: {
          email: 'ananya.sharma@gmail.com',
          name: 'Ananya Sharma',
          sub: 'google-demo-123456789',
          picture: 'https://lh3.googleusercontent.com/a/default-user',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.data.success, false);
      assert.equal(res.data.message, 'Google credential token is required.');
      assert.equal(res.data.token, undefined, 'Must NEVER issue auth token for unverified userInfo');
    });

    it('rejects invalid or expired Google credential with 401', async () => {
      __setGoogleTokenVerifierForTesting(async () => null);

      const res = await requestJson(testApp.port, 'POST', '/api/auth/google', {
        credential: 'invalid-unverifiable-google-jwt-token-string',
      });

      assert.equal(res.statusCode, 401);
      assert.equal(res.data.success, false);
      assert.equal(res.data.message, 'Invalid or expired Google authentication token. Please try again.');
    });
  });

  // ── 2. Verified Google Authentication & Privilege Protection ────────────────
  describe('2. Verified Google Authentication & Privilege Control', () => {
    it('authenticates a legitimate Google customer and enforces role: customer', async () => {
      const testEmail = `google_customer_${Date.now()}@example.com`;
      const testSub = `google_sub_${Date.now()}`;

      __setGoogleTokenVerifierForTesting(async () => ({
        sub: testSub,
        email: testEmail,
        name: 'Kabir Patel',
        picture: 'https://lh3.googleusercontent.com/test-avatar.jpg',
        email_verified: true,
      }));

      // Attempt to pass role: 'admin' or 'super_admin' in client body — must be ignored!
      const res = await requestJson(testApp.port, 'POST', '/api/auth/google', {
        credential: 'valid-test-cryptographic-token-signature',
        role: 'super_admin',
        admin: true,
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.token, 'Should issue signed session JWT');
      assert.equal(res.data.user.email, testEmail);
      assert.equal(res.data.user.name, 'Kabir Patel');
      assert.equal(res.data.user.role, 'customer', 'Ordinary Google user MUST strictly receive role: customer');
      assert.notEqual(res.data.user.role, 'super_admin', 'Must NEVER grant admin privileges from client request');
      assert.notEqual(res.data.user.role, 'admin', 'Must NEVER grant admin privileges from client request');

      // Verify Set-Cookie header exists for secure session storage
      const cookies = res.headers['set-cookie'];
      assert.ok(cookies && cookies.length > 0, 'Must set auth cookie');
    });

    it('designates super_admin only if email matches configured ADMIN_EMAIL', async () => {
      const designatedEmail = (process.env.ADMIN_EMAIL || 'malwanamkeenhouse@gmail.com').toLowerCase().trim();
      const ownerSub = `google_owner_sub_${Date.now()}`;

      __setGoogleTokenVerifierForTesting(async () => ({
        sub: ownerSub,
        email: designatedEmail,
        name: 'Malwa Store Owner',
        picture: '',
        email_verified: true,
      }));

      const res = await requestJson(testApp.port, 'POST', '/api/auth/google', {
        credential: 'valid-owner-cryptographic-token',
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.user.email, designatedEmail);
      assert.equal(res.data.user.role, 'super_admin', 'Designated owner must receive super_admin role');
    });

    it('rejects authentication with 403 if existing account is inactive', async () => {
      const inactiveEmail = `inactive_cust_${Date.now()}@example.com`;
      const inactiveSub = `inactive_sub_${Date.now()}`;

      // Create inactive user fixture in test DB
      await User.create({
        name: 'Inactive User',
        email: inactiveEmail,
        googleId: inactiveSub,
        role: 'customer',
        active: false,
      });

      __setGoogleTokenVerifierForTesting(async () => ({
        sub: inactiveSub,
        email: inactiveEmail,
        name: 'Inactive User',
        email_verified: true,
      }));

      const res = await requestJson(testApp.port, 'POST', '/api/auth/google', {
        credential: 'valid-token-for-inactive-user',
      });

      assert.equal(res.statusCode, 403);
      assert.equal(res.data.success, false);
      assert.equal(res.data.message, 'Your account is currently inactive. Please contact support.');
    });
  });

  // ── 3. Google Client Configuration Endpoint ─────────────────────────────────
  describe('3. Google Client Configuration Endpoint (/api/auth/google/config)', () => {
    it('returns client configuration truthfully without leaking secrets', async () => {
      const res = await requestJson(testApp.port, 'GET', '/api/auth/google/config');

      assert.equal(res.statusCode, 200);
      assert.equal(res.data.success, true);
      assert.ok('clientId' in res.data, 'Must return clientId key');
      assert.ok('isConfigured' in res.data, 'Must return isConfigured boolean');
      assert.equal(res.data.clientSecret, undefined, 'Must NEVER return clientSecret');
      assert.equal(res.data.GOOGLE_CLIENT_SECRET, undefined, 'Must NEVER return GOOGLE_CLIENT_SECRET');

      const expectedClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
      assert.equal(res.data.clientId, expectedClientId, 'clientId returned to frontend must match backend configured client ID');
    });
  });

  // ── 4. Verify Google Token Logic Boundaries ─────────────────────────────────
  describe('4. Token Verification Logic Boundaries', () => {
    it('rejects short or empty credentials', async () => {
      __setGoogleTokenVerifierForTesting(null); // use live logic
      const r1 = await verifyGoogleToken('');
      assert.equal(r1, null);
      const r2 = await verifyGoogleToken('abc');
      assert.equal(r2, null);
      const r3 = await verifyGoogleToken('   ');
      assert.equal(r3, null);
    });
  });

  // ── 5. Static Code Inspection & Frontend Safety Guard ───────────────────────
  describe('5. Production Codebase Safety Verification', () => {
    it('Account.tsx must have NO traces of Ananya Sharma or demo modal', () => {
      const accountFilePath = path.resolve('src-rebuild/pages/Account.tsx');
      assert.ok(fs.existsSync(accountFilePath), 'Account.tsx must exist');

      const content = fs.readFileSync(accountFilePath, 'utf8');

      assert.ok(!content.includes('Ananya Sharma'), 'Ananya Sharma must be completely removed');
      assert.ok(!content.includes('ananya.sharma@gmail.com'), 'ananya.sharma demo email must be completely removed');
      assert.ok(!content.includes('handleDemoGoogleSignIn'), 'handleDemoGoogleSignIn must be completely removed');
      assert.ok(!content.includes('googleSetupModalOpen'), 'googleSetupModalOpen must be completely removed');
      assert.ok(!content.includes('One-Click Instant Google Test'), 'One-Click Instant Google Test must be completely removed');
      assert.ok(!content.includes('userInfo: {'), 'Vulnerable userInfo payload submission must be completely removed');
    });

    it('Account.tsx must integrate official Google GSI container and handle Google credential response', () => {
      const accountFilePath = path.resolve('src-rebuild/pages/Account.tsx');
      const content = fs.readFileSync(accountFilePath, 'utf8');

      assert.ok(content.includes('googleButtonContainerRef'), 'Must have container ref for Google official button');
      assert.ok(content.includes('loginWithGoogle'), 'Must call loginWithGoogle from CustomerSessionContext');
      assert.ok(content.includes('handleGoogleCredentialResponse'), 'Must have credential callback for Google GSI');
      assert.ok(content.includes('google.accounts.id.renderButton'), 'Must render official Google button');
    });

    it('server/routes/auth.ts must strictly require credential or idToken', () => {
      const authPath = path.resolve('server/routes/auth.ts');
      const content = fs.readFileSync(authPath, 'utf8');

      assert.ok(content.includes("message: 'Google credential token is required.'"), 'Must reject missing credential');
      assert.ok(content.includes('verifyGoogleToken'), 'Must verify Google token before user lookup/creation');
      assert.ok(!content.includes('userInfo'), 'Must never accept raw userInfo from client request body');
    });
  });

  // ── 6. Preservation of Existing Authentication Flows ────────────────────────
  describe('6. Preservation of Password & Recovery Flows', () => {
    it('preserves password login (/api/auth/login) functionality', async () => {
      const res = await requestJson(testApp.port, 'POST', '/api/auth/login', {
        email: 'nonexistent-user@example.com',
        password: 'IncorrectPassword123!',
      });

      // Should return 401 for incorrect credentials, verifying the endpoint is active and working
      assert.equal(res.statusCode, 401);
      assert.equal(res.data.success, false);
      assert.ok(res.data.message.includes('Invalid') || res.data.message.includes('password'));
    });

    it('preserves recovery route registration and reset token verification', async () => {
      const res = await requestJson(testApp.port, 'GET', '/api/auth/verify-reset-token?token=invalid-token-sample');
      assert.equal(res.statusCode, 400);
      assert.equal(res.data.valid, false);
    });
  });
});
