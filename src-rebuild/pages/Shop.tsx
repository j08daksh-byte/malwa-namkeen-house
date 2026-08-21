import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import SEOHead from '../components/seo/SEOHead';
import { PRODUCTS as FALLBACK_PRODUCTS, SHOP_CATEGORIES as FALLBACK_CATEGORIES, type Product, type ShopCategory } from '../data/products';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [categories, setCategories] = useState<ShopCategory[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>(
    () => searchParams.get('category') || 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    () => searchParams.get('q') || searchParams.get('search') || ''
  );
  const [selectedSpice, setSelectedSpice] = useState<string>(
    () => searchParams.get('spice') || 'All'
  );
  const [sortBy, setSortBy] = useState<string>(
    () => searchParams.get('sort') || 'featured'
  );

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [reservationOpen, setReservationOpen] = useState<boolean>(false);

  // Sync state changes to URL Search Params (replace: true prevents bloating history)
  const syncToUrl = useCallback(
    (cat: string, q: string, spice: string, sort: string) => {
      const nextParams = new URLSearchParams();
      if (cat && cat !== 'all') nextParams.set('category', cat);
      if (q && q.trim()) nextParams.set('q', q.trim());
      if (spice && spice !== 'All') nextParams.set('spice', spice);
      if (sort && sort !== 'featured') nextParams.set('sort', sort);
      setSearchParams(nextParams, { replace: true });
    },
    [setSearchParams]
  );

  // Handle URL change from browser navigation (Back / Forward)
  useEffect(() => {
    const cat = searchParams.get('category') || 'all';
    const q = searchParams.get('q') || searchParams.get('search') || '';
    const spice = searchParams.get('spice') || 'All';
    const sort = searchParams.get('sort') || 'featured';

    setSelectedCategory(cat);
    setSearchQuery(q);
    setSelectedSpice(spice);
    setSortBy(sort);
  }, [searchParams]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    syncToUrl(cat, searchQuery, selectedSpice, sortBy);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    syncToUrl(selectedCategory, q, selectedSpice, sortBy);
  };

  const handleSpiceChange = (spice: string) => {
    setSelectedSpice(spice);
    syncToUrl(selectedCategory, searchQuery, spice, sortBy);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    syncToUrl(selectedCategory, searchQuery, selectedSpice, sort);
  };

  const shopStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'The Malwa Shop — Authentic Artisanal Namkeens',
    url: 'https://malwanamkeen.com/shop',
    description: 'Shop authentic Ratlami Sev, Ujjaini chivda, khasta mathri, and festive gift boxes from Malwa Namkeen House.',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://malwanamkeen.com' },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://malwanamkeen.com/shop' },
      ],
    },
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Fetch Live Catalog Data from MongoDB
  const fetchLiveCatalog = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products?limit=100'),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        if (catData.success && Array.isArray(catData.categories) && catData.categories.length > 0) {
          const formattedCats: ShopCategory[] = [
            {
              id: 'all',
              label: 'All Delicacies',
              shortLabel: 'All',
              description: 'Explore our complete heritage collection of small-batch savouries, sweets, and curated gift boxes.',
            },
            ...catData.categories.map((c: any) => ({
              id: c.slug || c.id,
              label: c.name || c.label,
              shortLabel: c.shortLabel || c.name,
              description: c.description || 'Artisanal authentic recipe extruded and prepared in pure groundnut oil.',
            })),
          ];
          setCategories(formattedCats);
        }
      }

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (prodData.success && Array.isArray(prodData.products) && prodData.products.length > 0) {
          setProducts(prodData.products);
        }
      }
    } catch (err: unknown) {
      console.warn('[Shop Catalog] Using fallback catalog data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveCatalog();
  }, [fetchLiveCatalog]);

  // Compute counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    for (const p of products) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  // Filter and sort items
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory || (p as any).categoryId === selectedCategory);
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
        (p.hindiName && p.hindiName.toLowerCase().includes(q)) ||
        (p.tagline && p.tagline.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (Array.isArray(p.ingredients) && p.ingredients.some(ing => ing.toLowerCase().includes(q))) ||
        (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q)) ||
        (Array.isArray(p.options) && p.options.some(opt => (opt as any).sku?.toLowerCase().includes(q)))
      );
    }

    // Sort order
    if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.options?.[0]?.price ?? 0) - (b.options?.[0]?.price ?? 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.options?.[0]?.price ?? 0) - (a.options?.[0]?.price ?? 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    }

    return list;
  }, [products, selectedCategory, selectedSpice, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSpice('All');
    setSearchQuery('');
    setSortBy('featured');
    setSearchParams(new URLSearchParams(), { replace: true });
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

        /* ── Skeleton Loading ─────────────────────────────────── */
        .shop-skeleton-card {
          background: #FFFDF8;
          border: 1px solid rgba(200, 154, 61, 0.2);
          border-radius: 18px;
          overflow: hidden;
          padding-bottom: 20px;
          animation: pulse 1.5s infinite ease-in-out;
        }

        .shop-skeleton-media {
          width: 100%;
          aspect-ratio: 1.22 / 1;
          background: #EAE3D2;
        }

        .shop-skeleton-content {
          padding: 18px 20px 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .shop-skeleton-line {
          height: 14px;
          border-radius: 6px;
          background: #EAE3D2;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
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

      <SEOHead
        title="The Malwa Shop — Artisanal Sev, Namkeens & Gifting"
        description="Shop authentic Ratlami Sev, Ujjaini chivda, khasta mathri, and festive gift boxes from Malwa Namkeen House."
        canonicalPath="/shop"
        structuredData={shopStructuredData}
      />

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
            onSelectCategory={handleCategoryChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            selectedSpice={selectedSpice}
            onSelectSpice={handleSpiceChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            categoryCounts={categoryCounts}
            totalResults={filteredProducts.length}
            categories={categories}
          />

          {/* Products Grid or Loading Skeleton or Empty State */}
          {loading ? (
            <div className="shop-grid" role="status" aria-label="Loading delicacies">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="shop-skeleton-card">
                  <div className="shop-skeleton-media" />
                  <div className="shop-skeleton-content">
                    <div className="shop-skeleton-line" style={{ width: '40%' }} />
                    <div className="shop-skeleton-line" style={{ width: '80%', height: '20px' }} />
                    <div className="shop-skeleton-line" style={{ width: '60%' }} />
                    <div className="shop-skeleton-line" style={{ width: '100%', height: '36px', marginTop: '12px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
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
