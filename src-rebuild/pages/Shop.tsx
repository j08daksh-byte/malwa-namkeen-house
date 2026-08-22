import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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

const PAGE_SIZE = 9; // Clean multiple for 3-col, 2-col, and 1-col grids

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Dynamic pagination & catalog state — initialized with local catalog for instant zero-latency loading
  const [products, setProducts] = useState<Product[]>(() => FALLBACK_PRODUCTS.slice(0, PAGE_SIZE));
  const [categories, setCategories] = useState<ShopCategory[]>(FALLBACK_CATEGORIES);
  const [initialLoading, setInitialLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(FALLBACK_PRODUCTS.length);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filter criteria states
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

  // References for tracking and aborting concurrent fetch requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef<boolean>(true);

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

    setSelectedCategory(prev => (prev !== cat ? cat : prev));
    setSearchQuery(prev => (prev !== q ? q : prev));
    setSelectedSpice(prev => (prev !== spice ? spice : prev));
    setSortBy(prev => (prev !== sort ? sort : prev));
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

  // Fetch Categories once
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
            const rawWithoutAll = data.categories.filter((c: any) => (c.slug || c.id) !== 'all');
            const formatted: ShopCategory[] = [
              {
                id: 'all',
                label: 'All Delicacies',
                shortLabel: 'All',
                description: 'Explore our complete heritage collection of small-batch savouries, sweets, and curated gift boxes.',
              },
              ...rawWithoutAll.map((c: any) => ({
                id: c.slug || c.id,
                label: c.name || c.label,
                shortLabel: c.shortLabel || c.name,
                description: c.description || 'Artisanal authentic recipe extruded and prepared in pure groundnut oil.',
              })),
            ];
            setCategories(formatted);
          }
        }
      } catch (err) {
        console.warn('[Shop] Categories fallback active:', err);
      }
    }
    loadCategories();
  }, []);

  // Client-side fallback filter helper (if offline or server unreachable)
  const filterStaticCatalog = useCallback(
    (pageNumber: number) => {
      let list = [...FALLBACK_PRODUCTS];

      if (selectedCategory !== 'all') {
        list = list.filter(p => p.category === selectedCategory || (p as any).categoryId === selectedCategory);
      }

      if (selectedSpice !== 'All') {
        list = list.filter(p => p.spiceLevel === selectedSpice);
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

  // Core product fetching function
  const fetchProductsBatch = useCallback(
    async (pageToFetch: number, isReset: boolean) => {
      // Abort previous in-flight request to prevent race conditions
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (isReset) {
        setProducts(prev => (prev.length === 0 ? FALLBACK_PRODUCTS.slice(0, PAGE_SIZE) : prev));
        setApiError(null);
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
          setTimeout(() => reject(new Error('Fetch timeout')), 2500)
        );

        const fetchPromise = fetch(`/api/products?${queryParams.toString()}`, {
          signal: controller.signal,
        });

        const res = await Promise.race([fetchPromise, timeoutPromise]);

        if (!isMountedRef.current) return;

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.products) && data.products.length > 0) {
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
        throw new Error('API request returned empty or invalid');
      } catch (err: any) {
        if (err.name === 'AbortError') return; // Cancelled intentionally

        console.warn('[Shop] Falling back to client-filtered catalog:', err.message);
        // Fallback gracefully to static dataset with incremental pagination
        const staticResult = filterStaticCatalog(pageToFetch);
        setTotalCount(staticResult.total);
        setHasMore(staticResult.hasMore);
        setPage(pageToFetch);

        if (isReset) {
          setProducts(staticResult.products);
        } else {
          setProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id || (p as any)._id));
            const newItems = staticResult.products.filter(
              p => !existingIds.has(p.id || (p as any)._id)
            );
            return [...prev, ...newItems];
          });
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

  // Trigger fresh initial load whenever filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProductsBatch(1, true);
  }, [fetchProductsBatch]);

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
        rootMargin: '380px 0px', // Pre-fetch smoothly before user reaches absolute bottom
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, initialLoading, loadingMore, page, fetchProductsBatch]);

  // Compute category counts for filter tabs from complete catalog
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: Math.max(FALLBACK_PRODUCTS.length, totalCount) };
    for (const p of FALLBACK_PRODUCTS) {
      if (p.category) {
        counts[p.category] = (counts[p.category] ?? 0) + 1;
      }
    }
    return counts;
  }, [totalCount]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSpice('All');
    setSearchQuery('');
    setSortBy('featured');
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
          padding: clamp(20px, 3vw, 48px) clamp(12px, 3vw, 48px) clamp(48px, 6vw, 96px);
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
          gap: clamp(16px, 2.5vw, 32px);
        }

        /* ── Luxury Skeleton Loading Cards ────────────────────── */
        .shop-skeleton-card {
          background: #FFFDF8;
          border: 1px solid rgba(200, 154, 61, 0.24);
          border-radius: 18px;
          overflow: hidden;
          padding-bottom: 20px;
          box-shadow: 0 4px 18px rgba(85, 0, 10, 0.03);
          display: flex;
          flex-direction: column;
        }

        .shop-skeleton-media {
          width: 100%;
          aspect-ratio: 1.22 / 1;
          background: linear-gradient(90deg, #F0E9DC 0%, #FAF5EC 50%, #F0E9DC 100%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s infinite linear;
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
          background: linear-gradient(90deg, #EFE8DC 0%, #F8F3EA 50%, #EFE8DC 100%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s infinite linear;
        }

        @keyframes skeletonShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* ── End of Catalog Indicator ─────────────────────────── */
        .shop-end-indicator {
          margin: 48px auto 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          max-width: 460px;
          padding: 20px 16px;
        }

        .shop-end-line-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          max-width: 240px;
          margin-bottom: 4px;
        }

        .shop-end-line {
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, transparent, rgba(201, 154, 50, 0.4), transparent);
        }

        .shop-end-diamond {
          width: 5px;
          height: 5px;
          background-color: #C99A32;
          transform: rotate(45deg);
        }

        .shop-end-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 19px;
          font-weight: 700;
          color: #55000A;
          margin: 0;
          letter-spacing: 0.04em;
        }

        .shop-end-sub {
          font-family: Inter, sans-serif;
          font-size: 12.5px;
          color: #75645C;
          margin: 0;
          line-height: 1.5;
        }

        /* ── Empty State ──────────────────────────────────────── */
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
        @media (min-width: 1100px) {
          .shop-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 28px;
          }
        }

        @media (max-width: 1099px) {
          .shop-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px;
          }
        }

        @media (max-width: 640px) {
          .shop-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
        }

        @media (max-width: 359px) {
          .shop-grid {
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
            totalResults={totalCount || products.length}
            categories={categories}
          />

          {/* Initial Loading Skeleton */}
          {initialLoading ? (
            <div className="shop-grid" role="status" aria-label="Loading delicacies">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="shop-skeleton-card">
                  <div className="shop-skeleton-media" />
                  <div className="shop-skeleton-content">
                    <div className="shop-skeleton-line" style={{ width: '40%' }} />
                    <div className="shop-skeleton-line" style={{ width: '80%', height: '22px' }} />
                    <div className="shop-skeleton-line" style={{ width: '60%' }} />
                    <div className="shop-skeleton-line" style={{ width: '100%', height: '38px', marginTop: '12px', borderRadius: '10px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="shop-empty-state" role="status">
              <div className="shop-empty-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <h2 className="shop-empty-heading">No Delicacies Found</h2>
              <p className="shop-empty-sub">
                We couldn't find any savouries matching your current search or filters. Try adjusting your keywords or explore all our heritage categories.
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
            /* Product Grid with Infinite Scroll */
            <>
              <div className="shop-grid" role="list" aria-label="Available delicacies">
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
                    <div key={`more-skeleton-${n}`} className="shop-skeleton-card">
                      <div className="shop-skeleton-media" />
                      <div className="shop-skeleton-content">
                        <div className="shop-skeleton-line" style={{ width: '40%' }} />
                        <div className="shop-skeleton-line" style={{ width: '80%', height: '22px' }} />
                        <div className="shop-skeleton-line" style={{ width: '60%' }} />
                        <div className="shop-skeleton-line" style={{ width: '100%', height: '38px', marginTop: '12px', borderRadius: '10px' }} />
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
                <div className="shop-end-indicator" role="status">
                  <div className="shop-end-line-wrap">
                    <div className="shop-end-line" />
                    <div className="shop-end-diamond" />
                    <div className="shop-end-line" />
                  </div>
                  <h3 className="shop-end-title">Crafted with Heritage</h3>
                  <p className="shop-end-sub">
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
