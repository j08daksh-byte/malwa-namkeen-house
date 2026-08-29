import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/sections/Footer';
import ReservationModal from '../components/sections/ReservationModal';
import ShopHero from '../components/shop/ShopHero';
import CategoryShortcutRow from '../components/shop/CategoryShortcutRow';
import ShopFilters from '../components/shop/ShopFilters';
import ProductCard from '../components/shop/ProductCard';
import ProductQuickViewModal from '../components/shop/ProductQuickViewModal';
import CartDrawer from '../components/shop/CartDrawer';
import CheckoutModal from '../components/shop/CheckoutModal';
import ShopToast from '../components/shop/ShopToast';
import SEOHead from '../components/seo/SEOHead';
import { PRODUCTS as FALLBACK_PRODUCTS, SHOP_CATEGORIES as FALLBACK_CATEGORIES, type Product, type ShopCategory } from '../data/products';

const PAGE_SIZE = 9; // Clean 3x3 grid on desktop

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  // SearchParams are Single Source of Truth to avoid state-sync re-render loops & race conditions
  const selectedCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('q') || searchParams.get('search') || '';
  const selectedSpice = searchParams.get('spice') || 'All';
  const sortBy = searchParams.get('sort') || 'featured';

  // Client-side instant filter helper (zero latency)
  const filterStaticCatalog = useCallback(
    (pageNumber: number) => {
      let list = [...FALLBACK_PRODUCTS];

      if (selectedCategory && selectedCategory !== 'all') {
        const catLower = selectedCategory.toLowerCase();
        list = list.filter(
          p =>
            p.category === catLower ||
            (p as any).categoryId === catLower ||
            (catLower === 'mixtures' && p.category === 'mixtures-chivda') ||
            (catLower === 'sweets' && p.category === 'mithai-sweets') ||
            (catLower === 'snacks' && p.category === 'khasta-mathri') ||
            (catLower === 'hampers' && p.category === 'gift-hampers') ||
            ((catLower === 'falahari' || catLower === 'fasting') && p.category === 'falahari-fasting')
        );
      }

      if (selectedSpice && selectedSpice !== 'All') {
        list = list.filter(p => p.spiceLevel.toLowerCase() === selectedSpice.toLowerCase());
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        list = list.filter(
          p =>
            p.name.toLowerCase().includes(q) ||
            (p.hindiName && p.hindiName.toLowerCase().includes(q)) ||
            (p.tagline && p.tagline.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (Array.isArray(p.ingredients) && p.ingredients.some(ing => ing.toLowerCase().includes(q))) ||
            (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q))
        );
      }

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

      const total = list.length;
      const start = (pageNumber - 1) * PAGE_SIZE;
      const paginated = list.slice(start, start + PAGE_SIZE);
      const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

      return {
        products: paginated,
        total,
        hasMore: pageNumber < totalPages,
      };
    },
    [selectedCategory, selectedSpice, searchQuery, sortBy]
  );

  // Initialized with immediate static data for instant render
  const [products, setProducts] = useState<Product[]>(() => filterStaticCatalog(1).products);
  const [categories, setCategories] = useState<ShopCategory[]>(FALLBACK_CATEGORIES);
  const [initialLoading, setInitialLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(() => filterStaticCatalog(1).hasMore);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(() => filterStaticCatalog(1).total);

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [reservationOpen, setReservationOpen] = useState<boolean>(false);

  // References for tracking and aborting concurrent fetch requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef<boolean>(true);

  // Synchronous URL Parameter Updater
  const updateFilters = useCallback(
    (updates: { category?: string; q?: string; spice?: string; sort?: string }) => {
      const nextParams = new URLSearchParams(searchParams);

      if (updates.category !== undefined) {
        if (updates.category === 'all') nextParams.delete('category');
        else nextParams.set('category', updates.category);
      }

      if (updates.q !== undefined) {
        if (!updates.q.trim()) {
          nextParams.delete('q');
          nextParams.delete('search');
        } else {
          nextParams.set('q', updates.q.trim());
          nextParams.delete('search');
        }
      }

      if (updates.spice !== undefined) {
        if (updates.spice === 'All') nextParams.delete('spice');
        else nextParams.set('spice', updates.spice);
      }

      if (updates.sort !== undefined) {
        if (updates.sort === 'featured') nextParams.delete('sort');
        else nextParams.set('sort', updates.sort);
      }

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleCategoryChange = (cat: string) => updateFilters({ category: cat });
  const handleSearchChange = (q: string) => updateFilters({ q });
  const handleSpiceChange = (spice: string) => updateFilters({ spice });
  const handleSortChange = (sort: string) => updateFilters({ sort });

  // Scroll to top once on initial mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch Categories once on mount, merging with fallback
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
            const apiCats = data.categories.filter((c: any) => (c.slug || c.id) !== 'all');
            const mergedMap = new Map<string, ShopCategory>();

            // Always preserve all default categories
            FALLBACK_CATEGORIES.forEach(c => mergedMap.set(c.id, c));

            // Merge any dynamic categories from API
            apiCats.forEach((c: any) => {
              const id = c.slug || c.id;
              mergedMap.set(id, {
                id,
                label: c.name || c.label,
                shortLabel: c.shortLabel || c.name,
                description: c.description || 'Artisanal authentic recipe extruded and prepared in pure groundnut oil.',
              });
            });

            setCategories(Array.from(mergedMap.values()));
          }
        }
      } catch (err) {
        console.warn('[Shop] Using default categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Core product fetching function
  const fetchProductsBatch = useCallback(
    async (pageToFetch: number, isReset: boolean) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Always apply instant static filtering for zero latency
      const staticResult = filterStaticCatalog(pageToFetch);
      if (isReset) {
        setProducts(staticResult.products);
        setTotalCount(staticResult.total);
        setHasMore(staticResult.hasMore);
        setPage(pageToFetch);
      } else {
        setLoadingMore(true);
      }

      try {
        const queryParams = new URLSearchParams({
          page: String(pageToFetch),
          limit: String(PAGE_SIZE),
          category: selectedCategory,
          search: searchQuery,
          spice: selectedSpice,
          sortBy: sortBy,
        });

        const timeoutPromise = new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Fetch timeout')), 8000)
        );

        const fetchPromise = fetch(`/api/products?${queryParams.toString()}`, {
          signal: controller.signal,
        });

        const res = await Promise.race([fetchPromise, timeoutPromise]);

        if (!isMountedRef.current) return;

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.products)) {
            setTotalCount(data.total ?? data.products.length);
            setHasMore(Boolean(data.page < data.totalPages));
            setPage(pageToFetch);

            if (isReset) {
              setProducts(data.products);
            } else {
              setProducts(prev => {
                const existingIds = new Set(prev.map(p => p.id || (p as any)._id));
                const newItems = data.products.filter(
                  (p: Product) => !existingIds.has(p.id || (p as any)._id)
                );
                return [...prev, ...newItems];
              });
            }
            return;
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;

        // Fallback already rendered synchronously on reset; handle append case
        if (!isReset) {
          setProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id || (p as any)._id));
            const newItems = staticResult.products.filter(
              p => !existingIds.has(p.id || (p as any)._id)
            );
            return [...prev, ...newItems];
          });
          setHasMore(staticResult.hasMore);
        }
      } finally {
        if (isMountedRef.current) {
          setInitialLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [selectedCategory, searchQuery, selectedSpice, sortBy, filterStaticCatalog]
  );

  // Re-fetch whenever search/filter criteria change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProductsBatch(1, true);
  }, [selectedCategory, searchQuery, selectedSpice, sortBy, fetchProductsBatch]);

  // Infinite Scroll Trigger (Sentinel Intersection Observer)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      entries => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !initialLoading && !loadingMore) {
          fetchProductsBatch(page + 1, false);
        }
      },
      {
        root: null,
        rootMargin: '350px 0px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, initialLoading, loadingMore, page, fetchProductsBatch]);

  // Accurate category counts for shortcut cards and filter drawer
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: FALLBACK_PRODUCTS.length };
    for (const p of FALLBACK_PRODUCTS) {
      if (p.category) {
        counts[p.category] = (counts[p.category] ?? 0) + 1;
      }
    }
    return counts;
  }, []);

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const shopStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'The Malwa Shop — Authentic Artisanal Namkeens',
    url: 'https://malwanamkeen.com/shop',
    description: 'Shop authentic Ratlami Sev, Ujjaini chivda, khasta mathri, and festive gift boxes from MALWA NAMKEEN HOUSE.',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://malwanamkeen.com' },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://malwanamkeen.com/shop' },
      ],
    },
  };

  return (
    <div className="eb-shop-page-wrapper">
      <style>{`
        .eb-shop-page-wrapper {
          background-color: #FAF6F0;
          color: #34211D;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .eb-shop-main-content {
          flex: 1;
          padding: clamp(16px, 2.5vw, 36px) clamp(14px, 3.5vw, 48px) clamp(48px, 6vw, 96px);
        }

        .eb-shop-content-inner {
          max-width: 1240px;
          margin-inline: auto;
          width: 100%;
        }

        /* ── Product Grid: 3 per row on desktop, 2 on tablet, 2/1 on mobile ─ */
        .eb-product-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(16px, 2.2vw, 28px);
        }

        /* ── Modern Skeleton Loading Cards ──────────────────── */
        .eb-skeleton-card {
          background: #FFFFFF;
          border: 1.5px solid rgba(200, 154, 61, 0.20);
          border-radius: 18px;
          overflow: hidden;
          padding-bottom: 18px;
          box-shadow: 0 4px 18px rgba(85, 0, 10, 0.03);
          display: flex;
          flex-direction: column;
        }

        .eb-skeleton-media {
          width: 100%;
          aspect-ratio: 1.15 / 1;
          background: linear-gradient(90deg, #EFE8DC 0%, #FBF6EE 50%, #EFE8DC 100%);
          background-size: 200% 100%;
          animation: ebSkeletonShimmer 1.6s infinite linear;
        }

        .eb-skeleton-content {
          padding: 16px 18px 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .eb-skeleton-line {
          height: 14px;
          border-radius: 6px;
          background: linear-gradient(90deg, #EDE5D8 0%, #F9F4EC 50%, #EDE5D8 100%);
          background-size: 200% 100%;
          animation: ebSkeletonShimmer 1.6s infinite linear;
        }

        @keyframes ebSkeletonShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* ── End of Catalog Indicator ───────────────────────── */
        .eb-shop-end-indicator {
          margin: 48px auto 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          max-width: 460px;
          padding: 20px 16px;
        }

        .eb-shop-end-line-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          max-width: 240px;
          margin-bottom: 4px;
        }

        .eb-shop-end-line {
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, transparent, rgba(201, 154, 50, 0.4), transparent);
        }

        .eb-shop-end-diamond {
          width: 6px;
          height: 6px;
          background-color: #C99A32;
          transform: rotate(45deg);
        }

        .eb-shop-end-title {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #55000A;
          margin: 0;
        }

        .eb-shop-end-sub {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 13px;
          color: #75645C;
          margin: 0;
          line-height: 1.5;
        }

        /* ── Empty State ────────────────────────────────────── */
        .eb-shop-empty-state {
          background: #FFFFFF;
          border: 1.5px solid rgba(200, 154, 61, 0.28);
          border-radius: 20px;
          padding: clamp(48px, 7vw, 84px) 24px;
          text-align: center;
          margin: 20px 0;
          box-shadow: 0 4px 20px rgba(85, 0, 10, 0.04);
        }

        .eb-shop-empty-icon {
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

        .eb-shop-empty-heading {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: clamp(22px, 2.6vw, 30px);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #55000A;
          margin: 0 0 8px;
        }

        .eb-shop-empty-sub {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14px;
          font-weight: 400;
          color: #75645C;
          max-width: 440px;
          margin: 0 auto 24px;
          line-height: 1.6;
        }

        .eb-shop-empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          padding: 0 26px;
          border-radius: 999px;
          background: #55000A;
          color: #FFF8EC;
          border: none;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.18s, transform 0.18s;
          box-shadow: 0 4px 14px rgba(85, 0, 10, 0.18);
        }

        .eb-shop-empty-btn:hover {
          background: #6B000D;
          transform: translateY(-1px);
        }

        /* ── Responsive Grid Breakpoints ────────────────────── */
        @media (min-width: 1024px) {
          .eb-product-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 28px;
          }
        }

        @media (min-width: 641px) and (max-width: 1023px) {
          .eb-product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px;
          }
        }

        @media (max-width: 640px) {
          .eb-product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
        }

        @media (max-width: 375px) {
          .eb-product-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>

      <SEOHead
        title="The Malwa Shop — Artisanal Sev, Namkeens & Gifting"
        description="Shop authentic Ratlami Sev, Ujjaini chivda, khasta mathri, and festive gift boxes from MALWA NAMKEEN HOUSE."
        canonicalPath="/shop"
        structuredData={shopStructuredData}
      />

      {/* 1. Header (Navbar) */}
      <Navbar onReserve={() => setReservationOpen(true)} />

      {/* 2. Shop Title / Short Introduction */}
      <ShopHero />

      {/* 3. Main Content Area */}
      <main className="eb-shop-main-content" aria-label="Malwa Shop Delicacies">
        <div className="eb-shop-content-inner">

          {/* 3. Category Shortcut Cards Row */}
          <CategoryShortcutRow
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
            categoryCounts={categoryCounts}
          />

          {/* 4. Search + Filters + Sort Controls */}
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
            totalResults={totalCount || products.length}
            categories={categories}
            onResetAll={handleResetFilters}
          />

          {/* 5. Product Grid */}
          {initialLoading ? (
            <div className="eb-product-grid" role="status" aria-label="Loading delicacies">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="eb-skeleton-card">
                  <div className="eb-skeleton-media" />
                  <div className="eb-skeleton-content">
                    <div className="eb-skeleton-line" style={{ width: '35%' }} />
                    <div className="eb-skeleton-line" style={{ width: '85%', height: '20px' }} />
                    <div className="eb-skeleton-line" style={{ width: '60%' }} />
                    <div className="eb-skeleton-line" style={{ width: '100%', height: '40px', marginTop: '12px', borderRadius: '10px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="eb-shop-empty-state" role="status">
              <div className="eb-shop-empty-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <h2 className="eb-shop-empty-heading">No Delicacies Found</h2>
              <p className="eb-shop-empty-sub">
                We couldn't find any savouries matching your current search or filters. Try adjusting your keywords or explore all our heritage categories.
              </p>
              <button
                type="button"
                className="eb-shop-empty-btn"
                onClick={handleResetFilters}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            /* 6. Product Grid with Infinite Scroll */
            <>
              <div className="eb-product-grid" role="list" aria-label="Available delicacies">
                {products.map(product => (
                  <ProductCard
                    key={product.id || (product as any)._id || product.slug}
                    product={product}
                    onQuickView={setQuickViewProduct}
                  />
                ))}

                {/* Incremental Loading Skeletons */}
                {loadingMore &&
                  [1, 2, 3].map(n => (
                    <div key={`more-skeleton-${n}`} className="eb-skeleton-card">
                      <div className="eb-skeleton-media" />
                      <div className="eb-skeleton-content">
                        <div className="eb-skeleton-line" style={{ width: '35%' }} />
                        <div className="eb-skeleton-line" style={{ width: '85%', height: '20px' }} />
                        <div className="eb-skeleton-line" style={{ width: '60%' }} />
                        <div className="eb-skeleton-line" style={{ width: '100%', height: '40px', marginTop: '12px', borderRadius: '10px' }} />
                      </div>
                    </div>
                  ))}
              </div>

              {/* Scroll Sentinel for triggering subsequent batches */}
              {hasMore && (
                <div
                  ref={sentinelRef}
                  style={{ height: '30px', margin: '20px 0', opacity: 0 }}
                  aria-hidden="true"
                />
              )}

              {/* End of catalog indicator */}
              {!hasMore && products.length > 0 && (
                <div className="eb-shop-end-indicator" role="status">
                  <div className="eb-shop-end-line-wrap">
                    <div className="eb-shop-end-line" />
                    <div className="eb-shop-end-diamond" />
                    <div className="eb-shop-end-line" />
                  </div>
                  <h3 className="eb-shop-end-title">Crafted with Heritage</h3>
                  <p className="eb-shop-end-sub">
                    You have explored all our available handcrafted savouries &amp; delicacies.
                  </p>
                </div>
              )}
            </>
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
