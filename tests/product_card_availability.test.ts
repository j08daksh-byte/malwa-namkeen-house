/**
 * Malwa Namkeen House — Workstream B: Storefront UX & Product Availability Tests
 *
 * Verifies product card availability logic, variant stock evaluation,
 * conservative handling of missing/malformed stock data, and sold-out states.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import ProductCard, {
  isVariantAvailable,
  isProductAvailable,
  syncSelectedVariant,
} from '../src-rebuild/components/shop/ProductCard.tsx';
import { CustomerSessionProvider } from '../src-rebuild/components/layout/CustomerSessionContext.tsx';
import { CartProvider } from '../src-rebuild/lib/cartContext.tsx';
import { WishlistProvider } from '../src-rebuild/lib/wishlistContext.tsx';
import { type Product, type ProductWeightOption } from '../src-rebuild/data/products.ts';

// Helper to create valid Product objects matching the full Product schema
function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'test-item',
    name: 'Test Product',
    tagline: 'Authentic Malwa Taste',
    category: 'sev-namkeen',
    categoryLabel: 'Sev & Namkeen',
    description: 'Crispy crunchy authentic snack',
    story: 'Traditional family recipe from Indore.',
    ingredients: ['Gram Flour', 'Spices'],
    spiceLevel: 'Medium',
    shelfLife: '3 Months',
    image: '/test.jpg',
    rating: 4.8,
    reviewCount: 42,
    isAvailable: true,
    isVegetarian: true,
    oilUsed: 'Cold Pressed Peanut Oil',
    options: [],
    ...overrides,
  };
}

// Helper to render ProductCard in isolated SSR environment
function renderCard(product: Product): string {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(
        CustomerSessionProvider,
        null,
        React.createElement(
          CartProvider,
          null,
          React.createElement(
            WishlistProvider,
            null,
            React.createElement(ProductCard, {
              product,
              onQuickView: () => {},
            })
          )
        )
      )
    )
  );
}

describe('Storefront UX — Product Availability & Stock Verification', () => {

  describe('1. Every variant is out of stock', () => {
    const oosProduct = createMockProduct({
      id: 'test-oos-1',
      name: 'Ujjaini Sev Special',
      options: [
        { weight: '400g', price: 160, stock: 0 } as ProductWeightOption,
        { weight: '800g', price: 300, stock: 0 } as ProductWeightOption,
        { weight: '1kg', price: 380, stock: 0 } as ProductWeightOption,
      ],
    });

    it('should determine the product is not available when all variants have 0 stock', () => {
      assert.equal(isProductAvailable(oosProduct), false);
    });

    it('should return false for every variant individually', () => {
      oosProduct.options.forEach(opt => {
        assert.equal(isVariantAvailable(opt, oosProduct), false);
      });
    });

    it('should render a clear SOLD OUT badge and disabled CTA button in HTML', () => {
      const html = renderCard(oosProduct);
      assert.ok(html.includes('SOLD OUT'), 'Card should show SOLD OUT text');
      assert.ok(html.includes('eb-product-card__badge-tag--soldout'), 'Card should have soldout badge class');
      assert.ok(html.includes('eb-product-card__cta-btn--disabled'), 'CTA button should have disabled class');
      assert.ok(html.includes('disabled=""') || html.includes('disabled'), 'CTA button should be HTML disabled');
      assert.ok(html.includes('aria-disabled="true"'), 'CTA should have aria-disabled');
      assert.ok(html.includes('eb-product-card__img--soldout'), 'Image should have soldout styling class');
    });
  });

  describe('2. One variant in stock while another is sold out (Partial Availability)', () => {
    const mixedProduct = createMockProduct({
      id: 'test-mixed-1',
      name: 'Ratlami Sev Authentic',
      options: [
        { weight: '400g', price: 150, stock: 0 } as ProductWeightOption, // sold out
        { weight: '800g', price: 290, stock: 15 } as ProductWeightOption, // in stock
        { weight: '1kg', price: 360, stock: 0 } as ProductWeightOption, // sold out
      ],
    });

    it('should NOT mark the entire product sold out merely because some variants are unavailable', () => {
      assert.equal(isProductAvailable(mixedProduct), true);
    });

    it('should accurately distinguish between in-stock and out-of-stock variants', () => {
      assert.equal(isVariantAvailable(mixedProduct.options[0], mixedProduct), false);
      assert.equal(isVariantAvailable(mixedProduct.options[1], mixedProduct), true);
      assert.equal(isVariantAvailable(mixedProduct.options[2], mixedProduct), false);
    });

    it('should render the card as available overall, defaulting to the in-stock variant', () => {
      const html = renderCard(mixedProduct);
      // Card itself shouldn't render the soldout badge in HTML elements
      assert.ok(!html.includes('eb-product-card__badge-tag--soldout"'), 'Card should not render soldout badge element');
      // Sold out chips should have soldout class and strikethrough styling
      assert.ok(html.includes('eb-product-card__weight-btn--soldout'), 'Sold out options should have soldout chip class');
      assert.ok(html.includes('400g (Sold out)'), '400g variant should have aria-label indicating sold out');
      // CTA button should be enabled for the default selected in-stock option (800g)
      assert.ok(html.includes('QUICK ADD'), 'CTA button should show QUICK ADD');
      assert.ok(!html.includes('class="eb-product-card__cta-btn eb-product-card__cta-btn--disabled"'), 'CTA element must not be disabled for available variant');
    });
  });

  describe('3. Selected variant unavailable & CTA prevention', () => {
    const singleOOSVariantProduct = createMockProduct({
      id: 'test-variant-oos',
      name: 'Indori Mixture',
      options: [
        { weight: '500g', price: 180, stock: 0 } as ProductWeightOption,
      ],
    });

    it('should identify that the selected variant is unavailable', () => {
      assert.equal(isVariantAvailable(singleOOSVariantProduct.options[0], singleOOSVariantProduct), false);
    });

    it('should render the CTA disabled with SOLD OUT text for unavailable variant', () => {
      const html = renderCard(singleOOSVariantProduct);
      assert.ok(html.includes('eb-product-card__cta-btn--disabled'));
      assert.ok(html.includes('SOLD OUT'));
      assert.ok(html.includes('aria-disabled="true"'));
    });
  });

  describe('4. Missing, malformed, or inactive stock data handled conservatively', () => {
    const baseProduct = createMockProduct({
      id: 'test-conservative',
      name: 'Hing Peda',
      options: [],
    });

    it('should treat null option as unavailable', () => {
      assert.equal(isVariantAvailable(null, baseProduct), false);
      assert.equal(isVariantAvailable(undefined, baseProduct), false);
    });

    it('should treat active: false variant as unavailable regardless of stock number', () => {
      const inactiveOpt = { weight: '200g', price: 80, stock: 50, active: false } as ProductWeightOption;
      assert.equal(isVariantAvailable(inactiveOpt, baseProduct), false);
    });

    it('should treat negative stock as unavailable', () => {
      const negOpt = { weight: '200g', price: 80, stock: -5 } as ProductWeightOption;
      assert.equal(isVariantAvailable(negOpt, baseProduct), false);
    });

    it('should treat NaN stock as unavailable', () => {
      const nanOpt = { weight: '200g', price: 80, stock: NaN } as ProductWeightOption;
      assert.equal(isVariantAvailable(nanOpt, baseProduct), false);
    });

    it('should treat string stock as unavailable', () => {
      const strOpt = { weight: '200g', price: 80, stock: 'in-stock' as any } as ProductWeightOption;
      assert.equal(isVariantAvailable(strOpt, baseProduct), false);
    });

    it('should treat product with isAvailable: false as unavailable for all variants', () => {
      const unavailableProduct = createMockProduct({
        ...baseProduct,
        isAvailable: false,
        options: [{ weight: '200g', price: 80, stock: 100 } as ProductWeightOption],
      });
      assert.equal(isProductAvailable(unavailableProduct), false);
      assert.equal(isVariantAvailable(unavailableProduct.options[0], unavailableProduct), false);
    });

    it('should treat empty options list with no product-level stock as unavailable if isAvailable is not true', () => {
      const emptyProd = createMockProduct({
        ...baseProduct,
        isAvailable: false,
        options: [],
      });
      assert.equal(isProductAvailable(emptyProd), false);
    });
  });

  describe('5. Fully available products behavior', () => {
    const fullyAvailableProduct = createMockProduct({
      id: 'test-available-1',
      name: 'Laung Sev Royal',
      badge: 'BESTSELLER',
      oilUsed: 'Cold Pressed Peanut Oil',
      options: [
        { weight: '400g', price: 160, stock: 25 } as ProductWeightOption,
        { weight: '800g', price: 310, stock: 40 } as ProductWeightOption,
      ],
    });

    it('should report product and variants as available', () => {
      assert.equal(isProductAvailable(fullyAvailableProduct), true);
      assert.equal(isVariantAvailable(fullyAvailableProduct.options[0], fullyAvailableProduct), true);
      assert.equal(isVariantAvailable(fullyAvailableProduct.options[1], fullyAvailableProduct), true);
    });

    it('should preserve existing badge, oil feature tag, pricing, and active CTA button', () => {
      const html = renderCard(fullyAvailableProduct);
      assert.ok(html.includes('BESTSELLER'), 'Should preserve existing badge text');
      assert.ok(html.includes('Cold Pressed Peanut Oil'), 'Should preserve oil tag');
      assert.ok(html.includes('₹160'), 'Should render default variant price');
      assert.ok(html.includes('QUICK ADD'), 'Should have active QUICK ADD CTA');
      assert.ok(!html.includes('class="eb-product-card__cta-btn eb-product-card__cta-btn--disabled"'), 'CTA element must NOT be disabled');
    });
  });

  describe('6. Mobile and responsive CSS checks', () => {
    const oosProduct = createMockProduct({
      id: 'test-mobile-oos',
      name: 'Mobile Test Item',
      options: [{ weight: '250g', price: 100, stock: 0 } as ProductWeightOption],
    });

    it('should include mobile-specific styling rules for disabled CTA and badges in stylesheet', () => {
      const html = renderCard(oosProduct);
      // Verify embedded <style> contains responsive definitions for mobile viewport
      assert.ok(html.includes('@media (max-width: 768px)'), 'Should contain mobile breakpoint styles');
      assert.ok(html.includes('.eb-product-card__cta-btn--disabled'), 'Should define disabled CTA style');
      assert.ok(html.includes('.eb-product-card__weight-btn--soldout'), 'Should define soldout weight chip style');
      assert.ok(html.includes('.eb-product-card__badge-tag--soldout'), 'Should define soldout badge style');
    });
  });

  describe('7. Selected variant synchronization on prop refresh & keyboard focus', () => {
    it('should update to the latest matching variant reference with fresh stock when product prop refreshes', () => {
      const initialSelected = { sku: 'MLW-RT-400G', weight: '400g', price: 160, stock: 20 } as ProductWeightOption;
      const refreshedProduct = createMockProduct({
        id: 'test-sync-1',
        options: [
          { sku: 'MLW-RT-400G', weight: '400g', price: 160, stock: 5 } as ProductWeightOption,
          { sku: 'MLW-RT-800G', weight: '800g', price: 310, stock: 15 } as ProductWeightOption,
        ],
      });

      const synced = syncSelectedVariant(initialSelected, refreshedProduct);
      assert.equal((synced as any).sku, 'MLW-RT-400G');
      assert.equal((synced as any).stock, 5, 'Should reference the updated option object with new stock');
      assert.equal(synced, refreshedProduct.options[0], 'Should be exact object reference from new product options');
    });

    it('should automatically select first available variant when selected variant becomes unavailable after refresh', () => {
      const previouslySelected = { sku: 'MLW-RT-400G', weight: '400g', price: 160, stock: 10 } as ProductWeightOption;
      const refreshedProduct = createMockProduct({
        id: 'test-sync-2',
        options: [
          { sku: 'MLW-RT-400G', weight: '400g', price: 160, stock: 0 } as ProductWeightOption, // became OOS
          { sku: 'MLW-RT-800G', weight: '800g', price: 310, stock: 15 } as ProductWeightOption, // available
        ],
      });

      const synced = syncSelectedVariant(previouslySelected, refreshedProduct);
      assert.equal((synced as any).sku, 'MLW-RT-800G', 'Should switch to the first in-stock variant');
      assert.equal((synced as any).stock, 15);
    });

    it('should fallback to first available variant if selected variant disappears entirely from options', () => {
      const disappearedVariant = { sku: 'MLW-RT-1KG', weight: '1kg', price: 380, stock: 10 } as ProductWeightOption;
      const refreshedProduct = createMockProduct({
        id: 'test-sync-3',
        options: [
          { sku: 'MLW-RT-400G', weight: '400g', price: 160, stock: 25 } as ProductWeightOption,
          { sku: 'MLW-RT-800G', weight: '800g', price: 310, stock: 30 } as ProductWeightOption,
        ],
      });

      const synced = syncSelectedVariant(disappearedVariant, refreshedProduct);
      assert.equal((synced as any).sku, 'MLW-RT-400G', 'Should select the first available variant');
    });

    it('should maintain safe sold-out state when no variants are available after refresh', () => {
      const previouslySelected = { sku: 'MLW-RT-400G', weight: '400g', price: 160, stock: 10 } as ProductWeightOption;
      const allOosProduct = createMockProduct({
        id: 'test-sync-4',
        options: [
          { sku: 'MLW-RT-400G', weight: '400g', price: 160, stock: 0 } as ProductWeightOption,
          { sku: 'MLW-RT-800G', weight: '800g', price: 310, stock: 0 } as ProductWeightOption,
        ],
      });

      const synced = syncSelectedVariant(previouslySelected, allOosProduct);
      assert.ok(synced, 'Should return a valid fallback option');
      assert.equal(isVariantAvailable(synced, allOosProduct), false, 'Selected variant must evaluate as unavailable');
      assert.equal(isProductAvailable(allOosProduct), false, 'Product overall must evaluate as sold out');
    });

    it('should render visible :focus-visible keyboard indicators for weight variant buttons in stylesheet', () => {
      const product = createMockProduct({
        id: 'test-focus-styles',
        options: [
          { sku: 'MLW-RT-400G', weight: '400g', price: 160, stock: 10 } as ProductWeightOption,
        ],
      });

      const html = renderCard(product);
      assert.ok(html.includes('.eb-product-card__weight-btn:focus-visible'), 'Stylesheet should define :focus-visible for weight buttons');
      assert.ok(html.includes('outline: 2px solid #55000A'), 'Should define 2px solid high-contrast outline');
      assert.ok(html.includes('outline-offset: 2px'), 'Should define 2px visible outline offset');
      assert.ok(html.includes('.eb-product-card__weight-btn--active:focus-visible'), 'Should define custom focus outline for active chip');
      assert.ok(html.includes('.eb-product-card__weight-btn--soldout:focus-visible'), 'Should define custom focus outline for sold-out chip');
    });
  });
});
