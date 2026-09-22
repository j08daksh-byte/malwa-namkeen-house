/**
 * Malwa Namkeen House — Deterministic Automated Regression Test Suite
 * 
 * Verifies core business logic, schema validations, pricing calculations,
 * JWT authentication helpers, and slugification without database side-effects.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { slugify } from '../server/routes/adminProducts.ts';
import { BUSINESS } from '../server/config.ts';

// ── 1. Contact / Enquiry Validation Schema ────────────────────────────────────
const ContactEnquirySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().regex(/^(\+91[\-\s]?)?[0]?[6789]\d{9}$/, 'Invalid Indian mobile number').optional().or(z.literal('')),
  category: z.enum(['general_enquiry', 'catering', 'bulk_orders', 'corporate_gifting', 'birthday_parties_events']),
  message: z.string().trim().min(10, 'Message must be at least 10 characters'),
  consent: z.boolean().refine(val => val === true, 'Consent is required'),
});

// ── 2. Indian PIN Code & Address Validation ───────────────────────────────────
const PinCodeSchema = z.string().trim().regex(/^\d{6}$/, 'Must be a 6-digit Indian PIN code');

// ── 3. Cart Pricing Math Helper ───────────────────────────────────────────────
function calculateOrderTotals(
  items: Array<{ price: number; quantity: number }>,
  coupon?: { type: 'percentage' | 'fixed'; value: number } | null
) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discount = 0;
  if (coupon) {
    if (coupon.type === 'percentage') {
      discount = Math.round((subtotal * coupon.value) / 100);
    } else {
      discount = Math.min(subtotal, coupon.value);
    }
  }
  const shipping = subtotal >= 499 ? 0 : 49;
  const total = Math.max(0, subtotal - discount + shipping);
  return { subtotal, discount, shipping, total };
}

// ── Test Suites ──────────────────────────────────────────────────────────────

describe('Malwa Namkeen House — Core Business & Validation Regression Suite', () => {

  describe('1. Brand & Business Configuration', () => {
    it('should maintain immutable business constants', () => {
      assert.equal(BUSINESS.name, 'MALWA NAMKEEN HOUSE');
      assert.equal(BUSINESS.phone, '+91 7987732765');
      assert.equal(BUSINESS.whatsappNumber, '917987732765');
      assert.equal(BUSINESS.gstNumber, '29AQWPP5638F2ZO');
      assert.equal(BUSINESS.fssaiNumber, '11225302002687');
      assert.equal(BUSINESS.address.city, 'Bengaluru');
      assert.equal(BUSINESS.address.postalCode, '562125');
    });
  });

  describe('2. Slug Generation Utility', () => {
    it('should generate URL-safe slugs from English and transliterated strings', () => {
      assert.equal(slugify('Special Ratlami Sev 500g'), 'special-ratlami-sev-500g');
      assert.equal(slugify('Ujjaini Sev & Khatta Meetha!'), 'ujjaini-sev-khatta-meetha');
      assert.equal(slugify('   Laung  Sev (Artisanal)   '), 'laung-sev-artisanal');
    });
  });

  describe('3. Contact / Bulk Enquiry Form Validation', () => {
    it('should accept valid contact enquiries', () => {
      const valid = {
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        phone: '+91 9876543210',
        category: 'corporate_gifting',
        message: 'Looking for 50 Diwali gift hampers with customized packaging.',
        consent: true,
      };
      const result = ContactEnquirySchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    it('should reject invalid emails and messages shorter than 10 characters', () => {
      const invalid = {
        name: 'R',
        email: 'not-an-email',
        phone: '123',
        category: 'bulk_orders',
        message: 'Short',
        consent: false,
      };
      const result = ContactEnquirySchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.error.issues.length >= 4, true);
      }
    });
  });

  describe('4. Indian PIN Code Validation', () => {
    it('should validate 6-digit Indian PIN codes', () => {
      assert.equal(PinCodeSchema.safeParse('562125').success, true);
      assert.equal(PinCodeSchema.safeParse('110001').success, true);
      assert.equal(PinCodeSchema.safeParse('560034').success, true);
    });

    it('should reject non-6-digit PIN codes', () => {
      assert.equal(PinCodeSchema.safeParse('56212').success, false);
      assert.equal(PinCodeSchema.safeParse('5621250').success, false);
      assert.equal(PinCodeSchema.safeParse('56212A').success, false);
      assert.equal(PinCodeSchema.safeParse('').success, false);
    });
  });

  describe('5. Cart & Free Shipping Calculation Logic', () => {
    it('should charge standard ₹49 shipping when subtotal is below ₹499', () => {
      const items = [{ price: 230, quantity: 1 }]; // ₹230
      const totals = calculateOrderTotals(items);
      assert.equal(totals.subtotal, 230);
      assert.equal(totals.shipping, 49);
      assert.equal(totals.discount, 0);
      assert.equal(totals.total, 279);
    });

    it('should apply free shipping when subtotal reaches or exceeds ₹499', () => {
      const items = [{ price: 230, quantity: 2 }, { price: 120, quantity: 1 }]; // ₹580
      const totals = calculateOrderTotals(items);
      assert.equal(totals.subtotal, 580);
      assert.equal(totals.shipping, 0);
      assert.equal(totals.total, 580);
    });

    it('should correctly calculate percentage and fixed discount coupons', () => {
      const items = [{ price: 250, quantity: 4 }]; // ₹1000
      
      // 10% coupon
      const pctTotals = calculateOrderTotals(items, { type: 'percentage', value: 10 });
      assert.equal(pctTotals.subtotal, 1000);
      assert.equal(pctTotals.discount, 100);
      assert.equal(pctTotals.shipping, 0);
      assert.equal(pctTotals.total, 900);

      // ₹150 fixed coupon
      const fixedTotals = calculateOrderTotals(items, { type: 'fixed', value: 150 });
      assert.equal(fixedTotals.subtotal, 1000);
      assert.equal(fixedTotals.discount, 150);
      assert.equal(fixedTotals.total, 850);
    });
  });

  describe('6. JWT Token Cryptographic Verification', () => {
    const testSecret = 'deterministic_test_jwt_secret_key_32_characters_long';

    it('should sign and decode customer JWT tokens with expected claims', () => {
      const payload = {
        userId: 'user_67890',
        email: 'customer@test.com',
        role: 'customer',
      };
      const token = jwt.sign(payload, testSecret, { expiresIn: '7d' });
      assert.equal(typeof token, 'string');

      const decoded = jwt.verify(token, testSecret) as any;
      assert.equal(decoded.userId, 'user_67890');
      assert.equal(decoded.email, 'customer@test.com');
      assert.equal(decoded.role, 'customer');
    });

    it('should reject tampered or invalid tokens', () => {
      const token = jwt.sign({ userId: 'admin_123', role: 'super_admin' }, testSecret);
      assert.throws(() => {
        jwt.verify(token, 'wrong_secret_key_that_does_not_match_32_chars');
      });
    });
  });

});
