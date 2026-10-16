/**
 * Malwa Namkeen House — Comprehensive Full-System E2E Verification
 * 
 * Verifies every single subsystem, public storefront route, API,
 * authentication cycle, customer order flow, and super_admin portal route.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { hashPassword } from '../server/lib/auth.ts';
import {
  assertSafeTestDatabaseEnvironment,
  verifyLiveServerDatabaseIsolation,
  TestRecordTracker,
} from './test_db_guard.ts';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
process.env.IS_E2E_TEST = 'true';
process.env.NODE_ENV = 'test';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'local-development-secret-key-at-least-32-chars-long-12345';
const tracker = new TestRecordTracker('full_sys_e2e');

// Super Admin token for administrative endpoint testing (dynamically authenticated in Section 8)
let superAdminToken = '';

describe('Malwa Namkeen House — Exhaustive Full-System Verification', () => {

  // ── Pre-flight Hard Safety Gate ──────────────────────────────────────────────
  before(async () => {
    // 1. Process environment assertion
    assertSafeTestDatabaseEnvironment();

    // 2. Dedicated admin test credentials requirement (no fallbacks to production or hardcoded)
    const testAdminEmail = (process.env.TEST_ADMIN_EMAIL || '').trim();
    const testAdminPassword = (process.env.TEST_ADMIN_PASSWORD || '').trim();
    if (!testAdminEmail || !testAdminPassword) {
      throw new Error(
        'CRITICAL E2E SAFETY GATE ABORT: Dedicated TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be configured in .env.local for full-system E2E testing. Fallback to production admin credentials (ADMIN_EMAIL, ADMIN_PASSWORD) or hardcoded passwords is strictly prohibited.'
      );
    }

    // 3. Live server database isolation verification
    const isolation = await verifyLiveServerDatabaseIsolation(BASE_URL);
    if (!isolation.safe) {
      throw new Error(`CRITICAL E2E SAFETY GATE ABORT:\n${isolation.error}`);
    }
  });

  // ── Scoped Teardown Lifecycle ────────────────────────────────────────────────
  after(async () => {
    const { cleanedCount, failures } = await tracker.performScopedCleanup();
    console.log(`[Full-System E2E Lifecycle] Scoped test teardown completed: ${cleanedCount} records removed.`);
    if (failures.length > 0) {
      console.warn('[Full-System E2E Lifecycle Warning] Some test records could not be removed:', failures);
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // =========================================================================
  // 1. HEALTH & INFRASTRUCTURE
  // =========================================================================
  describe('1. Health & Database Connectivity', () => {
    it('GET /api/health returns 200 OK with connected MongoDB state', async () => {
      const res = await fetch(`${BASE_URL}/api/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'ok');
      assert.equal(data.service, 'MALWA NAMKEEN HOUSE');
      assert.equal(data.mongodb, 'connected');
      assert.ok(data.time);
    });
  });

  // =========================================================================
  // 2. SEO & DISCOVERABILITY
  // =========================================================================
  describe('2. SEO & Discoverability Endpoints', () => {
    it('GET /sitemap.xml returns valid XML sitemap', async () => {
      const res = await fetch(`${BASE_URL}/sitemap.xml`);
      assert.equal(res.status, 200);
      assert.ok(res.headers.get('content-type')?.includes('xml'));
      const text = await res.text();
      assert.ok(text.includes('<urlset'));
      assert.ok(text.includes('/shop'));
    });

    it('GET /robots.txt returns valid robots file', async () => {
      const res = await fetch(`${BASE_URL}/robots.txt`);
      assert.equal(res.status, 200);
      const text = await res.text();
      assert.ok(text.includes('User-agent: *'));
      assert.ok(text.includes('Sitemap:'));
    });
  });

  // =========================================================================
  // 3. STOREFRONT & SPA PAGES
  // =========================================================================
  describe('3. Storefront Pages & SPA Fallback Routes', () => {
    const pages = [
      { path: '/', title: 'Home' },
      { path: '/shop', title: 'Shop' },
      { path: '/about-us', title: 'About Us' },
      { path: '/contact', title: 'Contact' },
      { path: '/faq', title: 'FAQ' },
      { path: '/admin/login', title: 'Admin Login' },
      { path: '/admin/dashboard', title: 'Admin Dashboard Fallback' },
    ];

    for (const page of pages) {
      it(`GET ${page.path} renders HTML with 200 OK`, async () => {
        const res = await fetch(`${BASE_URL}${page.path}`);
        assert.equal(res.status, 200);
        const html = await res.text();
        assert.ok(html.includes('<!doctype html>') || html.includes('<html'), `Page ${page.path} must serve HTML`);
      });
    }
  });

  // =========================================================================
  // 4. CATALOG & STORE DATA
  // =========================================================================
  let sampleProduct: any = null;
  let sampleCategory: any = null;

  describe('4. Store Catalog & Public Products API', () => {
    it('GET /api/categories returns active categories', async () => {
      const res = await fetch(`${BASE_URL}/api/categories`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.categories) && data.categories.length > 0);
      sampleCategory = data.categories[0];
      assert.ok(sampleCategory.name);
      assert.ok(sampleCategory.slug);
    });

    it('GET /api/products returns active product catalog', async () => {
      const res = await fetch(`${BASE_URL}/api/products`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.products) && data.products.length > 0);
      sampleProduct = data.products[0];
      assert.ok(sampleProduct.name);
      assert.ok(sampleProduct.slug);
      assert.ok(sampleProduct.options || sampleProduct.variants);
    });

    it('GET /api/products/best-sellers returns best-sellers', async () => {
      const res = await fetch(`${BASE_URL}/api/products/best-sellers`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.products));
    });

    it('GET /api/products/:slug fetches single product', async () => {
      assert.ok(sampleProduct, 'Sample product must exist');
      const res = await fetch(`${BASE_URL}/api/products/${sampleProduct.slug}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.product.name, sampleProduct.name);
    });

    it('GET /api/settings returns public store settings & branding', async () => {
      const res = await fetch(`${BASE_URL}/api/settings`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.settings);
      assert.ok(data.settings.storeName || data.settings.businessName);
    });

    it('GET /api/banners returns storefront banners', async () => {
      const res = await fetch(`${BASE_URL}/api/banners`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.banners));
    });
  });

  // =========================================================================
  // 5. CART, PRICING & DISCOUNTS
  // =========================================================================
  describe('5. Cart Revalidation & Discount Calculation', () => {
    it('POST /api/cart/revalidate calculates correct subtotal and pricing', async () => {
      assert.ok(sampleProduct);
      const variant = (sampleProduct.options && sampleProduct.options[0]) || (sampleProduct.variants && sampleProduct.variants[0]);
      const res = await fetch(`${BASE_URL}/api/cart/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              productId: sampleProduct._id || sampleProduct.id,
              variantId: variant.id || variant._id,
              quantity: 2,
            },
          ],
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.subtotal, variant.price * 2);
    });

    it('POST /api/discounts/validate rejects unknown coupon', async () => {
      const res = await fetch(`${BASE_URL}/api/discounts/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'INVALID_TEST_CODE_999',
          subtotal: 1000,
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.valid, false);
    });
  });

  // =========================================================================
  // 6. CONCIERGE & INQUIRIES
  // =========================================================================
  describe('6. Malwa Concierge & Public Inquiries', () => {
    it('POST /api/concierge responds with polite culinary guidance', async () => {
      const res = await fetch(`${BASE_URL}/api/concierge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { sender: 'user', text: 'Namaste! What is your best Ratlami Sev?' },
          ],
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.text);
      assert.ok(data.text.length > 5);
    });

    it('POST /api/inquiries submits corporate / gifting enquiry', async () => {
      const enquiryEmail = tracker.getTestInquiryEmail();
      const res = await fetch(`${BASE_URL}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Indore Heritage Sweets Partner',
          email: enquiryEmail,
          phone: '9876543210',
          category: 'corporate_gifting',
          message: 'Bulk order enquiry for 150 signature festive gift hampers.',
        }),
      });
      assert.ok([200, 201].includes(res.status));
      const data = await res.json();
      assert.equal(data.success, true);
    });
  });

  // =========================================================================
  // 7. CUSTOMER LIFECYCLE & CHECKOUT
  // =========================================================================
  describe('7. Customer Authentication, Profile, Addresses & Order Flow', () => {
    const customerEmail = tracker.getTestUserEmail();
    const customerPassword = 'SecurePassword@123';
    let customerToken = '';
    let customerId = '';
    let placedOrderNumber = '';
    const idempotencyKey = tracker.getTestIdempotencyKey();

    it('A. Registers new customer account', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Anjali Sharma',
          email: customerEmail,
          password: customerPassword,
          phone: '9826011111',
        }),
      });
      assert.ok([200, 201].includes(res.status));
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.token);
      customerToken = data.token;
      customerId = data.user.id || data.user._id;
      if (customerId) tracker.userIds.push(customerId);
    });

    it('B. Logs in with the created credentials', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerEmail,
          password: customerPassword,
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.token);
    });

    it('C. Fetches profile via /api/auth/me', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.user.email, customerEmail);
      assert.equal(data.user.role, 'customer');
    });

    it('D. Updates customer profile information', async () => {
      const res = await fetch(`${BASE_URL}/api/customer/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          name: 'Anjali Sharma Updated',
          phone: '9826022222',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.profile.name, 'Anjali Sharma Updated');
    });

    it('E. Adds shipping address to customer address book', async () => {
      const res = await fetch(`${BASE_URL}/api/customer/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          name: 'Anjali Sharma Home',
          phone: '9826022222',
          addressLine1: 'Flat 302, Royal Residency',
          addressLine2: 'Chhappan Dukan Area',
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '452001',
          isDefault: true,
        }),
      });
      assert.ok([200, 201].includes(res.status));
      const data = await res.json();
      assert.equal(data.success, true);
    });

    it('F. Toggles product in customer wishlist', async () => {
      assert.ok(sampleProduct);
      const productId = sampleProduct._id || sampleProduct.id;
      const res = await fetch(`${BASE_URL}/api/customer/wishlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ productId }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
    });

    it('G. Places a Cash on Delivery (COD) order with Idempotency Key', async () => {
      assert.ok(sampleProduct);
      const variant = (sampleProduct.options && sampleProduct.options[0]) || (sampleProduct.variants && sampleProduct.variants[0]);

      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          items: [
            {
              productId: sampleProduct._id || sampleProduct.id,
              variantId: variant.id || variant._id,
              quantity: 1,
            },
          ],
          shippingAddress: {
            name: 'Anjali Sharma',
            phone: '9826022222',
            addressLine1: 'Flat 302, Royal Residency',
            city: 'Indore',
            state: 'Madhya Pradesh',
            pincode: '452001',
          },
          paymentMethod: 'cod',
          idempotencyKey,
        }),
      });

      assert.ok([200, 201].includes(res.status));
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.order.orderNumber.startsWith('MN-'));
      placedOrderNumber = data.order.orderNumber;
      if (placedOrderNumber) tracker.orderNumbers.push(placedOrderNumber);
    });

    it('H. Duplicate replay on identical idempotency key', async () => {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          items: [{ productId: 'any', variantId: 'any', quantity: 1 }],
          shippingAddress: {
            name: 'Anjali Sharma',
            phone: '9826022222',
            addressLine1: 'Flat 302, Royal Residency',
            city: 'Indore',
            state: 'Madhya Pradesh',
            pincode: '452001',
          },
          paymentMethod: 'cod',
          idempotencyKey,
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.isDuplicateReplay, true);
      assert.equal(data.order.orderNumber, placedOrderNumber);
    });

    it('I. Retrieves placed order in customer order history', async () => {
      const res = await fetch(`${BASE_URL}/api/customer/orders`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.orders));
      assert.ok(data.orders.some((o: any) => o.orderNumber === placedOrderNumber));
    });
  });

  // =========================================================================
  // 8. ADMIN OPERATIONS & DASHBOARD (Protected by requireAdmin)
  // =========================================================================
  describe('8. Administrative Portal Endpoints & Operations', () => {
    // Derive run-unique test admin email to guarantee zero cross-run collision and zero pollution
    const adminEmail = tracker.getTestAdminEmail();
    const adminPassword = (process.env.TEST_ADMIN_PASSWORD || '').trim();

    before(async () => {
      if (!adminPassword) {
        throw new Error(
          'CRITICAL CONFIGURATION ERROR: Full-system E2E admin testing requires dedicated TEST_ADMIN_PASSWORD in environment. Fallback to ADMIN_PASSWORD or hardcoded passwords is strictly prohibited.'
        );
      }

      // 1. Connect to isolated test database to provision run-scoped test super_admin fixture
      const effectiveDb = assertSafeTestDatabaseEnvironment();
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_TEST_URI!, {
          dbName: effectiveDb,
          serverSelectionTimeoutMS: 5000,
        });
      }

      const hashedPassword = await hashPassword(adminPassword);
      const insertRes = await mongoose.connection.collection('users').insertOne({
        name: 'Super Admin Test Fixture',
        email: adminEmail,
        phone: '9826000000',
        password: hashedPassword,
        role: 'super_admin',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const adminId = insertRes.insertedId.toString();
      if (adminId) tracker.userIds.push(adminId);

      // 2. Authenticate through the live server's official /api/auth/admin/login endpoint
      const loginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      });

      assert.equal(loginRes.status, 200, `Admin login endpoint must return HTTP 200, got ${loginRes.status}`);
      const loginData = await loginRes.json();
      assert.equal(loginData.success, true, 'Admin login response must indicate success');
      superAdminToken = loginData.token;
      const authenticatedRole = loginData.user?.role;

      // 3. Verify the authenticated session is valid and possesses super_admin role before running admin operations
      assert.ok(superAdminToken, 'Super admin authentication failed: session token not obtained');
      assert.equal(
        authenticatedRole,
        'super_admin',
        `Authenticated admin fixture must possess "super_admin" role, got "${authenticatedRole}"`
      );
    });

    it('GET /api/admin/dashboard/stats aggregates live metrics', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.metrics);
      assert.ok(typeof data.metrics.totalOrders === 'number');
      assert.ok(typeof data.metrics.totalProducts === 'number');
    });

    it('GET /api/admin/orders lists store orders', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.orders));
    });

    it('GET /api/admin/products lists all products for editing', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/products`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.products));
    });

    let createdProductId = '';

    it('POST /api/admin/products creates a new product', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          name: 'Automated Test Mathri',
          slug: `automated-test-mathri-${Date.now()}`,
          category: sampleCategory?._id || sampleCategory?.slug || 'traditional-namkeen',
          description: 'Crunchy artisanal mathri crafted during automated verification.',
          shortDescription: 'Fresh test mathri',
          ingredients: ['Wheat Flour', 'Pure Groundnut Oil', 'Ajwain'],
          variants: [
            { label: '250g', weight: '250g', price: 120, stock: 50 },
            { label: '500g', weight: '500g', price: 230, stock: 50 },
          ],
          active: true,
        }),
      });

      assert.ok([200, 201].includes(res.status));
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.product);
      createdProductId = data.product._id || data.product.id;
      if (createdProductId) tracker.productIds.push(createdProductId);
    });

    it('DELETE /api/admin/products/:id deletes the created test product', async () => {
      assert.ok(createdProductId, 'Skipping deletion: createdProductId was not set because product creation failed');
      const res = await fetch(`${BASE_URL}/api/admin/products/${createdProductId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
    });

    it('GET /api/admin/categories lists administrative categories', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/categories`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.categories));
    });

    it('GET /api/admin/discounts lists discount coupons', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/discounts`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.discounts));
    });

    it('GET /api/admin/inquiries lists customer inquiries', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/inquiries`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.inquiries));
    });

    it('GET /api/admin/settings fetches admin configuration', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.settings);
    });

    it('GET /api/admin/banners lists banners management table', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/banners`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.banners));
    });

    it('GET /api/admin/staff lists staff members (Super Admin only)', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/staff`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.staff));
    });
  });

  // =========================================================================
  // 9. SECURITY & BOUNDARY DEFENSE
  // =========================================================================
  describe('9. Security Boundaries & Authorization Hardening', () => {
    it('Blocks unauthenticated calls to /api/admin/dashboard/stats with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/dashboard/stats`);
      assert.equal(res.status, 401);
    });

    it('Blocks standard customer role from /api/admin/staff with 403', async () => {
      const customerToken = jwt.sign(
        { userId: '123', email: 'test@customer.com', role: 'customer' },
        JWT_SECRET
      );
      const res = await fetch(`${BASE_URL}/api/admin/staff`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.status, 403);
    });

    it('Response includes nosniff security header', async () => {
      const res = await fetch(`${BASE_URL}/api/health`);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    });
  });

});
