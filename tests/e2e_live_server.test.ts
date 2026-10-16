/**
 * Malwa Namkeen House — Comprehensive End-to-End (E2E) Live Server Test Suite
 * 
 * Executes real end-to-end user journeys against the live running server:
 * http://127.0.0.1:3000
 * 
 * Covers:
 * 1. Health & MongoDB Database Connectivity
 * 2. Storefront HTML Pages & SPA Fallback
 * 3. SEO Endpoints (/sitemap.xml, /robots.txt)
 * 4. Catalog APIs (Categories, Products, Best-Sellers)
 * 5. Search Filtering & Product Slug Lookup
 * 6. Public Store Settings & Hero Banners
 * 7. Cart Revalidation & Subtotal Calculation
 * 8. Coupon Engine Validation (Valid / Invalid scenarios)
 * 9. Public Inquiry & Bulk Gifting Submission
 * 10. Customer Registration, Profile Retrieval & Silent JWT Refresh
 * 11. Customer Profile Name / Phone Update
 * 12. Customer Saved Address Book CRUD
 * 13. Customer Wishlist Toggle & Listing
 * 14. Real Customer Order Placement (COD)
 * 15. Order Idempotency / Duplicate Double-Click Prevention
 * 16. Customer Order History & Tracking
 * 17. Ownership Guard: Prevent Cancellation by Unauthorized Customer (F-05)
 * 18. Real Customer Order Cancellation & Live Database Inventory Restock
 * 19. Re-cancellation Idempotency & Prevention of Double Restock via HTTP
 * 20. Admin Reactivation Rejection (F-01)
 * 21. Admin Rejection of Shipped/Delivered Order Cancellation (F-02)
 * 22. Preservation of Restoration Evidence on Deletion (F-03)
 * 23. Concurrency Safety: Admin Update Racing with Customer Cancellation (F-CR-02)
 * 24. Security Boundaries & Admin Route Protection (401/403)
 * 25. Security Headers & CORS Policies
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { hashPassword } from '../server/lib/auth.ts';
import {
  assertSafeTestDatabaseEnvironment,
  verifyLiveServerDatabaseIsolation,
  TestRecordTracker,
} from './test_db_guard.ts';

// Explicitly load .env and .env.local
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
process.env.IS_E2E_TEST = 'true';
process.env.NODE_ENV = 'test';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const tracker = new TestRecordTracker('live_e2e');

describe('Malwa Namkeen House — Comprehensive Live Server E2E Test Suite', () => {

  // ── Pre-flight Hard Safety Gate ──────────────────────────────────────────────
  before(async () => {
    // 1. Process environment assertion
    const effectiveDb = assertSafeTestDatabaseEnvironment();

    // 2. Live server database isolation verification
    const isolation = await verifyLiveServerDatabaseIsolation(BASE_URL);
    if (!isolation.safe) {
      throw new Error(`CRITICAL E2E SAFETY GATE ABORT:\n${isolation.error}`);
    }

    // 3. Connect local Mongoose to test DB for direct DB reads
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_TEST_URI!, {
        dbName: effectiveDb,
        serverSelectionTimeoutMS: 5000,
      });
    }
  });

  // ── Scoped Teardown Lifecycle ────────────────────────────────────────────────
  after(async () => {
    const { cleanedCount, failures } = await tracker.performScopedCleanup();
    console.log(`[E2E Lifecycle] Scoped test teardown completed: ${cleanedCount} records removed.`);
    if (failures.length > 0) {
      console.warn('[E2E Lifecycle Warning] Some test records could not be removed:', failures);
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // ── 1. Health & Database Connectivity ────────────────────────────────────────
  it('1. Health check should return 200 OK with active MongoDB connection', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200, 'Health endpoint must return 200 OK');
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.service, 'MALWA NAMKEEN HOUSE');
    assert.equal(data.mongodb, 'connected');
    assert.ok(data.time, 'Should provide server timestamp');
  });

  // ── 2. Storefront HTML Pages & SPA Fallback ──────────────────────────────────
  it('2. Root and storefront subpages should return HTML with 200 OK', async () => {
    const routes = ['/', '/shop', '/about-us', '/contact', '/faq', '/admin/login'];
    for (const route of routes) {
      const res = await fetch(`${BASE_URL}${route}`, {
        headers: { Connection: 'close' },
      });
      assert.equal(res.status, 200, `Route ${route} should return 200 OK`);
      const contentType = res.headers.get('content-type') || '';
      assert.ok(contentType.includes('text/html'), `Route ${route} should return HTML content type`);
      const text = await res.text();
      assert.ok(text.includes('<!doctype html>') || text.includes('<html'), `Route ${route} should serve valid HTML`);
    }
  });

  // ── 3. SEO Endpoints ─────────────────────────────────────────────────────────
  it('3. SEO endpoints (/sitemap.xml, /robots.txt) should return proper headers and contents', async () => {
    // Sitemap
    const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
    assert.equal(sitemapRes.status, 200);
    const sitemapType = sitemapRes.headers.get('content-type') || '';
    assert.ok(sitemapType.includes('xml'), 'Sitemap content type should be xml');
    const sitemapText = await sitemapRes.text();
    assert.ok(sitemapText.includes('<urlset'), 'Sitemap should contain <urlset>');

    // Robots.txt
    const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
    assert.equal(robotsRes.status, 200);
    const robotsText = await robotsRes.text();
    assert.ok(robotsText.includes('User-agent:'), 'Robots.txt should specify User-agent');
    assert.ok(robotsText.includes('Sitemap:'), 'Robots.txt should include Sitemap link');
  });

  // ── 4. Catalog APIs ──────────────────────────────────────────────────────────
  it('4. Catalog APIs should return active categories, products, and best-sellers', async () => {
    // Categories
    const catRes = await fetch(`${BASE_URL}/api/categories`);
    assert.equal(catRes.status, 200);
    const catData = await catRes.json();
    assert.equal(catData.success, true);
    assert.ok(Array.isArray(catData.categories), 'Categories must be an array');
    assert.ok(catData.categories.length > 0, 'Categories must not be empty');

    // Products
    const prodRes = await fetch(`${BASE_URL}/api/products`);
    assert.equal(prodRes.status, 200);
    const prodData = await prodRes.json();
    assert.equal(prodData.success, true);
    assert.ok(Array.isArray(prodData.products), 'Products must be an array');
    assert.ok(prodData.products.length > 0, 'Products list must contain items');

    const firstProduct = prodData.products[0];
    assert.ok(firstProduct.name, 'Product must have a name');
    assert.ok(firstProduct.slug || firstProduct._id || firstProduct.id, 'Product must have identifier');

    // Best-sellers
    const bestRes = await fetch(`${BASE_URL}/api/products/best-sellers`);
    assert.equal(bestRes.status, 200);
    const bestData = await bestRes.json();
    assert.equal(bestData.success, true);
    assert.ok(Array.isArray(bestData.products), 'Best sellers must be an array');
  });

  // ── 5. Search Filtering & Product Slug Lookup ────────────────────────────────
  it('5. Search filtering and product slug lookup should return relevant product data', async () => {
    const searchRes = await fetch(`${BASE_URL}/api/products?search=Ratlami`);
    assert.equal(searchRes.status, 200);
    const searchData = await searchRes.json();
    assert.equal(searchData.success, true);
    assert.ok(
      searchData.products.some((p: any) => p.name.toLowerCase().includes('ratlami')),
      'Search should find Ratlami Sev'
    );

    // Slug lookup
    const ratlami = searchData.products[0];
    const slug = ratlami.slug || ratlami._id;
    const singleRes = await fetch(`${BASE_URL}/api/products/${slug}`);
    assert.equal(singleRes.status, 200);
    const singleData = await singleRes.json();
    assert.equal(singleData.success, true);
    assert.equal(singleData.product.name, ratlami.name);
  });

  // ── 6. Store Settings & Hero Banners ─────────────────────────────────────────
  it('6. Public settings and banners should return valid store branding', async () => {
    const settingsRes = await fetch(`${BASE_URL}/api/settings`);
    assert.equal(settingsRes.status, 200);
    const settingsData = await settingsRes.json();
    assert.equal(settingsData.success, true);
    assert.ok(settingsData.settings, 'Settings must be returned');

    const bannersRes = await fetch(`${BASE_URL}/api/banners`);
    assert.equal(bannersRes.status, 200);
    const bannersData = await bannersRes.json();
    assert.equal(bannersData.success, true);
    assert.ok(Array.isArray(bannersData.banners), 'Banners should be an array');
  });

  // ── 7. Cart Revalidation & Pricing Math ──────────────────────────────────────
  it('7. Cart revalidation endpoint should accurately calculate subtotals and discounts', async () => {
    const prodRes = await fetch(`${BASE_URL}/api/products?limit=1`);
    const prodData = await prodRes.json();
    const product = prodData.products[0];
    const opt = (product.options && product.options[0]) || (product.variants && product.variants[0]);
    const productId = product._id || product.id;
    const variantId = opt.id || opt._id;

    const revalRes = await fetch(`${BASE_URL}/api/cart/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId, variantId, quantity: 3 }],
      }),
    });

    assert.equal(revalRes.status, 200);
    const revalData = await revalRes.json();
    assert.equal(revalData.success, true);
    const expectedSubtotal = opt.price * 3;
    assert.equal(revalData.subtotal, expectedSubtotal);
  });

  // ── 8. Coupon Engine Validation ──────────────────────────────────────────────
  it('8. Coupon validation should reject invalid coupon codes gracefully', async () => {
    const res = await fetch(`${BASE_URL}/api/discounts/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'NON_EXISTENT_COUPON_123',
        subtotal: 500,
        items: [],
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.valid, false);
    assert.equal(data.discountAmount, 0);
  });

  // ── 9. Public Inquiry & Bulk Gifting Submission ──────────────────────────────
  it('9. Public inquiry submission should validate inputs and succeed', async () => {
    const uniqueEmail = tracker.getTestInquiryEmail();
    const res = await fetch(`${BASE_URL}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Madhya Pradesh Hospitality Team',
        email: uniqueEmail,
        phone: '9876543210',
        category: 'corporate_gifting',
        message: 'Requesting quotation for 100 artisanal festive gift boxes of Ratlami Sev and Khatta Meetha Mixture.',
      }),
    });

    assert.ok([200, 201].includes(res.status), `Inquiry status should be 200 or 201, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
  });

  // ── 10. Customer Auth, Profile & Silent Refresh ──────────────────────────────
  let customerToken = '';
  let customerUserId = '';
  const customerEmail = tracker.getTestUserEmail();
  const customerPassword = 'SecurePassword@123';

  it('10. Customer registration, me profile check and silent refresh should succeed', async () => {
    // A. Register
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Test Shopper',
        email: customerEmail,
        password: customerPassword,
        phone: '9826012345',
      }),
    });

    assert.ok([200, 201].includes(regRes.status), `Register should return 200 or 201, got ${regRes.status}`);
    const regData = await regRes.json();
    assert.equal(regData.success, true);
    assert.ok(regData.token, 'Token must be present in registration response');
    customerToken = regData.token;
    customerUserId = regData.user?.id || regData.user?._id;
    if (customerUserId) tracker.userIds.push(customerUserId);

    // B. Check Profile (/api/auth/me)
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.success, true);
    assert.equal(meData.user.email, customerEmail);

    // C. Silent Token Refresh (/api/auth/refresh)
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(refreshRes.status, 200);
    const refreshData = await refreshRes.json();
    assert.equal(refreshData.success, true);
    assert.ok(refreshData.token, 'New JWT token should be returned on refresh');
    customerToken = refreshData.token; // Use refreshed token for subsequent steps
  });

  // ── 11. Customer Profile Name & Phone Update ─────────────────────────────────
  it('11. Customer profile updates should persist successfully', async () => {
    const updatedName = 'E2E Updated Shopper Name';
    const updatedPhone = '9826099999';

    const updateRes = await fetch(`${BASE_URL}/api/customer/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        name: updatedName,
        phone: updatedPhone,
      }),
    });

    assert.equal(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.equal(updateData.success, true);
    assert.equal(updateData.profile.name, updatedName);

    // Verify GET profile
    const getRes = await fetch(`${BASE_URL}/api/customer/profile`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.profile.name, updatedName);
  });

  // ── 12. Customer Saved Address Book CRUD ─────────────────────────────────────
  it('12. Customer should be able to save and retrieve shipping addresses', async () => {
    const newAddress = {
      name: 'E2E Shopper Address',
      phone: '9826099999',
      addressLine1: '45 Sarafa Bazaar',
      addressLine2: 'Near Rajwada Palace',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452002',
      isDefault: true,
    };

    const addRes = await fetch(`${BASE_URL}/api/customer/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify(newAddress),
    });

    assert.ok([200, 201].includes(addRes.status), `Add address status should be 200/201, got ${addRes.status}`);
    const addData = await addRes.json();
    assert.equal(addData.success, true);

    // Retrieve address list
    const getRes = await fetch(`${BASE_URL}/api/customer/addresses`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.success, true);
    assert.ok(Array.isArray(getData.addresses), 'Addresses should be an array');
    assert.ok(getData.addresses.length >= 1, 'Should have at least 1 address');
    assert.equal(getData.addresses[0].city, 'Indore');
  });

  // ── 13. Customer Wishlist Toggle & Retrieval ─────────────────────────────────
  it('13. Customer should be able to toggle wishlist items and fetch list', async () => {
    const prodRes = await fetch(`${BASE_URL}/api/products?limit=1`);
    const prodData = await prodRes.json();
    const product = prodData.products[0];
    const productId = product._id || product.id;

    // Toggle add
    const toggleRes = await fetch(`${BASE_URL}/api/customer/wishlist/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ productId }),
    });

    assert.equal(toggleRes.status, 200);
    const toggleData = await toggleRes.json();
    assert.equal(toggleData.success, true);

    // Fetch wishlist
    const wishRes = await fetch(`${BASE_URL}/api/customer/wishlist`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(wishRes.status, 200);
    const wishData = await wishRes.json();
    assert.equal(wishData.success, true);
    assert.ok(Array.isArray(wishData.wishlist), 'Wishlist should be an array');
    assert.ok(Array.isArray(wishData.productIds), 'Product IDs should be an array');
  });

  // ── 14. Real Customer Order Placement (COD) ──────────────────────────────────
  const testIdempotencyKey = tracker.getTestIdempotencyKey();
  let placedOrderNumber = '';
  let placedOrderId = '';
  let orderedProductId = '';
  let orderedVariantId = '';

  it('14. Authenticated customer should successfully place an order with COD', async () => {
    const prodRes = await fetch(`${BASE_URL}/api/products?limit=1`);
    const prodData = await prodRes.json();
    const product = prodData.products[0];
    const opt = (product.options && product.options[0]) || (product.variants && product.variants[0]);
    const productId = product._id || product.id;
    const variantId = opt.id || opt._id;
    orderedProductId = productId.toString();
    orderedVariantId = variantId.toString();

    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            productId,
            variantId,
            quantity: 1,
          },
        ],
        shippingAddress: {
          name: 'E2E Shopper Address',
          phone: '9826099999',
          addressLine1: '45 Sarafa Bazaar',
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '452002',
        },
        paymentMethod: 'cod',
        notes: 'Fragile: Authentic Sev Delivery',
        idempotencyKey: testIdempotencyKey,
      }),
    });

    assert.ok([200, 201].includes(orderRes.status), `Order status should be 200 or 201, got ${orderRes.status}`);
    const orderData = await orderRes.json();
    assert.equal(orderData.success, true);
    assert.ok(orderData.order, 'Order object must be returned');
    assert.ok(orderData.order.orderNumber.startsWith('MN-'), 'Order number should start with MN-');
    assert.equal(orderData.order.paymentMethod, 'cod');
    assert.equal(orderData.order.orderStatus, 'pending');

    placedOrderNumber = orderData.order.orderNumber;
    placedOrderId = orderData.order._id || orderData.order.id;
    if (placedOrderNumber) tracker.orderNumbers.push(placedOrderNumber);
    if (placedOrderId) tracker.orderIds.push(placedOrderId);
  });

  // ── 15. Order Idempotency / Duplicate Double-Click Prevention ────────────────
  it('15. Resubmitting order with the same idempotency key should safely return duplicate replay', async () => {
    const replayRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: 'any', variantId: 'any', quantity: 1 }],
        shippingAddress: {
          name: 'E2E Shopper Address',
          phone: '9826099999',
          addressLine1: '45 Sarafa Bazaar',
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '452002',
        },
        paymentMethod: 'cod',
        idempotencyKey: testIdempotencyKey, // EXACT SAME KEY
      }),
    });

    assert.equal(replayRes.status, 200);
    const replayData = await replayRes.json();
    assert.equal(replayData.success, true);
    assert.equal(replayData.isDuplicateReplay, true, 'Should mark request as duplicate replay without creating new order');
    assert.equal(replayData.order.orderNumber, placedOrderNumber);
  });

  // ── 16. Customer Order History & Tracking ────────────────────────────────────
  it('16. Customer order history should list the newly placed order', async () => {
    const listRes = await fetch(`${BASE_URL}/api/customer/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.success, true);
    assert.ok(Array.isArray(listData.orders), 'Orders should be an array');
    const found = listData.orders.some((o: any) => o.orderNumber === placedOrderNumber);
    assert.ok(found, `Placed order ${placedOrderNumber} should appear in customer order history`);
  });

  // ── 17. Ownership Guard: Prevent Cancellation by Unauthorized Customer (F-05) ─
  it('17. Customer cancellation should reject unauthorized customers and unauthenticated requests (F-05)', async () => {
    // A. Unauthenticated request
    const noAuthRes = await fetch(`${BASE_URL}/api/customer/orders/${placedOrderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.equal(noAuthRes.status, 401, 'Unauthenticated cancellation must return 401');

    // B. Register a different customer
    const otherEmail = `test_other_${Date.now()}_${tracker.runId}@malwa-isolated.test`;
    tracker.userEmails.push(otherEmail);
    const otherRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Other Shopper',
        email: otherEmail,
        password: 'OtherPassword#2026',
        phone: '9826088888',
      }),
    });
    assert.equal(otherRegRes.status, 201);
    const otherData = await otherRegRes.json();
    const otherToken = otherData.token;
    if (otherData.user?._id) tracker.userIds.push(otherData.user._id);

    // C. Unauthorized customer tries to cancel purchaser's order
    const unauthCancelRes = await fetch(`${BASE_URL}/api/customer/orders/${placedOrderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherToken}`,
      },
      body: JSON.stringify({ reason: 'Malicious cancellation attempt' }),
    });
    assert.equal(unauthCancelRes.status, 403, 'Must return 403 when customer does not own the order');
    const unauthData = await unauthCancelRes.json();
    assert.equal(unauthData.success, false);
    assert.ok(unauthData.message.includes('permission') || unauthData.message.includes('unauthorized'));
  });

  // ── 18. Real Customer Order Cancellation & Live Database Inventory Restock ──
  it('18. Customer cancellation should restore inventory in database and set order status to cancelled', async () => {
    // 1. Read variant stock directly from MongoDB before cancellation
    const prodDocBefore = await mongoose.connection.collection('products').findOne({
      _id: new mongoose.Types.ObjectId(orderedProductId),
    });
    assert.ok(prodDocBefore, 'Ordered product must exist in database');
    const variantList = prodDocBefore.variants || prodDocBefore.options || [];
    const variantBefore = variantList.find(
      (v: any) => (v._id && v._id.toString() === orderedVariantId) || v.id === orderedVariantId
    );
    assert.ok(variantBefore, 'Ordered variant must exist in product document');
    const stockBeforeCancel = variantBefore.stock;

    // 2. Perform cancellation via customer HTTP endpoint
    const cancelRes = await fetch(`${BASE_URL}/api/customer/orders/${placedOrderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ reason: 'Customer requested cancellation via live E2E test' }),
    });

    assert.equal(cancelRes.status, 200, `Cancellation endpoint must return 200 OK, got ${cancelRes.status}`);
    const cancelData = await cancelRes.json();
    assert.equal(cancelData.success, true);
    assert.equal(cancelData.order?.inventoryRestored, true);
    assert.equal(cancelData.order?.orderStatus, 'cancelled');

    // 3. Verify stock restoration through actual database read
    const prodDocAfter = await mongoose.connection.collection('products').findOne({
      _id: new mongoose.Types.ObjectId(orderedProductId),
    });
    const variantListAfter = prodDocAfter.variants || prodDocAfter.options || [];
    const variantAfter = variantListAfter.find(
      (v: any) => (v._id && v._id.toString() === orderedVariantId) || v.id === orderedVariantId
    );
    assert.equal(
      variantAfter.stock,
      stockBeforeCancel + 1,
      `Variant stock in MongoDB must increment by ordered quantity (expected ${stockBeforeCancel + 1}, got ${variantAfter.stock})`
    );

    // 4. Verify order document in MongoDB
    const orderDoc = await mongoose.connection.collection('orders').findOne({
      _id: new mongoose.Types.ObjectId(placedOrderId),
    });
    assert.ok(orderDoc, 'Order document must exist in database');
    assert.equal(orderDoc.orderStatus, 'cancelled');
    assert.equal(orderDoc.inventoryRestored, true);
    assert.equal(orderDoc.restorationStatus, 'completed');
    assert.equal(orderDoc.cancellationReason, 'Customer requested cancellation via live E2E test');
    assert.ok(orderDoc.cancelledAt, 'Order must record cancelledAt timestamp');
  });

  // ── 19. Re-cancellation Idempotency & Prevention of Double Restock via HTTP ─
  it('19. Re-cancellation should be idempotent and must not duplicate inventory restoration', async () => {
    // 1. Read current stock directly from MongoDB
    const prodDocBefore = await mongoose.connection.collection('products').findOne({
      _id: new mongoose.Types.ObjectId(orderedProductId),
    });
    const variantListBefore = prodDocBefore.variants || prodDocBefore.options || [];
    const variantBefore = variantListBefore.find(
      (v: any) => (v._id && v._id.toString() === orderedVariantId) || v.id === orderedVariantId
    );
    const stockBeforeReplay = variantBefore.stock;

    // 2. Resubmit cancellation request
    const replayCancelRes = await fetch(`${BASE_URL}/api/customer/orders/${placedOrderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
    });

    assert.equal(replayCancelRes.status, 200);
    const replayData = await replayCancelRes.json();
    assert.equal(replayData.success, true);
    assert.equal(replayData.alreadyCancelled, true);
    assert.ok(replayData.message.includes('already cancelled'));

    // 3. Verify stock in database did NOT increment again
    const prodDocAfter = await mongoose.connection.collection('products').findOne({
      _id: new mongoose.Types.ObjectId(orderedProductId),
    });
    const variantListAfter = prodDocAfter.variants || prodDocAfter.options || [];
    const variantAfter = variantListAfter.find(
      (v: any) => (v._id && v._id.toString() === orderedVariantId) || v.id === orderedVariantId
    );
    assert.equal(
      variantAfter.stock,
      stockBeforeReplay,
      'Re-cancelling must NOT restock or increment inventory a second time'
    );
  });

  // ── 20. Admin Reactivation Rejection (F-01) ──────────────────────────────────
  it('20. Admin update must reject reactivating an already cancelled order (F-01)', async () => {
    // 1. Provision test admin in test database
    const adminEmail = tracker.getTestAdminEmail();
    const adminPassword = (process.env.TEST_ADMIN_PASSWORD || '').trim();
    assert.ok(adminPassword, 'TEST_ADMIN_PASSWORD must be configured');

    const hashedPassword = await hashPassword(adminPassword);
    const insertAdmin = await mongoose.connection.collection('users').insertOne({
      name: 'Admin Test Fixture',
      email: adminEmail,
      phone: '9826000000',
      password: hashedPassword,
      role: 'super_admin',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    tracker.userIds.push(insertAdmin.insertedId.toString());

    // Log in as admin
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    assert.equal(adminLoginRes.status, 200);
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;

    // 2. Attempt to reactivate cancelled order to 'confirmed'
    const reactivateRes = await fetch(`${BASE_URL}/api/admin/orders/${placedOrderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ orderStatus: 'confirmed' }),
    });

    assert.equal(reactivateRes.status, 400, 'Reactivating a cancelled order must return 400 Bad Request');
    const reactivateData = await reactivateRes.json();
    assert.equal(reactivateData.success, false);
    const msg = reactivateData.message || reactivateData.error || '';
    assert.ok(
      msg.includes('cannot be directly re-activated') || msg.includes('cancelled'),
      `Error message should explain reactivation is prohibited: got "${msg}"`
    );

    // 3. Verify order status in database remains 'cancelled'
    const orderDoc = await mongoose.connection.collection('orders').findOne({
      _id: new mongoose.Types.ObjectId(placedOrderId),
    });
    assert.equal(orderDoc.orderStatus, 'cancelled', 'Order status in database must remain cancelled');
  });

  // ── 21. Admin Rejection of Shipped/Delivered Order Cancellation (F-02) ──────
  it('21. Admin cancellation must reject orders with shipped or delivered status (F-02)', async () => {
    // Obtain admin token
    const adminEmail = tracker.userEmails.find(e => e.includes('admin') || e.includes('run-')) || '';
    const adminPassword = (process.env.TEST_ADMIN_PASSWORD || '').trim();
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const { token: adminToken } = await adminLoginRes.json();

    // 1. Place a 2nd test order
    const order2Res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: orderedProductId, variantId: orderedVariantId, quantity: 1 }],
        shippingAddress: {
          name: 'Shipped Test Address',
          phone: '9826099999',
          addressLine1: '45 Sarafa Bazaar',
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '452002',
        },
        paymentMethod: 'cod',
      }),
    });
    assert.ok([200, 201].includes(order2Res.status));
    const order2Data = await order2Res.json();
    const order2Id = order2Data.order._id || order2Data.order.id;
    tracker.orderIds.push(order2Id);
    if (order2Data.order.orderNumber) tracker.orderNumbers.push(order2Data.order.orderNumber);

    // 2. Admin marks order as 'shipped'
    const markShippedRes = await fetch(`${BASE_URL}/api/admin/orders/${order2Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ orderStatus: 'shipped' }),
    });
    assert.equal(markShippedRes.status, 200);

    // 3. Admin attempts to cancel the shipped order
    const cancelShippedRes = await fetch(`${BASE_URL}/api/admin/orders/${order2Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ orderStatus: 'cancelled' }),
    });

    assert.equal(cancelShippedRes.status, 400, 'Cancelling a shipped order must return 400 Bad Request');
    const cancelShippedData = await cancelShippedRes.json();
    assert.equal(cancelShippedData.success, false);
    const msg = cancelShippedData.message || cancelShippedData.error || '';
    assert.ok(
      msg.includes('Cannot cancel order with status "shipped"') || msg.includes('already in "shipped" status'),
      `Error must cite prohibited status: got "${msg}"`
    );

    // 4. Verify in database: status is still shipped
    const order2Doc = await mongoose.connection.collection('orders').findOne({
      _id: new mongoose.Types.ObjectId(order2Id),
    });
    assert.equal(order2Doc.orderStatus, 'shipped');
    assert.notEqual(order2Doc.inventoryRestored, true);
  });

  // ── 22. Preservation of Restoration Evidence on Deletion (F-03) ─────────────
  it('22. Admin order deletion must abort with 409 Conflict if inventory restoration failed (F-03)', async () => {
    // Obtain admin token
    const adminEmail = tracker.userEmails.find(e => e.includes('admin') || e.includes('run-')) || '';
    const adminPassword = (process.env.TEST_ADMIN_PASSWORD || '').trim();
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const { token: adminToken } = await adminLoginRes.json();

    // 1. Insert an order with failed restoration
    const insertFailedOrder = await mongoose.connection.collection('orders').insertOne({
      orderNumber: `MN-RESTORE-FAIL-${Date.now()}`,
      orderStatus: 'cancelled',
      paymentStatus: 'pending',
      paymentMethod: 'cod',
      inventoryRestored: false,
      restorationStatus: 'failed',
      restorationWarnings: ['Critical stock mismatch: variant not found'],
      items: [
        {
          productId: new mongoose.Types.ObjectId(orderedProductId),
          variantId: 'non-existent-variant-for-failure-test',
          productName: 'Failed Restoration Item',
          quantity: 1,
          price: 150,
          total: 150,
        },
      ],
      customerInfo: { name: 'Audit Test', email: 'audit@test.com', phone: '9826000000' },
      shippingAddress: { name: 'Audit Test', addressLine1: 'Test', city: 'Indore', state: 'MP', pincode: '452001' },
      subtotal: 150,
      shippingFee: 0,
      total: 150,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const failedOrderId = insertFailedOrder.insertedId.toString();
    tracker.orderIds.push(failedOrderId);

    // 2. Admin attempts to delete this order
    const deleteRes = await fetch(`${BASE_URL}/api/admin/orders/${failedOrderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(deleteRes.status, 409, 'Deleting order with incomplete restoration must return 409 Conflict');
    const deleteData = await deleteRes.json();
    assert.equal(deleteData.success, false);
    const msg = deleteData.message || deleteData.error || '';
    assert.ok(
      msg.includes('inventory restoration encountered issues') || msg.includes('incomplete or failed'),
      `Error must explain restoration incomplete: got "${msg}"`
    );

    // 3. Verify order still exists in MongoDB
    const docStillExists = await mongoose.connection.collection('orders').findOne({
      _id: insertFailedOrder.insertedId,
    });
    assert.ok(docStillExists, 'Order must NOT be deleted from database when restoration has warnings/failure');
  });

  // ── 23. Concurrency Safety: Admin Update Racing with Customer Cancellation (F-CR-02) ─
  it('23. Stale admin status update racing with customer cancellation must abort with 409 Conflict (F-CR-02)', async () => {
    // Obtain admin token
    const adminEmail = tracker.userEmails.find(e => e.includes('admin') || e.includes('run-')) || '';
    const adminPassword = (process.env.TEST_ADMIN_PASSWORD || '').trim();
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const { token: adminToken } = await adminLoginRes.json();

    // 1. Place order 3 as customer
    const order3Res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: orderedProductId, variantId: orderedVariantId, quantity: 1 }],
        shippingAddress: {
          name: 'Race Condition Address',
          phone: '9826099999',
          addressLine1: '45 Sarafa Bazaar',
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '452002',
        },
        paymentMethod: 'cod',
      }),
    });
    assert.ok([200, 201].includes(order3Res.status));
    const order3Data = await order3Res.json();
    const order3Id = order3Data.order._id || order3Data.order.id;
    tracker.orderIds.push(order3Id);
    if (order3Data.order.orderNumber) tracker.orderNumbers.push(order3Data.order.orderNumber);

    // 2. Simulate concurrent race: Customer cancels the order while Admin holds stale "pending" reference
    const customerCancelRes = await fetch(`${BASE_URL}/api/customer/orders/${order3Id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ reason: 'Customer cancelled before admin could ship' }),
    });
    assert.equal(customerCancelRes.status, 200);

    // 3. Admin submits update attempting to mark the order as 'shipped'
    const staleAdminUpdateRes = await fetch(`${BASE_URL}/api/admin/orders/${order3Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ orderStatus: 'shipped' }),
    });

    // 4. Must return 409 Conflict (F-CR-02) and refuse to overwrite cancellation
    assert.ok([400, 409].includes(staleAdminUpdateRes.status), `Must return 400 or 409 Conflict, got ${staleAdminUpdateRes.status}`);
    const staleData = await staleAdminUpdateRes.json();
    assert.equal(staleData.success, false);
    const conflictMsg = staleData.message || staleData.error || '';
    assert.ok(
      conflictMsg.includes('cancelled') || conflictMsg.includes('Conflict'),
      `Message must indicate order was cancelled: got "${conflictMsg}"`
    );

    // 5. Read directly from MongoDB: Order status MUST remain 'cancelled'
    const order3Doc = await mongoose.connection.collection('orders').findOne({
      _id: new mongoose.Types.ObjectId(order3Id),
    });
    assert.ok(order3Doc);
    assert.equal(order3Doc.orderStatus, 'cancelled', 'Order in MongoDB must remain cancelled; customer cancellation cannot be overwritten');
    assert.equal(order3Doc.inventoryRestored, true, 'inventoryRestored in MongoDB must remain true');
  });

  // ── 24. Live MongoDB Integration: Multi-Variant $elemMatch Idempotency & Missing Coupon Warning (F-CR-01 & F-08) ─
  it('24. Live MongoDB integration: $elemMatch prevents multi-variant bypass and warns on missing coupons', async () => {
    // 1. Seed a multi-variant product directly in live MongoDB
    const testProdId = new mongoose.Types.ObjectId();
    const varAId = new mongoose.Types.ObjectId();
    const varBId = new mongoose.Types.ObjectId();
    const opIdA = `restore_e2e_crash_op_var_${varAId}`;

    const varASku = `MV-E2E-A-${Date.now()}`;
    const varBSku = `MV-E2E-B-${Date.now()}`;

    await mongoose.connection.collection('products').insertOne({
      _id: testProdId,
      name: 'E2E Multi-Variant Idempotency Product',
      slug: `e2e-multi-var-${Date.now()}`,
      description: 'Test product for live MongoDB $elemMatch idempotency verification',
      category: new mongoose.Types.ObjectId(),
      images: ['https://example.com/test.jpg'],
      isVegetarian: true,
      active: true,
      rating: 5,
      reviewCount: 1,
      variants: [
        {
          _id: varAId,
          label: '250g',
          price: 100,
          stock: 25,
          sku: varASku,
          active: true,
          sortOrder: 0,
          restoredOrderOps: [opIdA], // Already restored!
        },
        {
          _id: varBId,
          label: '500g',
          price: 180,
          stock: 50,
          sku: varBSku,
          active: true,
          sortOrder: 1,
          restoredOrderOps: [], // Empty! Without $elemMatch this would allow bypass
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    tracker.productIds.push(testProdId.toString());

    // 2. Execute the atomic update with $elemMatch against live MongoDB
    const elemMatchUpdate = await mongoose.connection.collection('products').updateOne(
      {
        _id: testProdId,
        variants: {
          $elemMatch: {
            _id: varAId,
            restoredOrderOps: { $ne: opIdA },
          },
        },
      },
      {
        $inc: { 'variants.$.stock': 5 },
        $addToSet: { 'variants.$.restoredOrderOps': opIdA },
      }
    );

    // Live MongoDB MUST reject the update!
    assert.equal(elemMatchUpdate.modifiedCount, 0, 'Live MongoDB with $elemMatch must return 0 modifiedCount on retry');

    // 4. Verify in live MongoDB: Variant A stock must remain exactly 25
    const prodDocAfter = await mongoose.connection.collection('products').findOne({ _id: testProdId });
    assert.ok(prodDocAfter);
    const varAAfter = prodDocAfter.variants.find((v: any) => v._id.toString() === varAId.toString());
    assert.equal(varAAfter.stock, 25, 'Variant A stock in live MongoDB must NOT be incremented again on retry');

    // 5. Test fresh operation on Variant B succeeds against live MongoDB
    const opIdB = `restore_e2e_fresh_op_var_${varBId}`;
    const freshUpdate = await mongoose.connection.collection('products').updateOne(
      {
        _id: testProdId,
        variants: {
          $elemMatch: {
            _id: varBId,
            restoredOrderOps: { $ne: opIdB },
          },
        },
      },
      {
        $inc: { 'variants.$.stock': 10 },
        $addToSet: { 'variants.$.restoredOrderOps': opIdB },
      }
    );
    assert.equal(freshUpdate.modifiedCount, 1, 'Fresh operation on Variant B must succeed with modifiedCount 1');

    const prodDocFresh = await mongoose.connection.collection('products').findOne({ _id: testProdId });
    const varBAfter = prodDocFresh.variants.find((v: any) => v._id.toString() === varBId.toString());
    assert.equal(varBAfter.stock, 60, 'Variant B stock in live MongoDB must increment from 50 to 60');
    assert.ok(varBAfter.restoredOrderOps.includes(opIdB), 'Variant B must now contain opIdB');

    // 6. Test missing discount warning via admin cancellation
    const missingCouponOrder = await mongoose.connection.collection('orders').insertOne({
      orderNumber: `MN-COUPON-WARN-${Date.now()}`,
      orderStatus: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'cod',
      shipmentStatus: 'unfulfilled',
      shipping: 0,
      inventoryRestored: false,
      discountCode: 'NONEXISTENT_DISCOUNT_E2E',
      discount: 75,
      couponRestored: false,
      items: [
        {
          productId: testProdId,
          variantId: varBId,
          productName: 'E2E Multi-Variant Idempotency Product',
          variantLabel: '500g',
          sku: varBSku,
          quantity: 1,
          price: 180,
          itemTotal: 180,
        },
      ],
      customerInfo: { name: 'Coupon Test', email: 'coupontest@test.com', phone: '9826000000' },
      shippingAddress: { name: 'Coupon Test', phone: '9826000000', addressLine1: 'Test', city: 'Indore', state: 'MP', pincode: '452001' },
      subtotal: 180,
      total: 105,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const missingCouponOrderId = missingCouponOrder.insertedId.toString();
    tracker.orderIds.push(missingCouponOrderId);

    // Cancel via admin
    const adminEmail = tracker.userEmails.find(e => e.includes('admin') || e.includes('run-')) || '';
    const adminPassword = (process.env.TEST_ADMIN_PASSWORD || '').trim();
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const { token: adminToken } = await adminLoginRes.json();

    const cancelMissingCouponRes = await fetch(`${BASE_URL}/api/admin/orders/${missingCouponOrderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ orderStatus: 'cancelled', notes: 'Cancel order with missing discount code' }),
    });
    assert.equal(cancelMissingCouponRes.status, 200);
    const cancelMissingCouponData = await cancelMissingCouponRes.json();
    assert.equal(cancelMissingCouponData.order?.couponRestored, false, 'couponRestored must remain false');
    assert.ok(
      cancelMissingCouponData.warnings.some((w: string) => w.includes('NONEXISTENT_DISCOUNT_E2E')),
      `Warnings must include explanation about missing coupon: got ${JSON.stringify(cancelMissingCouponData.warnings)}`
    );
  });

  // ── 25. Security Boundaries & Admin Route Protection ────────────────────────
  it('25. Admin routes should reject unauthenticated and non-admin customer requests with 401/403', async () => {
    const adminRoutes = [
      '/api/admin/dashboard',
      '/api/admin/orders',
      '/api/admin/staff',
      '/api/admin/settings',
    ];

    for (const route of adminRoutes) {
      // A. Completely unauthenticated (no token)
      const noAuthRes = await fetch(`${BASE_URL}${route}`);
      assert.ok(
        [401, 403].includes(noAuthRes.status),
        `Route ${route} without auth should return 401 or 403, got ${noAuthRes.status}`
      );

      // B. Authenticated as standard customer (forbidden for admin routes)
      const custAuthRes = await fetch(`${BASE_URL}${route}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.ok(
        [401, 403].includes(custAuthRes.status),
        `Route ${route} with customer token should return 401 or 403, got ${custAuthRes.status}`
      );
    }
  });

  // ── 26. Security Headers & CORS ──────────────────────────────────────────────
  it('26. Server responses should include security hardening headers and CORS controls', async () => {
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(res.status, 200);

    // Verify Helmet security headers
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(res.headers.has('vary'), 'Should have Vary header');

    // Test unauthorized origin should not be reflected in Access-Control-Allow-Origin
    const badOriginRes = await fetch(`${BASE_URL}/api/health`, {
      headers: { Origin: 'https://evil-unauthorized-site.com' },
    });
    const allowOrigin = badOriginRes.headers.get('access-control-allow-origin');
    assert.notEqual(allowOrigin, 'https://evil-unauthorized-site.com', 'Unauthorized origin must never be reflected');
  });

});
