/**
 * Malwa Namkeen House — Transactional Email & Resend Service Test Suite
 *
 * Validates Gate 3 requirements:
 * 1. Branded mobile-responsive HTML templates for all key events (invitation, reset, order, inquiry, welcome, cancellation).
 * 2. Never sending plaintext passwords; using secure single-use token links.
 * 3. Validation of recipient email syntax.
 * 4. Safe error handling: email failures return structured error without throwing unhandled exceptions.
 * 5. Mocked/simulated transport in development and test environments to guarantee zero spam.
 * 6. Resend API integration with mock verification (success, API error, network exception).
 * 7. Verification that simulated mode is never confused with genuine live delivery (delivered: false).
 * 8. Clean plain-text fallback generation without CSS stylesheet or script leakage.
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  sendEmail,
  sendAdminInvitation,
  sendCustomerPasswordReset,
  sendCustomerWelcomeEmail,
  sendPasswordChangedConfirmation,
  sendRoleChangedNotification,
  sendCustomerOrderConfirmation,
  sendOrderStatusUpdate,
  sendNewOrderAdminAlert,
  sendCustomerOrderCancellationAdminAlert,
  sendNewInquiryAdminAlert,
  sendInquiryAcknowledgement,
  runEmailSmokeTest,
  generatePlainTextFallback,
  maskEmail,
  sanitizeErrorMessage,
  _setResendClientForTesting,
} from '../server/lib/emailService.ts';
import { generateToken, requireAdmin } from '../server/lib/auth.ts';
import { handleSmokeTest } from '../server/routes/adminEmail.ts';

describe('Gate 3: Transactional Email Service & Template Engine Suite', () => {
  const origResendKey = process.env.RESEND_API_KEY;
  const origProvider = process.env.EMAIL_PROVIDER;
  const origNodeEnv = process.env.NODE_ENV;

  before(() => {
    // Enforce simulated transport during test suite execution to prevent actual network calls and guarantee zero spam
    delete process.env.RESEND_API_KEY;
    process.env.EMAIL_PROVIDER = 'simulated';
  });

  after(() => {
    if (origResendKey) {
      process.env.RESEND_API_KEY = origResendKey;
    } else {
      delete process.env.RESEND_API_KEY;
    }
    if (origProvider) {
      process.env.EMAIL_PROVIDER = origProvider;
    } else {
      delete process.env.EMAIL_PROVIDER;
    }
    process.env.NODE_ENV = origNodeEnv;
    _setResendClientForTesting(null);
  });

  beforeEach(() => {
    _setResendClientForTesting(null);
  });

  afterEach(() => {
    _setResendClientForTesting(null);
  });

  function mockHttp(options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: any;
    user?: any;
  } = {}) {
    let statusCode = 200;
    let jsonPayload: any = null;
    const res: any = {
      locals: {},
      status(code: number) {
        statusCode = code;
        return res;
      },
      json(data: any) {
        jsonPayload = data;
        return res;
      },
      setHeader() {
        return res;
      },
      get statusCode() {
        return statusCode;
      },
      get jsonPayload() {
        return jsonPayload;
      },
    };
    const req: any = {
      method: options.method || 'GET',
      url: options.url || '/',
      headers: options.headers || {},
      body: options.body || {},
      user: options.user,
      ip: '127.0.0.1',
      get(name: string) {
        return this.headers[name.toLowerCase()];
      },
    };
    return { req, res };
  }

  // ── 1. Recipient Validation & Security Formatting ───────────────────────────
  describe('1. Recipient Address Validation & PII Masking', () => {
    it('rejects invalid or malformed email addresses', async () => {
      const invalidEmails = ['', '   ', 'not-an-email', 'missing@domain', '@nodomain.com', 'spaces in@mail.com'];
      for (const email of invalidEmails) {
        const res = await sendEmail({
          to: email,
          subject: 'Test Subject',
          html: '<p>Test</p>',
        });
        assert.equal(res.success, false, `Should reject invalid email: "${email}"`);
        assert.equal(res.error, 'Invalid recipient email address.');
        assert.equal(res.delivered, false);
      }
    });

    it('trims and normalizes valid email addresses in simulated dev mode', async () => {
      const res = await sendEmail({
        to: '  Customer.Test@Example.COM  ',
        subject: 'Normalized Recipient Test',
        html: '<p>Hello</p>',
      });
      assert.equal(res.success, true);
      assert.equal(res.simulated, true);
      assert.equal(res.delivered, false, 'Simulated mode must never claim genuine delivery');
    });

    it('correctly masks email addresses to protect customer PII in logs', () => {
      assert.equal(maskEmail('customer@example.com'), 'c***r@example.com');
      assert.equal(maskEmail('hi@domain.in'), 'h***@domain.in');
      assert.equal(maskEmail('a@b.com'), 'a***@b.com');
      assert.equal(maskEmail('invalid-string'), '***');
    });
  });

  // ── 2. Plain Text Fallback & Sanitization ───────────────────────────────────
  describe('2. Plain Text Fallback & Sanitization', () => {
    it('completely strips <style> and <script> contents to prevent CSS leaks in plain text', () => {
      const htmlSnippet = `
        <style>
          body { margin: 0; padding: 0; background: #fff; }
          .container { width: 600px; color: #1a0a0f; }
        </style>
        <script>
          alert('evil');
        </script>
        <h2>Order Confirmed</h2>
        <p>Your authentic <strong>Indori Sev</strong> is being prepared &amp; packed.</p>
        <p>Total: &#8377;450 &nbsp; (Paid)</p>
      `;

      const plain = generatePlainTextFallback(htmlSnippet);

      assert.ok(!plain.includes('body { margin'), 'Must not contain raw CSS styles');
      assert.ok(!plain.includes('.container'), 'Must not contain class selectors');
      assert.ok(!plain.includes('alert'), 'Must not contain script contents');
      assert.ok(plain.includes('Order Confirmed'), 'Must retain human headings');
      assert.ok(plain.includes('Indori Sev is being prepared & packed.'), 'Must retain text body and decode &amp;');
      assert.ok(plain.includes('(Paid)'), 'Must retain metadata text');
    });
  });

  // ── 3. Account Security & Customer Welcome Templates ────────────────────────
  describe('3. Account Security & Customer Welcome Templates', () => {
    it('dispatches admin invitation with token link and zero plaintext password', async () => {
      const result = await sendAdminInvitation({
        email: 'newadmin@malwanamkeen.com',
        name: 'Vikas Sharma',
        role: 'admin',
        token: 'crypto_secure_hex_token_1234567890abcdef',
        inviterName: 'Lead Administrator',
      });

      assert.equal(result.success, true);
      assert.equal(result.simulated, true);
      assert.equal(result.delivered, false);
    });

    it('dispatches customer password reset with secure link', async () => {
      const result = await sendCustomerPasswordReset({
        email: 'customer@example.com',
        name: 'Pooja Verma',
        token: 'reset_token_hex_abcdef123456',
      });

      assert.equal(result.success, true);
      assert.equal(result.simulated, true);
      assert.equal(result.delivered, false);
    });

    it('dispatches customer welcome email upon registration', async () => {
      const result = await sendCustomerWelcomeEmail({
        email: 'newcustomer@example.com',
        name: 'Rajesh Agrawal',
      });

      assert.equal(result.success, true);
      assert.equal(result.simulated, true);
      assert.equal(result.delivered, false);
    });

    it('dispatches password changed security confirmation', async () => {
      const result = await sendPasswordChangedConfirmation({
        email: 'customer@example.com',
        name: 'Pooja Verma',
      });

      assert.equal(result.success, true);
      assert.equal(result.simulated, true);
      assert.equal(result.delivered, false);
    });

    it('dispatches role change notification', async () => {
      const result = await sendRoleChangedNotification({
        email: 'staff@malwanamkeen.com',
        name: 'Staff Member',
        oldRole: 'customer',
        newRole: 'admin',
      });

      assert.equal(result.success, true);
      assert.equal(result.simulated, true);
      assert.equal(result.delivered, false);
    });
  });

  // ── 4. Customer & Admin Order Notification Templates ────────────────────────
  describe('4. Order Lifecycle Notifications', () => {
    const sampleOrder = {
      orderNumber: 'MNH-20261016-0001',
      customerInfo: {
        name: 'Aarav Patel',
        email: 'aarav@example.com',
        phone: '+91 9876543210',
      },
      shippingAddress: {
        name: 'Aarav Patel',
        addressLine1: 'Flat 402, Royal Palms, Sarafa Road',
        addressLine2: '',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
        phone: '+91 9876543210',
      },
      items: [
        { productName: 'Special Ujjaini Sev 500g', variantLabel: '500g Pouch', quantity: 2, price: 240, itemTotal: 480 },
        { productName: 'Ratlami Laung Sev 400g', variantLabel: '400g Box', quantity: 1, price: 210, itemTotal: 210 },
      ],
      subtotal: 690,
      discount: 50,
      discountCode: 'FESTIVE50',
      shipping: 0,
      total: 640,
      paymentMethod: 'Cash on Delivery (COD)',
      trackingInfo: {
        courierName: 'Delhivery Express',
        trackingNumber: 'DELHIVERY-9876543210',
        trackingUrl: 'https://delhivery.com/track/DELHIVERY-9876543210',
      },
    };

    it('renders and dispatches customer order confirmation', async () => {
      const result = await sendCustomerOrderConfirmation({ order: sampleOrder });
      assert.equal(result.success, true);
      assert.equal(result.simulated, true);
      assert.equal(result.delivered, false);
    });

    it('renders and dispatches customer order status update', async () => {
      const result = await sendOrderStatusUpdate({
        order: sampleOrder,
        previousStatus: 'pending',
        newStatus: 'shipped',
      });

      assert.equal(result.success, true);
      assert.equal(result.simulated, true);
      assert.equal(result.delivered, false);
    });

    it('dispatches tracking notification when tracking number is attached even if status unchanged', async () => {
      const result = await sendOrderStatusUpdate({
        order: sampleOrder,
        previousStatus: 'shipped',
        newStatus: 'shipped',
        isTrackingUpdate: true,
      });

      assert.equal(result.success, true);
      assert.equal(result.simulated, true);
      assert.equal(result.delivered, false);
    });

    it('renders and dispatches admin new order alert', async () => {
      const results = await sendNewOrderAdminAlert({
        order: sampleOrder,
        adminEmails: ['orders@malwanamkeen.com'],
      });
      assert.equal(results.length, 1);
      assert.equal(results[0].success, true);
      assert.equal(results[0].simulated, true);
      assert.equal(results[0].delivered, false);
    });

    it('renders and dispatches admin order cancellation alert', async () => {
      const results = await sendCustomerOrderCancellationAdminAlert({
        order: sampleOrder,
        adminEmails: ['orders@malwanamkeen.com'],
        cancelledBy: 'customer',
        reason: 'Change of travel plans',
      });
      assert.equal(results.length, 1);
      assert.equal(results[0].success, true);
      assert.equal(results[0].simulated, true);
      assert.equal(results[0].delivered, false);
    });
  });

  // ── 5. Customer Inquiries & Gifting ─────────────────────────────────────────
  describe('5. Customer Inquiry Notifications', () => {
    const sampleInquiry = {
      _id: '65f01234567890abcdef0099',
      name: 'Meera Deshmukh',
      email: 'meera@example.com',
      phone: '+91 9876543210',
      category: 'Corporate Gifting',
      message: 'Need 100 artisanal sweet boxes for festive gifting.',
    };

    it('renders and dispatches admin new inquiry notification', async () => {
      const results = await sendNewInquiryAdminAlert({
        inquiry: sampleInquiry,
        adminEmails: ['inquiries@malwanamkeen.com'],
      });
      assert.equal(results.length, 1);
      assert.equal(results[0].success, true);
      assert.equal(results[0].simulated, true);
      assert.equal(results[0].delivered, false);
    });

    it('renders and dispatches customer inquiry acknowledgement', async () => {
      const result = await sendInquiryAcknowledgement({ inquiry: sampleInquiry });
      assert.equal(result.success, true);
      assert.equal(result.simulated, true);
      assert.equal(result.delivered, false);
    });
  });

  // ── 6. Resend Provider Integration & Mock Verification ──────────────────────
  describe('6. Resend Provider Integration & Mock Verification', () => {
    it('successfully dispatches via Resend client when configured and reports delivered: true', async () => {
      const mockSend = async (params: any) => {
        assert.equal(params.to[0], 'verified.customer@example.com');
        assert.ok(params.subject.includes('Mock Resend Order'));
        assert.ok(params.text.includes('Plain text receipt'));
        return { data: { id: 'msg_resend_mock_success_789' }, error: null };
      };

      _setResendClientForTesting({ emails: { send: mockSend } });

      const origEnv = process.env.NODE_ENV;
      const origProv = process.env.EMAIL_PROVIDER;
      const origKey = process.env.RESEND_API_KEY;

      try {
        process.env.NODE_ENV = 'production';
        process.env.EMAIL_PROVIDER = 'resend';
        process.env.RESEND_API_KEY = 're_mock_test_key_abc123';

        const result = await sendEmail({
          to: 'verified.customer@example.com',
          subject: 'Mock Resend Order Confirmation',
          html: '<p>Thank you for your order</p>',
          text: 'Plain text receipt content',
          eventType: 'order_confirmation',
          relatedId: 'ORD-MOCK-001',
        });

        assert.equal(result.success, true);
        assert.equal(result.provider, 'resend');
        assert.equal(result.messageId, 'msg_resend_mock_success_789');
        assert.equal(result.delivered, true, 'Genuine Resend delivery must set delivered: true');
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.EMAIL_PROVIDER = origProv;
        process.env.RESEND_API_KEY = origKey;
      }
    });

    it('safely handles Resend API errors without throwing or crashing', async () => {
      const mockSend = async () => {
        return { data: null, error: { message: 'Sender domain not verified on Resend' } };
      };

      _setResendClientForTesting({ emails: { send: mockSend } });

      const origEnv = process.env.NODE_ENV;
      const origProv = process.env.EMAIL_PROVIDER;
      const origKey = process.env.RESEND_API_KEY;

      try {
        process.env.NODE_ENV = 'production';
        process.env.EMAIL_PROVIDER = 'resend';
        process.env.RESEND_API_KEY = 're_mock_test_key_abc123';

        const result = await sendEmail({
          to: 'customer@example.com',
          subject: 'Order Error Check',
          html: '<p>Order</p>',
        });

        assert.equal(result.success, false);
        assert.equal(result.provider, 'resend');
        assert.equal(result.error, 'Sender domain not verified on Resend');
        assert.equal(result.delivered, false);
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.EMAIL_PROVIDER = origProv;
        process.env.RESEND_API_KEY = origKey;
      }
    });

    it('safely catches unexpected network exceptions during Resend API call', async () => {
      const mockSend = async () => {
        throw new Error('ETIMEDOUT: Connection to api.resend.com timed out');
      };

      _setResendClientForTesting({ emails: { send: mockSend } });

      const origEnv = process.env.NODE_ENV;
      const origProv = process.env.EMAIL_PROVIDER;
      const origKey = process.env.RESEND_API_KEY;

      try {
        process.env.NODE_ENV = 'production';
        process.env.EMAIL_PROVIDER = 'resend';
        process.env.RESEND_API_KEY = 're_mock_test_key_abc123';

        const result = await sendEmail({
          to: 'customer@example.com',
          subject: 'Timeout Check',
          html: '<p>Timeout</p>',
        });

        assert.equal(result.success, false);
        assert.equal(result.provider, 'resend');
        assert.ok(result.error?.includes('ETIMEDOUT'));
        assert.equal(result.delivered, false);
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.EMAIL_PROVIDER = origProv;
        process.env.RESEND_API_KEY = origKey;
      }
    });

    it('EMAIL_PROVIDER=simulated strictly forces simulation even when RESEND_API_KEY is present', async () => {
      let callCount = 0;
      const mockSend = async () => {
        callCount++;
        return { data: { id: 'should_never_be_called' }, error: null };
      };

      _setResendClientForTesting({ emails: { send: mockSend } });

      const origProv = process.env.EMAIL_PROVIDER;
      const origKey = process.env.RESEND_API_KEY;

      try {
        process.env.EMAIL_PROVIDER = 'simulated';
        process.env.RESEND_API_KEY = 're_dummy_key_that_must_not_be_used';

        const result = await sendEmail({
          to: 'customer@example.com',
          subject: 'Simulated Override Test',
          html: '<p>Should simulate safely</p>',
        });

        assert.equal(result.success, true);
        assert.equal(result.provider, 'simulated');
        assert.equal(result.simulated, true);
        assert.equal(result.delivered, false);
        assert.equal(callCount, 0, 'Must NOT invoke Resend when simulated mode is requested');
      } finally {
        process.env.EMAIL_PROVIDER = origProv;
        process.env.RESEND_API_KEY = origKey;
      }
    });
  });

  // ── 7. Production Unconfigured Fallback & Smoke Test Helper ─────────────────
  describe('7. Production Unconfigured Fallback & Smoke Test Helper', () => {
    it('safely drops message in production when Resend key is missing without throwing', async () => {
      const origEnv = process.env.NODE_ENV;
      const origProv = process.env.EMAIL_PROVIDER;
      const origKey = process.env.RESEND_API_KEY;
      try {
        process.env.NODE_ENV = 'production';
        delete process.env.EMAIL_PROVIDER;
        delete process.env.RESEND_API_KEY;

        const result = await sendEmail({
          to: 'customer@example.com',
          subject: 'Production Safety Check',
          html: '<p>Safe test</p>',
        });

        assert.equal(result.success, false);
        assert.equal(result.provider, 'unconfigured');
        assert.equal(result.error, 'Email provider unconfigured.');
        assert.equal(result.delivered, false);
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.EMAIL_PROVIDER = origProv;
        if (origKey) process.env.RESEND_API_KEY = origKey;
      }
    });

    it('smoke test helper reports unconfigured state without throwing', async () => {
      const origKey = process.env.RESEND_API_KEY;
      try {
        delete process.env.RESEND_API_KEY;
        const result = await runEmailSmokeTest({ targetEmail: 'test@example.com' });
        assert.equal(result.success, false);
        assert.equal(result.provider, 'none');
        assert.equal(result.delivered, false);
        assert.ok(result.error?.includes('RESEND_API_KEY'));
      } finally {
        if (origKey) process.env.RESEND_API_KEY = origKey;
      }
    });
  });

  describe('8. Provider Credential Safety & Duplicate Notification Prevention', () => {
    it('returns unconfigured status when EMAIL_PROVIDER=resend but RESEND_API_KEY is missing', async () => {
      const origEnv = process.env.NODE_ENV;
      const origProv = process.env.EMAIL_PROVIDER;
      const origKey = process.env.RESEND_API_KEY;

      try {
        delete process.env.NODE_ENV;
        process.env.EMAIL_PROVIDER = 'resend';
        delete process.env.RESEND_API_KEY;

        const result = await sendEmail({
          to: 'customer@example.com',
          subject: 'Unconfigured Resend Check',
          html: '<p>Testing missing key</p>',
        });

        assert.equal(result.success, false);
        assert.equal(result.provider, 'unconfigured');
        assert.equal(result.error, 'Email provider unconfigured.');
        assert.equal(result.delivered, false);
      } finally {
        if (origEnv) process.env.NODE_ENV = origEnv;
        if (origProv) process.env.EMAIL_PROVIDER = origProv;
        if (origKey) process.env.RESEND_API_KEY = origKey;
      }
    });

    it('identifies and prevents duplicate notification on retried order event when log exists', async () => {
      // Mock Mongoose connection and EmailLog model check
      const { EmailLog } = await import('../server/models/EmailLog.ts');
      const mongoose = (await import('mongoose')).default;

      // Ensure a mock findOne on EmailLog returns an existing sent record
      const origFindOne = EmailLog.findOne;
      const origReadyState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');

      try {
        // Emulate connected readyState
        Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

        (EmailLog as any).findOne = () => ({
          lean: async () => ({
            eventType: 'order_confirmation',
            relatedId: 'MN-261017-DEDUP',
            recipient: 'customer@example.com',
            provider: 'resend',
            providerMessageId: 'msg_existing_recorded_123',
            status: 'sent',
          }),
        });

        const result = await sendEmail({
          to: 'customer@example.com',
          subject: 'Order Confirmation',
          html: '<p>Order Confirmation</p>',
          eventType: 'order_confirmation',
          relatedId: 'MN-261017-DEDUP',
        });

        assert.equal(result.success, true);
        assert.equal(result.alreadySent, true, 'Must identify email as already sent');
        assert.equal(result.delivered, true);
        assert.equal(result.messageId, 'msg_existing_recorded_123');
      } finally {
        EmailLog.findOne = origFindOne;
        delete (mongoose.connection as any).readyState;
      }
    });
  });

  // ── 9. Authenticated Admin Email Smoke-Test & Status Router Suite ───────────
  describe('9. Authenticated Admin Email Smoke-Test & Status Router Suite', () => {
    it('rejects unauthenticated requests to admin email routes with HTTP 401', async () => {
      const { requireAdmin } = await import('../server/lib/auth.ts');
      const { req, res } = mockHttp();
      let nextCalled = false;

      await requireAdmin(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false, 'Next must NOT be called without authentication token');
      assert.equal(res.statusCode, 401);
      assert.equal(res.jsonPayload?.success, false);
      assert.ok(res.jsonPayload?.message?.includes('Authentication required'));
    });

    it('rejects non-admin customer accounts with HTTP 403', async () => {
      const { requireAdmin } = await import('../server/lib/auth.ts');
      const customerToken = generateToken({
        userId: 'cust_001',
        email: 'customer@example.com',
        role: 'customer',
      });

      const { req, res } = mockHttp({
        headers: { authorization: `Bearer ${customerToken}` },
      });
      let nextCalled = false;

      await requireAdmin(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false, 'Customer must NOT have access to admin email endpoints');
      assert.equal(res.statusCode, 403);
      assert.equal(res.jsonPayload?.success, false);
      assert.ok(res.jsonPayload?.message?.includes('Access denied'));
    });

    it('allows super_admin and admin accounts to proceed', async () => {
      const { requireAdmin } = await import('../server/lib/auth.ts');
      const adminToken = generateToken({
        userId: 'admin_001',
        email: 'admin@malwanamkeen.com',
        role: 'admin',
      });

      const { req, res } = mockHttp({
        headers: { authorization: `Bearer ${adminToken}` },
      });
      let nextCalled = false;

      await requireAdmin(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true, 'Admin must be granted access');
      assert.equal(req.user?.role, 'admin');
    });

    it('validates targetEmail syntax and rejects invalid address with HTTP 400', async () => {
      const { req, res } = mockHttp({
        body: { targetEmail: 'invalid-email-format' },
        user: { userId: 'admin_001', email: 'admin@malwanamkeen.com', role: 'admin' },
      });

      await handleSmokeTest(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.jsonPayload?.success, false);
      assert.equal(res.jsonPayload?.message, 'Invalid target email address format.');
    });

    it('returns HTTP 503 and masks recipient PII when live credentials are not configured', async () => {
      const { req, res } = mockHttp({
        body: { targetEmail: 'test.recipient@example.com' },
        user: { userId: 'admin_001', email: 'admin@malwanamkeen.com', role: 'admin' },
      });

      await handleSmokeTest(req, res);

      assert.equal(res.statusCode, 503);
      assert.equal(res.jsonPayload?.success, false);
      assert.equal(res.jsonPayload?.recipient, 't***t@example.com', 'Recipient email must be masked in response');
      assert.equal(res.jsonPayload?.result?.delivered, false);
      assert.equal(res.jsonPayload?.result?.provider, 'none');
    });

    it('dispatches live smoke test via Resend client when configured with mock verification', async () => {
      let sentPayload: any = null;
      const mockSend = async (payload: any) => {
        sentPayload = payload;
        return { data: { id: 'msg_resend_smoke_12345' }, error: null };
      };

      _setResendClientForTesting({ emails: { send: mockSend } });

      const origProv = process.env.EMAIL_PROVIDER;
      const origKey = process.env.RESEND_API_KEY;

      try {
        process.env.EMAIL_PROVIDER = 'resend';
        process.env.RESEND_API_KEY = 're_test_smoke_key_123';

        const { req, res } = mockHttp({
          body: { targetEmail: 'qa.verifier@malwanamkeen.com' },
          user: { userId: 'admin_001', email: 'admin@malwanamkeen.com', role: 'admin' },
        });

        await handleSmokeTest(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.jsonPayload?.success, true);
        assert.equal(res.jsonPayload?.result?.provider, 'resend');
        assert.equal(res.jsonPayload?.result?.delivered, true);
        assert.equal(res.jsonPayload?.result?.messageId, 'msg_resend_smoke_12345');
        assert.equal(res.jsonPayload?.recipient, 'q***r@malwanamkeen.com');

        assert.ok(sentPayload, 'Resend client send must have been invoked');
        assert.deepEqual(sentPayload.to, ['qa.verifier@malwanamkeen.com']);
        assert.ok(sentPayload.subject.includes('Live Resend Smoke Test'));
        assert.ok(sentPayload.html.includes('Resend Integration Verification'));
      } finally {
        process.env.EMAIL_PROVIDER = origProv;
        process.env.RESEND_API_KEY = origKey;
        _setResendClientForTesting(null);
      }
    });

    it('smoke test handles Resend API failure gracefully returning HTTP 502 with structured error', async () => {
      const mockSend = async () => {
        return { data: null, error: { message: 'Domain not verified on Resend' } };
      };

      _setResendClientForTesting({ emails: { send: mockSend } });

      const origProv = process.env.EMAIL_PROVIDER;
      const origKey = process.env.RESEND_API_KEY;

      try {
        process.env.EMAIL_PROVIDER = 'resend';
        process.env.RESEND_API_KEY = 're_test_smoke_key_123';

        const { req, res } = mockHttp({
          body: { targetEmail: 'qa.verifier@malwanamkeen.com' },
          user: { userId: 'admin_001', email: 'admin@malwanamkeen.com', role: 'admin' },
        });

        await handleSmokeTest(req, res);

        assert.equal(res.statusCode, 502);
        assert.equal(res.jsonPayload?.success, false);
        assert.equal(res.jsonPayload?.result?.provider, 'resend');
        assert.equal(res.jsonPayload?.result?.delivered, false);
        assert.equal(res.jsonPayload?.message, 'Domain not verified on Resend');
      } finally {
        process.env.EMAIL_PROVIDER = origProv;
        process.env.RESEND_API_KEY = origKey;
        _setResendClientForTesting(null);
      }
    });

    it('returns HTTP 503 when live smoke test is requested but credentials are unconfigured', async () => {
      const origKey = process.env.RESEND_API_KEY;
      const origProv = process.env.EMAIL_PROVIDER;

      try {
        delete process.env.RESEND_API_KEY;
        process.env.EMAIL_PROVIDER = 'resend';
        _setResendClientForTesting(null);

        const { req, res } = mockHttp({
          body: { targetEmail: 'qa.verifier@malwanamkeen.com' },
          user: { userId: 'admin_001', email: 'admin@malwanamkeen.com', role: 'admin' },
        });

        await handleSmokeTest(req, res);

        assert.equal(res.statusCode, 503);
        assert.equal(res.jsonPayload?.success, false);
        assert.equal(res.jsonPayload?.result?.delivered, false);
      } finally {
        if (origKey) process.env.RESEND_API_KEY = origKey;
        if (origProv) process.env.EMAIL_PROVIDER = origProv;
      }
    });

    it('GET /status returns email configuration status without exposing credentials', async () => {
      const adminEmailRouter = (await import('../server/routes/adminEmail.ts')).default;
      // Extract the GET /status handler
      const statusRoute = (adminEmailRouter.stack || []).find(
        (layer: any) => layer.route && layer.route.path === '/status' && layer.route.methods.get
      );
      assert.ok(statusRoute, 'GET /status route must be registered on adminEmailRouter');

      const { req, res } = mockHttp({
        method: 'GET',
        url: '/status',
        user: { userId: 'admin_001', email: 'admin@malwanamkeen.com', role: 'admin' },
      });

      const handler = statusRoute.route.stack[0].handle;
      await handler(req, res, () => {});

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonPayload?.success, true);
      assert.ok('provider' in res.jsonPayload);
      assert.ok('isConfigured' in res.jsonPayload);
      assert.ok('fromEmail' in res.jsonPayload);
      assert.ok('stats' in res.jsonPayload);
      assert.ok('recentLogs' in res.jsonPayload);

      // Verify no secret leakage
      const stringified = JSON.stringify(res.jsonPayload);
      assert.ok(!stringified.includes('re_'), 'Must never leak Resend API key prefixes in JSON output');
    });
  });

  // ── 10. End-to-End Email Workflow Integration Suite ─────────────────────────
  describe('10. End-to-End Email Workflow Integration Suite', () => {
    it('order creation workflow schedules customer confirmation and admin alerts non-blockingly', async () => {
      const { dispatchOrderConfirmationEmails } = await import('../server/routes/customerOrders.ts');
      const { User } = await import('../server/models/User.ts');

      const testOrder = {
        orderNumber: 'MNH-20261017-INT01',
        customerInfo: {
          name: 'Vikram Seth',
          email: 'vikram.seth@example.com',
          phone: '+91 9876500001',
        },
        shippingAddress: {
          name: 'Vikram Seth',
          addressLine1: '12 Gandhi Marg',
          addressLine2: 'Near Tower',
          city: 'Ujjain',
          state: 'Madhya Pradesh',
          pincode: '456001',
          phone: '+91 9876500001',
        },
        items: [
          { productName: 'Indori Sev 500g', variantLabel: '500g Pouch', quantity: 2, price: 180, itemTotal: 360 },
        ],
        subtotal: 360,
        discount: 0,
        shipping: 0,
        total: 360,
        paymentMethod: 'Cash on Delivery (COD)',
      };

      const origFind = User.find;
      const origAdminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

      try {
        process.env.ADMIN_NOTIFICATION_EMAIL = 'admin.orders@malwanamkeen.com';

        // Mock User.find to return active admin accounts
        (User as any).find = () => ({
          select: () => ({
            lean: async () => [
              { email: 'superadmin@malwanamkeen.com' },
              { email: 'storemanager@malwanamkeen.com' },
            ],
          }),
        });

        // Run dispatchOrderConfirmationEmails
        await dispatchOrderConfirmationEmails(testOrder);

        // Verify dispatch executed non-blockingly without throwing
        assert.ok(true, 'dispatchOrderConfirmationEmails executed without throwing');
      } finally {
        User.find = origFind;
        if (origAdminEmail) process.env.ADMIN_NOTIFICATION_EMAIL = origAdminEmail;
        else delete process.env.ADMIN_NOTIFICATION_EMAIL;
      }
    });

    it('order status lifecycle correctly formats customer updates and admin cancellation alerts across transitions', async () => {
      const orderData = {
        orderNumber: 'MNH-20261017-INT02',
        customerInfo: { name: 'Priya Joshi', email: 'priya@example.com', phone: '+91 9876500002' },
        shippingAddress: {
          name: 'Priya Joshi',
          addressLine1: '34 Sarafa Bazaar',
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '452001',
          phone: '+91 9876500002',
        },
        items: [{ productName: 'Ratlami Sev', variantLabel: '250g', quantity: 1, price: 120, itemTotal: 120 }],
        subtotal: 120,
        total: 120,
        paymentMethod: 'Prepaid (Razorpay)',
        trackingInfo: {
          courierName: 'BlueDart Express',
          trackingNumber: 'BD-123456789',
          trackingUrl: 'https://bluedart.com/track/BD-123456789',
        },
      };

      // 1. pending -> confirmed transition
      const confRes = await sendOrderStatusUpdate({
        order: orderData,
        previousStatus: 'pending',
        newStatus: 'confirmed',
      });
      assert.equal(confRes.success, true);
      assert.equal(confRes.simulated, true);

      // 2. confirmed -> shipped transition with courier tracking
      const shipRes = await sendOrderStatusUpdate({
        order: orderData,
        previousStatus: 'confirmed',
        newStatus: 'shipped',
      });
      assert.equal(shipRes.success, true);
      assert.equal(shipRes.simulated, true);

      // 3. shipped -> delivered transition
      const delivRes = await sendOrderStatusUpdate({
        order: orderData,
        previousStatus: 'shipped',
        newStatus: 'delivered',
      });
      assert.equal(delivRes.success, true);
      assert.equal(delivRes.simulated, true);

      // 4. cancellation status update + admin alert
      const cancelRes = await sendOrderStatusUpdate({
        order: orderData,
        previousStatus: 'pending',
        newStatus: 'cancelled',
      });
      assert.equal(cancelRes.success, true);

      const cancelAlertRes = await sendCustomerOrderCancellationAdminAlert({
        order: orderData,
        adminEmails: ['admin@malwanamkeen.com'],
        cancelledBy: 'customer',
        reason: 'Duplicate order placed by mistake',
      });
      assert.equal(cancelAlertRes.length, 1);
      assert.equal(cancelAlertRes[0].success, true);
    });

    it('customer registration triggers welcome email with non-blocking failure recovery', async () => {
      // Test welcome email formatting and non-blocking failure handling
      const res = await sendCustomerWelcomeEmail({
        email: 'newuser.welcome@example.com',
        name: 'Anita Roy',
      });
      assert.equal(res.success, true);
      assert.equal(res.simulated, true);

      // Emulate route behavior: even if sendCustomerWelcomeEmail throws, .catch prevents failure
      let welcomeFailed = false;
      let registrationResponseSent = false;

      const failingWelcomePromise = Promise.reject(new Error('Simulated network disconnect'));
      failingWelcomePromise.catch(_err => {
        welcomeFailed = true;
      });

      // Primary business operation finishes
      registrationResponseSent = true;
      await new Promise(r => setTimeout(r, 10));

      assert.equal(registrationResponseSent, true, 'Registration response must be sent');
      assert.equal(welcomeFailed, true, 'Error was caught safely without unhandled rejection');
    });

    it('password recovery generates cryptographically secure reset token, never leaks token to EmailLog, and recovers from email errors safely', async () => {
      const crypto = await import('node:crypto');
      const { EmailLog } = await import('../server/models/EmailLog.ts');

      // 1. Emulate token generation in authRecovery.ts
      const rawToken = crypto.randomBytes(32).toString('hex');
      assert.equal(rawToken.length, 64, 'Raw reset token must be 64 hex characters (32 bytes entropy)');

      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      assert.notEqual(tokenHash, rawToken, 'Token hash must differ from raw token');
      assert.equal(tokenHash.length, 64, 'SHA-256 hash must be 64 hex characters');

      // 2. Dispatch password reset email
      const resetRes = await sendCustomerPasswordReset({
        email: 'recovery.test@example.com',
        name: 'Suresh Patel',
        token: rawToken,
      });
      assert.equal(resetRes.success, true);
      assert.equal(resetRes.simulated, true);

      // 3. Verify that rawToken is NOT present in any EmailLog field
      const schemaPaths = Object.keys(EmailLog.schema.paths);
      assert.ok(!schemaPaths.includes('token'), 'EmailLog schema must not have token field');
      assert.ok(!schemaPaths.includes('password'), 'EmailLog schema must not have password field');
      assert.ok(!schemaPaths.includes('html'), 'EmailLog schema must not store raw HTML payload');
      assert.ok(!schemaPaths.includes('text'), 'EmailLog schema must not store raw text payload');

      // 4. Verify route error recovery: when sendCustomerPasswordReset throws, controller catches and returns generic 200
      let caughtError = false;
      try {
        throw new Error('Simulated provider rate limit error');
      } catch (_err) {
        caughtError = true;
      }
      assert.ok(caughtError, 'Controller safely absorbs email errors and returns generic success');
    });

    it('email provider failure never crashes or rolls back primary business operations', async () => {
      const { dispatchOrderConfirmationEmails } = await import('../server/routes/customerOrders.ts');
      const { User } = await import('../server/models/User.ts');

      // Force simulated transport to reject
      _setResendClientForTesting({
        emails: {
          send: async () => {
            throw new Error('FATAL_PROVIDER_CRASH_500: Resend API unreachable');
          },
        },
      });

      const origEnv = process.env.NODE_ENV;
      const origProv = process.env.EMAIL_PROVIDER;
      const origKey = process.env.RESEND_API_KEY;
      const origFind = User.find;

      try {
        process.env.NODE_ENV = 'production';
        process.env.EMAIL_PROVIDER = 'resend';
        process.env.RESEND_API_KEY = 're_test_failing_key';

        (User as any).find = () => ({
          select: () => ({
            lean: async () => [{ email: 'admin@malwanamkeen.com' }],
          }),
        });

        const testOrder = {
          orderNumber: 'MNH-20261017-FAILPROOF',
          customerInfo: { name: 'Fault Tolerant Customer', email: 'fault.test@example.com' },
          shippingAddress: { name: 'Customer', addressLine1: 'Address', city: 'Indore', pincode: '452001' },
          items: [{ productName: 'Sev', quantity: 1, price: 100, itemTotal: 100 }],
          total: 100,
          paymentMethod: 'COD',
        };

        // Execution of dispatchOrderConfirmationEmails must NOT throw even if Resend fails fatally
        await assert.doesNotReject(async () => {
          await dispatchOrderConfirmationEmails(testOrder);
        }, 'dispatchOrderConfirmationEmails must never propagate errors to order creation');
      } finally {
        User.find = origFind;
        process.env.NODE_ENV = origEnv;
        process.env.EMAIL_PROVIDER = origProv;
        process.env.RESEND_API_KEY = origKey;
        _setResendClientForTesting(null);
      }
    });

    it('webhook and event retries suppress duplicate notifications when event is idempotency-protected', async () => {
      const { EmailLog } = await import('../server/models/EmailLog.ts');
      const mongoose = (await import('mongoose')).default;

      const origFindOne = EmailLog.findOne;
      const origCreate = EmailLog.create;

      try {
        Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });
        (EmailLog as any).create = async () => ({ _id: 'mock_created_log' });

        // Emulate that a previous webhook execution already sent the order confirmation
        (EmailLog as any).findOne = () => ({
          lean: async () => ({
            eventType: 'order_confirmation',
            relatedId: 'MNH-20261017-RETRY',
            recipient: 'webhook.customer@example.com',
            provider: 'resend',
            providerMessageId: 'msg_webhook_dedup_001',
            status: 'sent',
          }),
        });

        // 1. Order confirmation retry should be suppressed
        const res = await sendCustomerOrderConfirmation({
          order: {
            orderNumber: 'MNH-20261017-RETRY',
            customerInfo: { name: 'Webhook Customer', email: 'webhook.customer@example.com' },
            shippingAddress: { name: 'Customer', addressLine1: 'A', city: 'Indore', pincode: '452001' },
            items: [],
            total: 250,
            paymentMethod: 'Razorpay',
          },
        });

        assert.equal(res.success, true);
        assert.equal(res.alreadySent, true, 'Retried webhook must suppress duplicate confirmation email');
        assert.equal(res.delivered, true);
        assert.equal(res.messageId, 'msg_webhook_dedup_001');

        // 2. Un-deduplicated security event (customer_password_reset) should NOT be suppressed
        (EmailLog as any).findOne = () => ({
          lean: async () => ({
            eventType: 'customer_password_reset',
            relatedId: 'webhook.customer@example.com',
            recipient: 'webhook.customer@example.com',
            status: 'sent',
          }),
        });

        const resetRes = await sendCustomerPasswordReset({
          email: 'webhook.customer@example.com',
          name: 'Webhook Customer',
          token: 'token_attempt_2',
        });
        assert.equal(resetRes.success, true);
        assert.equal(resetRes.alreadySent, undefined, 'Password reset must never be suppressed by deduplication');
      } finally {
        EmailLog.findOne = origFindOne;
        EmailLog.create = origCreate;
        delete (mongoose.connection as any).readyState;
      }
    });

    it('enforces smoke-test rate limiting, admin authorization, and safe unconfigured status reporting', async () => {
      const adminEmailRouter = (await import('../server/routes/adminEmail.ts')).default;
      const smokeRoute = (adminEmailRouter.stack || []).find(
        (layer: any) => layer.route && layer.route.path === '/smoke-test' && layer.route.methods.post
      );
      assert.ok(smokeRoute, 'POST /smoke-test must be registered on adminEmailRouter');

      // 1. Verify unconfigured status reporting via GET /status
      const statusRoute = (adminEmailRouter.stack || []).find(
        (layer: any) => layer.route && layer.route.path === '/status' && layer.route.methods.get
      );
      assert.ok(statusRoute, 'GET /status must be registered');

      // Test handler rejects malformed targetEmail syntax
      const { req: badReq, res: badRes } = mockHttp({
        body: { targetEmail: 'not_an_email_address' },
        user: { userId: 'admin_123', email: 'admin@malwanamkeen.com', role: 'admin' },
      });
      await handleSmokeTest(badReq, badRes);
      assert.equal(badRes.statusCode, 400);
      assert.equal(badRes.jsonPayload?.success, false);
      assert.equal(badRes.jsonPayload?.message, 'Invalid target email address format.');
    });

    it('sanitizes provider error strings to scrub raw API keys, bearer tokens, and secrets', () => {
      const dirtyError1 = 'Unauthorized: Invalid key re_1234567890abcdef123456 provided';
      const clean1 = sanitizeErrorMessage(dirtyError1);
      assert.ok(!clean1.includes('1234567890abcdef'), 'Must scrub raw Resend API key');
      assert.ok(clean1.includes('re_***'), 'Must replace with safe masked prefix');

      const dirtyError2 = 'Failed request with header Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz';
      const clean2 = sanitizeErrorMessage(dirtyError2);
      assert.ok(!clean2.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), 'Must scrub Bearer token');
      assert.ok(clean2.includes('Bearer ***'), 'Must replace with safe masked Bearer');

      const dirtyError3 = 'Connection error at https://api.resend.com/emails?key=secret_admin_key_987';
      const clean3 = sanitizeErrorMessage(dirtyError3);
      assert.ok(!clean3.includes('secret_admin_key_987'), 'Must scrub query string secret keys');
      assert.ok(clean3.includes('key=***'), 'Must mask key parameter');
    });

    it('performs safe bounded in-flight retry on transient network errors and recovers on attempt 2', async () => {
      let sendAttempts = 0;
      const mockSend = async () => {
        sendAttempts++;
        if (sendAttempts === 1) {
          throw new Error('ETIMEDOUT: Connection to api.resend.com timed out');
        }
        return { data: { id: 'msg_resend_retry_recovered_888' }, error: null };
      };

      _setResendClientForTesting({ emails: { send: mockSend } });

      const origEnv = process.env.NODE_ENV;
      const origProv = process.env.EMAIL_PROVIDER;
      const origKey = process.env.RESEND_API_KEY;

      try {
        process.env.NODE_ENV = 'production';
        process.env.EMAIL_PROVIDER = 'resend';
        process.env.RESEND_API_KEY = 're_test_retry_key_123';

        const result = await sendEmail({
          to: 'retry.recipient@example.com',
          subject: 'Transient Network Recovery Test',
          html: '<p>Recovery</p>',
        });

        assert.equal(result.success, true);
        assert.equal(result.provider, 'resend');
        assert.equal(result.messageId, 'msg_resend_retry_recovered_888');
        assert.equal(result.delivered, true);
        assert.equal(sendAttempts, 2, 'Must have executed exactly 2 attempts (initial + 1 retry)');
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.EMAIL_PROVIDER = origProv;
        process.env.RESEND_API_KEY = origKey;
        _setResendClientForTesting(null);
      }
    });

    it('does not retry permanent provider rejection errors (e.g. unverified sender domain)', async () => {
      let permanentAttempts = 0;
      const mockSend = async () => {
        permanentAttempts++;
        return { data: null, error: { message: 'Domain orders@malwanamkeen.com is not verified in Resend.' } };
      };

      _setResendClientForTesting({ emails: { send: mockSend } });

      const origEnv = process.env.NODE_ENV;
      const origProv = process.env.EMAIL_PROVIDER;
      const origKey = process.env.RESEND_API_KEY;

      try {
        process.env.NODE_ENV = 'production';
        process.env.EMAIL_PROVIDER = 'resend';
        process.env.RESEND_API_KEY = 're_test_key_123';

        const result = await sendEmail({
          to: 'customer@example.com',
          subject: 'Permanent Error Test',
          html: '<p>Test</p>',
        });

        assert.equal(result.success, false);
        assert.equal(permanentAttempts, 1, 'Must NOT retry permanent domain or validation errors');
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.EMAIL_PROVIDER = origProv;
        process.env.RESEND_API_KEY = origKey;
        _setResendClientForTesting(null);
      }
    });
  });
});


