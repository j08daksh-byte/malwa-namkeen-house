import React, { useState, useMemo, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/sections/Footer';
import ReservationModal from '../components/sections/ReservationModal';
import ShopHero from '../components/shop/ShopHero';
import ShopFilters from '../components/shop/ShopFilters';
import ProductCard from '../components/shop/ProductCard';
import ProductQuickViewModal from '../components/shop/ProductQuickViewModal';
import CartDrawer from '../components/shop/CartDrawer';
import CheckoutModal from '../components/shop/CheckoutModal';
import ShopToast from '../components/shop/ShopToast';
import { PRODUCTS, type Product } from '../data/products';

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSpice, setSelectedSpice] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [reservationOpen, setReservationOpen] = useState<boolean>(false);

  // Set document title & scroll to top on mount
  useEffect(() => {
    document.title = 'The Malwa Shop — Artisanal Sev, Namkeens & Gifting | Malwa Namkeen House';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Compute counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: PRODUCTS.length };
    for (const p of PRODUCTS) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  // Filter and sort items
  const filteredProducts = useMemo(() => {
    let list = [...PRODUCTS];

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory);
    }

    // Spice level filter
    if (selectedSpice !== 'All') {
      list = list.filter(p => p.spiceLevel === selectedSpice);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.hindiName && p.hindiName.includes(q)) ||
        p.tagline.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.ingredients.some(ing => ing.toLowerCase().includes(q)) ||
        p.categoryLabel.toLowerCase().includes(q)
      );
    }

    // Sort order
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.options[0].price - b.options[0].price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.options[0].price - a.options[0].price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [selectedCategory, selectedSpice, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSpice('All');
    setSearchQuery('');
    setSortBy('featured');
  };

  return (
    <div className="shop-page-wrapper">
      <style>{`
        .shop-page-wrapper {
          background-color: var(--bg-parchment, #F6EFE3);
          color: var(--text-dark, #34211D);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .shop-main-content {
          flex: 1;
          padding: clamp(32px, 4vw, 56px) clamp(16px, 3vw, 48px) clamp(64px, 8vw, 96px);
        }

        .shop-content-inner {
          max-width: var(--container-max, 1240px);
          margin-inline: auto;
          width: 100%;
        }

        /* ── Product Grid ─────────────────────────────────────── */
        .shop-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(20px, 2.5vw, 32px);
        }

        /* ── Empty Search Results ─────────────────────────────── */
        .shop-empty-state {
          background: #FDFAF4;
          border: 1px solid rgba(200, 154, 61, 0.28);
          border-radius: 20px;
          padding: clamp(48px, 7vw, 84px) 24px;
          text-align: center;
          margin: 20px 0;
          box-shadow: 0 4px 18px rgba(85, 0, 10, 0.04);
        }

        .shop-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(201, 154, 50, 0.12);
          border: 1px solid rgba(201, 154, 50, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C99A32;
          margin: 0 auto 18px;
        }

        .shop-empty-heading {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(24px, 2.8vw, 32px);
          font-weight: 700;
          color: #55000A;
          margin: 0 0 8px;
        }

        .shop-empty-sub {
          font-family: Inter, sans-serif;
          font-size: 14px;
          color: #75645C;
          max-width: 440px;
          margin: 0 auto 24px;
          line-height: 1.6;
        }

        .shop-empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 42px;
          padding: 0 24px;
          border-radius: 999px;
          background: #55000A;
          color: #FFF8EC;
          border: none;
          font-family: Inter, sans-serif;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.18s, transform 0.18s;
          box-shadow: 0 4px 14px rgba(85, 0, 10, 0.18);
        }

        .shop-empty-btn:hover {
          background: #6B000D;
          transform: translateY(-1px);
        }

        /* ── Responsive Grid ──────────────────────────────────── */
        @media (min-width: 1200px) {
          .shop-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 1040px) {
          .shop-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px;
          }
        }

        @media (max-width: 620px) {
          .shop-grid {
            grid-template-columns: 1fr;
            gap: 18px;
          }
        }
      `}</style>

      {/* Navbar with Reserve Modal Trigger */}
      <Navbar onReserve={() => setReservationOpen(true)} />

      {/* Hero Banner */}
      <ShopHero />

      {/* Main Content Area */}
      <main className="shop-main-content" aria-label="Malwa Shop Delicacies">
        <div className="shop-content-inner">

          {/* Filtering & Search Controls */}
          <ShopFilters
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedSpice={selectedSpice}
            onSelectSpice={setSelectedSpice}
            sortBy={sortBy}
            onSortChange={setSortBy}
            categoryCounts={categoryCounts}
            totalResults={filteredProducts.length}
          />

          {/* Products Grid or Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="shop-empty-state" role="status">
              <div className="shop-empty-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <h2 className="shop-empty-heading">No Delicacies Found</h2>
              <p className="shop-empty-sub">
                We couldn't find any items matching your current search or filters. Try adjusting your keywords or browse all our heritage categories.
              </p>
              <button
                type="button"
                className="shop-empty-btn"
                onClick={handleResetFilters}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="shop-grid" role="list" aria-label="Available delicacies">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      {/* Cart Drawer */}
      <CartDrawer
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {/* Toast & Floating Cart Trigger */}
      <ShopToast />

      {/* Reservation Modal for Navbar */}
      <ReservationModal
        open={reservationOpen}
        onClose={() => setReservationOpen(false)}
      />

      {/* Site Footer */}
      <Footer />
    </div>
  );
}
