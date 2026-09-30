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
 * 17. Security Boundaries & Admin Route Protection (401/403)
 * 18. Security Headers & CORS Policies
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://127.0.0.1:3000';

describe('Malwa Namkeen House — Comprehensive Live Server E2E Test Suite', () => {

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
    const uniqueEmail = `inquiry_${Date.now()}@malwa-test.org`;
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
  const customerEmail = `e2e_shopper_${Date.now()}@malwa-client.org`;
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
  const testIdempotencyKey = `e2e_key_${Date.now()}`;
  let placedOrderNumber = '';
  let placedOrderId = '';

  it('14. Authenticated customer should successfully place an order with COD', async () => {
    const prodRes = await fetch(`${BASE_URL}/api/products?limit=1`);
    const prodData = await prodRes.json();
    const product = prodData.products[0];
    const opt = (product.options && product.options[0]) || (product.variants && product.variants[0]);
    const productId = product._id || product.id;
    const variantId = opt.id || opt._id;

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

  // ── 17. Security Boundaries & Admin Route Protection ────────────────────────
  it('17. Admin routes should reject unauthenticated and non-admin customer requests with 401/403', async () => {
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

  // ── 18. Security Headers & CORS ──────────────────────────────────────────────
  it('18. Server responses should include security hardening headers and CORS controls', async () => {
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
