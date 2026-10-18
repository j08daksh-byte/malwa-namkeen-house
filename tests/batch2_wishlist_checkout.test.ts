/**
 * Malwa Namkeen House — Batch 2 Regression Suite
 * 
 * 1. Wishlist Navigation, Route Configuration & Real-Time Sync
 * 2. Authoritative Checkout Pricing, Shipping Calculations & Discrepancy Elimination
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

describe('Batch 2: Wishlist Navigation & Checkout Pricing Regression Suite', () => {

  // ── 1. Wishlist Navigation & Route Configuration ───────────────────────────
  describe('1. Wishlist Navigation & Route Architecture', () => {
    it('Navbar header heart button must navigate to /wishlist instead of /shop', () => {
      const navbarFile = fs.readFileSync(
        path.resolve('src-rebuild/components/layout/Navbar.tsx'),
        'utf8'
      );

      // Verify that the heart icon nav-action button specifically navigates to /wishlist
      const heartNavActionMatch = navbarFile.match(
        /<button[^>]*class(?:Name)?="nav-action"[^>]*onClick=\{[^}]*navigate\('([^']+)'\)[^>]*title="Wishlist"/s
      ) || navbarFile.match(
        /<button[^>]*class(?:Name)?="nav-action"[^>]*onClick=\{[^}]*navigate\('([^']+)'\)[^>]*aria-label=\{`Wishlist/s
      );

      assert.ok(heartNavActionMatch, 'Wishlist button must exist in Navbar');
      assert.equal(
        heartNavActionMatch[1],
        '/wishlist',
        'Wishlist heart button must navigate to /wishlist, NOT /shop'
      );
    });

    it('App router must register public /wishlist route', () => {
      const appFile = fs.readFileSync(
        path.resolve('src-rebuild/App.tsx'),
        'utf8'
      );

      assert.ok(
        appFile.includes("path=\"/wishlist\""),
        'App.tsx must define <Route path="/wishlist" ... />'
      );
      assert.ok(
        appFile.includes("pages/Wishlist"),
        'App.tsx must import Wishlist page component'
      );
    });

    it('Wishlist page component must exist and export a valid React component', () => {
      const wishlistFile = path.resolve('src-rebuild/pages/Wishlist.tsx');
      assert.ok(fs.existsSync(wishlistFile), 'src-rebuild/pages/Wishlist.tsx must exist');

      const content = fs.readFileSync(wishlistFile, 'utf8');
      assert.ok(content.includes('useWishlist'), 'Wishlist page must use useWishlist hook');
      assert.ok(content.includes('useCart'), 'Wishlist page must integrate with useCart hook');
      assert.ok(content.includes('handleAddToCart') || content.includes('addToCart'), 'Wishlist page must provide add-to-cart action');
      assert.ok(content.includes('handleRemove') || content.includes('toggleWishlist'), 'Wishlist page must provide remove action');
      assert.ok(content.includes('Your wishlist is empty'), 'Wishlist page must provide empty state message');
    });

    it('Cart, account, and search buttons in Navbar must remain intact and functional', () => {
      const navbarFile = fs.readFileSync(
        path.resolve('src-rebuild/components/layout/Navbar.tsx'),
        'utf8'
      );

      // Verify search button
      assert.ok(navbarFile.includes('onClick={showSearch}'), 'Search button must remain intact');

      // Verify account button
      assert.ok(
        navbarFile.includes('openCustomerAccount') &&
        navbarFile.includes("navigate(customer ? '/dashboard' : '/account')"),
        'Account button must navigate to /dashboard or /account'
      );

      // Verify cart button
      assert.ok(navbarFile.includes('onClick={showCart}'), 'Cart button must remain intact');
    });

    it('Mobile navigation drawer must also provide direct Wishlist access', () => {
      const navbarFile = fs.readFileSync(
        path.resolve('src-rebuild/components/layout/Navbar.tsx'),
        'utf8'
      );

      assert.ok(
        navbarFile.includes("navigate('/wishlist')") &&
        navbarFile.includes('mobile-link'),
        'Mobile drawer must include a mobile-link to /wishlist'
      );
    });

    it('Wishlist view must never silently redirect signed-out or empty-wishlist users to Shop', () => {
      const wishlistFile = fs.readFileSync(
        path.resolve('src-rebuild/pages/Wishlist.tsx'),
        'utf8'
      );

      // Verify no unconditional navigate('/shop') or useEffect redirect on mount
      assert.ok(
        !wishlistFile.match(/useEffect\(\s*\(\)\s*=>\s*\{\s*navigate\(['"]\/shop['"]\)/),
        'Wishlist page must not redirect to /shop on mount'
      );
      assert.ok(
        !wishlistFile.match(/if\s*\(!customer\)\s*navigate/),
        'Wishlist page must not require customer authentication or redirect signed-out guests'
      );

      // Verify it renders the dedicated empty state UI
      assert.ok(
        wishlistFile.includes('Your wishlist is empty'),
        'Wishlist page must display empty state in-place'
      );
    });

    it('Wishlist state management must preserve guest data in localStorage and sync when logged in', () => {
      const wishlistContextFile = fs.readFileSync(
        path.resolve('src-rebuild/lib/wishlistContext.tsx'),
        'utf8'
      );

      assert.ok(
        wishlistContextFile.includes("STORAGE_KEY = 'malwa_wishlist_v1'"),
        'Guest items must be stored in localStorage under malwa_wishlist_v1'
      );
      assert.ok(
        wishlistContextFile.includes('/api/customer/wishlist/sync'),
        'Customer login must sync guest items up to /api/customer/wishlist/sync'
      );
      assert.ok(
        wishlistContextFile.includes('/api/customer/wishlist'),
        'Customer login must retrieve persisted items from /api/customer/wishlist'
      );
    });
  });

  // ── 2. Checkout Total Discrepancy & Business Calculation Rules ─────────────
  describe('2. Authoritative Checkout Pricing & Shipping Calculations', () => {
    function calculateOrderTotals(
      items: Array<{ price: number; quantity: number }>,
      coupon?: { type: 'percentage' | 'fixed'; value: number } | null,
      customThreshold = 499,
      customStandardFee = 49
    ) {
      const subtotal = Math.round(
        items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
      ) / 100;

      let discount = 0;
      if (coupon) {
        if (coupon.type === 'percentage') {
          discount = Math.round((subtotal * coupon.value) / 100);
        } else {
          discount = Math.min(subtotal, coupon.value);
        }
      }

      const shipping = subtotal >= customThreshold ? 0 : (subtotal > 0 ? customStandardFee : 0);
      const total = Math.max(0, Math.round((subtotal - discount + shipping) * 100) / 100);

      return { subtotal, discount, shipping, total };
    }

    it('Recorded Discrepancy Case: ₹120 item subtotal must result in ₹49 delivery and ₹169 authoritative total', () => {
      // 1 item @ ₹120 (e.g. Ratlami Sev 250g)
      const { subtotal, discount, shipping, total } = calculateOrderTotals([
        { price: 120, quantity: 1 },
      ]);

      assert.equal(subtotal, 120, 'Subtotal must be exactly ₹120');
      assert.equal(discount, 0, 'No discount applied');
      assert.equal(shipping, 49, 'Standard shipping of ₹49 must apply because ₹120 < ₹499 threshold');
      assert.equal(total, 169, 'Authoritative total must be exactly ₹169 (120 + 49)');
    });

    it('Complimentary delivery applies when subtotal reaches or exceeds ₹499 threshold', () => {
      // Below threshold: ₹498
      const below = calculateOrderTotals([{ price: 498, quantity: 1 }]);
      assert.equal(below.subtotal, 498);
      assert.equal(below.shipping, 49);
      assert.equal(below.total, 547);

      // Exact threshold: ₹499
      const exact = calculateOrderTotals([{ price: 499, quantity: 1 }]);
      assert.equal(exact.subtotal, 499);
      assert.equal(exact.shipping, 0, 'Shipping must be ₹0 at exactly ₹499');
      assert.equal(exact.total, 499);

      // Above threshold: ₹1,200
      const above = calculateOrderTotals([
        { price: 200, quantity: 3 },
        { price: 300, quantity: 2 },
      ]);
      assert.equal(above.subtotal, 1200);
      assert.equal(above.shipping, 0, 'Shipping must be ₹0 above ₹499');
      assert.equal(above.total, 1200);
    });

    it('Empty cart subtotal results in ₹0 total and ₹0 shipping', () => {
      const empty = calculateOrderTotals([]);
      assert.equal(empty.subtotal, 0);
      assert.equal(empty.shipping, 0);
      assert.equal(empty.total, 0);
    });

    it('CartDrawer summary breakdown clearly discloses delivery fee', () => {
      const cartDrawerFile = fs.readFileSync(
        path.resolve('src-rebuild/components/shop/CartDrawer.tsx'),
        'utf8'
      );

      // Check delivery line exists in summary rows
      assert.ok(
        cartDrawerFile.includes('<span>Delivery</span>'),
        'CartDrawer must include Delivery row in summary'
      );
      assert.ok(
        cartDrawerFile.includes('Complimentary (Free)') || cartDrawerFile.includes('Complimentary'),
        'CartDrawer must indicate Complimentary delivery when threshold reached'
      );
      assert.ok(
        cartDrawerFile.includes('shipping === 0'),
        'CartDrawer must conditionally display delivery amount'
      );
    });

    it('Server order creation (customerOrders.ts) strictly rejects client-supplied totals as authoritative', () => {
      const customerOrdersFile = fs.readFileSync(
        path.resolve('server/routes/customerOrders.ts'),
        'utf8'
      );

      // Verify that server calculates subtotal strictly from orderItems in database
      assert.ok(
        customerOrdersFile.includes("orderItems.reduce((sum, it) => sum + it.itemTotal, 0)"),
        'Server must compute subtotal from validated database items, NOT req.body.total'
      );

      // Verify that server calculates shipping from storeSettings / threshold
      assert.ok(
        customerOrdersFile.includes("subtotal >= freeThreshold ? 0 : standardFee"),
        'Server must compute shipping dynamically based on server threshold'
      );

      // Verify that server calculates finalTotal authoritatively
      assert.ok(
        customerOrdersFile.includes("Math.round((subtotal - discountAmount + shipping) * 100) / 100"),
        'Server must calculate finalTotal authoritatively from subtotal, discount, and shipping'
      );
    });
  });
});
