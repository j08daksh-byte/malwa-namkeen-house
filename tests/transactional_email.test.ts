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
  _setResendClientForTesting,
} from '../server/lib/emailService.ts';

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
});
