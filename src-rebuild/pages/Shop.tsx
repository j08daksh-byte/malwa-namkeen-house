import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowUp, Layers, Sparkles } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/sections/Footer';
import ReservationModal from '../components/sections/ReservationModal';
import ShopHero from '../components/shop/ShopHero';
import CategoryShortcutRow from '../components/shop/CategoryShortcutRow';
import ShopFilters from '../components/shop/ShopFilters';
import ProductCard from '../components/shop/ProductCard';
import ProductQuickViewModal from '../components/shop/ProductQuickViewModal';
import ShopToast from '../components/shop/ShopToast';
import SEOHead from '../components/seo/SEOHead';
import { ProductCardSkeleton, SkeletonStyles } from '../components/skeletons';
import { PRODUCTS as FALLBACK_PRODUCTS, SHOP_CATEGORIES as FALLBACK_CATEGORIES, type Product, type ShopCategory } from '../data/products';
import { resolveProductImage, resolveProductImages } from '../lib/productImage';

const PAGE_SIZE = 12; // Focused 3x4 grid for windowed pagination
const STREAM_PAGE_SIZE = 24; // Generous batch for continuous stream so entire catalog loads seamlessly

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<'pages' | 'stream'>(() => {
    return searchParams.get('mode') === 'pages' ? 'pages' : 'stream';
  });

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

      const currentLimit = viewMode === 'stream' ? STREAM_PAGE_SIZE : PAGE_SIZE;
      const total = list.length;
      const start = (pageNumber - 1) * currentLimit;
      const paginated = list.slice(start, start + currentLimit);
      const totalPages = Math.ceil(total / currentLimit) || 1;

      return {
        products: paginated,
        total,
        hasMore: pageNumber < totalPages,
      };
    },
    [selectedCategory, selectedSpice, searchQuery, sortBy, viewMode]
  );

  // Initialized with immediate static data for instant render
  const [products, setProducts] = useState<Product[]>(() => filterStaticCatalog(1).products);
  const [categories, setCategories] = useState<ShopCategory[]>(FALLBACK_CATEGORIES);
  const [dynamicCategoryCounts, setDynamicCategoryCounts] = useState<Record<string, number>>({});
  const [initialLoading, setInitialLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(() => filterStaticCatalog(1).hasMore);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(() => filterStaticCatalog(1).total);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Keep viewMode synchronized if URL mode param changes via navigation
  useEffect(() => {
    const urlMode = searchParams.get('mode') === 'pages' ? 'pages' : 'stream';
    if (urlMode !== viewMode) {
      setViewMode(urlMode);
    }
  }, [searchParams, viewMode]);

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [reservationOpen, setReservationOpen] = useState<boolean>(false);

  // References for tracking and aborting concurrent fetch requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const gridTopRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef<boolean>(true);
  const hasLoadedFromApiRef = useRef<boolean>(false);

  const currentBatchLimit = viewMode === 'stream' ? STREAM_PAGE_SIZE : PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalCount / currentBatchLimit));

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    fetchProductsBatch(newPage, true);
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleViewModeChange = (mode: 'pages' | 'stream') => {
    setViewMode(mode);
    const nextParams = new URLSearchParams(searchParams);
    if (mode === 'pages') nextParams.set('mode', 'pages');
    else nextParams.delete('mode');
    setSearchParams(nextParams, { replace: true });

    // Always reset to page 1 and fetch fresh batch for the selected mode
    setPage(1);
    fetchProductsBatch(1, true, mode);
  };

  const scrollToTop = () => {
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 420);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    isMountedRef.current = true;
    window.scrollTo({ top: 0, behavior: 'instant' });
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch Categories once on mount (authoritative from API)
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
            if (data.categoryCounts) {
              setDynamicCategoryCounts(data.categoryCounts);
            }

            const apiCats = data.categories.filter((c: any) => (c.slug || c.id) !== 'all');
            const loadedCats: ShopCategory[] = apiCats.map((c: any) => {
              const fallbackCat = FALLBACK_CATEGORIES.find(sc => sc.id === (c.slug || c.id));
              const rawCatImg = c.image;
              const isValidCatImg = rawCatImg && typeof rawCatImg === 'string' && !rawCatImg.includes('/hero-banner-') && !rawCatImg.includes('/mishtichaat/');
              return {
                id: c.slug || c.id,
                label: c.name || c.label,
                shortLabel: c.shortLabel || c.name,
                description: c.description || fallbackCat?.description || 'Artisanal authentic recipe extruded and prepared in pure groundnut oil.',
                image: (isValidCatImg ? rawCatImg : fallbackCat?.image) || '/products/ratlami-sev.jpg',
              };
            });

            const allCategoryOption: ShopCategory = {
              id: 'all',
              label: 'All Delicacies',
              shortLabel: 'All',
              description: 'Explore our complete heritage collection of small-batch savouries, sweets, and curated gift boxes.',
              image: '/products/ratlami-sev.jpg',
            };

            setCategories([allCategoryOption, ...loadedCats]);
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
    async (pageToFetch: number, isReset: boolean, explicitMode?: 'pages' | 'stream') => {
      isMountedRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const currentMode = explicitMode || viewMode;
      const currentBatchLimit = currentMode === 'stream' ? STREAM_PAGE_SIZE : PAGE_SIZE;

      const staticResult = filterStaticCatalog(pageToFetch);
      if (isReset) {
        // Only use static catalog on cold start before API responds
        if (!hasLoadedFromApiRef.current) {
          setProducts(staticResult.products);
          setTotalCount(staticResult.total);
          setHasMore(staticResult.hasMore);
        } else {
          setInitialLoading(true);
        }
        setPage(pageToFetch);
      } else {
        setLoadingMore(true);
      }

      try {
        const queryParams = new URLSearchParams({
          page: String(pageToFetch),
          limit: String(currentBatchLimit),
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
          cache: 'no-store',
        });

        const res = await Promise.race([fetchPromise, timeoutPromise]);

        if (!isMountedRef.current) return;

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.products)) {
            hasLoadedFromApiRef.current = true;
            setTotalCount(data.total ?? data.products.length);
            setHasMore(Boolean(data.page < data.totalPages));
            setPage(pageToFetch);

            const sanitizedProducts = data.products.map((p: Product) => ({
              ...p,
              image: resolveProductImage(p),
              images: resolveProductImages(p),
            }));

            if (isReset) {
              setProducts(sanitizedProducts);
            } else {
              setProducts(prev => {
                const existingIds = new Set(prev.map(p => p.id || (p as any)._id || p.slug));
                const newItems = sanitizedProducts.filter(
                  (p: Product) => !existingIds.has(p.id || (p as any)._id || p.slug)
                );
                return [...prev, ...newItems];
              });
            }
            return;
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;

        // Fallback only if offline / database disconnected
        if (!hasLoadedFromApiRef.current) {
          if (!isReset) {
            setProducts(prev => {
              const existingIds = new Set(prev.map(p => p.id || (p as any)._id || p.slug));
              const newItems = staticResult.products.filter(
                p => !existingIds.has(p.id || (p as any)._id || p.slug)
              );
              return [...prev, ...newItems];
            });
            setHasMore(staticResult.hasMore);
          }
        }
      } finally {
        if (isMountedRef.current) {
          setInitialLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [selectedCategory, searchQuery, selectedSpice, sortBy, viewMode, filterStaticCatalog]
  );

  // Re-fetch whenever search/filter criteria change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProductsBatch(1, true);
  }, [selectedCategory, searchQuery, selectedSpice, sortBy, fetchProductsBatch]);

  // Infinite Scroll Trigger (Sentinel Intersection Observer) - active only in Continuous Stream mode
  useEffect(() => {
    if (viewMode !== 'stream') return;
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
  }, [viewMode, hasMore, initialLoading, loadingMore, page, fetchProductsBatch]);

  // Accurate category counts for shortcut cards and filter drawer (from live MongoDB)
  const categoryCounts = useMemo(() => {
    if (Object.keys(dynamicCategoryCounts).length > 0) {
      return dynamicCategoryCounts;
    }
    const counts: Record<string, number> = { all: FALLBACK_PRODUCTS.length };
    for (const p of FALLBACK_PRODUCTS) {
      if (p.category) {
        counts[p.category] = (counts[p.category] ?? 0) + 1;
      }
    }
    return counts;
  }, [dynamicCategoryCounts]);

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const shopStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'The Malwa Shop — Authentic Artisanal Namkeens & Sweets',
    url: 'https://www.malwanamkeenhouse.com/shop',
    description: 'Shop authentic Ratlami Sev, Ujjaini chivda, khasta mathri, and festive gift boxes from MALWA NAMKEEN HOUSE. 100% pure cold-pressed groundnut oil.',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.malwanamkeenhouse.com' },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://www.malwanamkeenhouse.com/shop' },
      ],
    },
  };

  return (
    <div className="eb-shop-page-wrapper">
      <SEOHead
        title="Buy Authentic Malwa Namkeen & Sweets Online | Fast Delivery Across India"
        description="Shop authentic Ratlami Sev, Ujjaini chivda, khasta mathri, and festive gift boxes from Malwa Namkeen House. Handcrafted in 100% pure cold-pressed groundnut oil with fast doorstep delivery across India."
        canonicalPath="/shop"
        structuredData={shopStructuredData}
      />
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
          .eb-shop-main-content {
            padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px) + 24px);
          }
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

        /* ── Smart View Mode & Performance Toolbar ──────────── */
        .eb-shop-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin: 18px 0 24px;
          padding: 12px 18px;
          background: #FFFFFF;
          border: 1px solid rgba(200, 154, 61, 0.22);
          border-radius: 14px;
          box-shadow: 0 2px 10px rgba(85, 0, 10, 0.03);
        }

        .eb-shop-toolbar-status {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .eb-shop-toolbar-count {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 13.5px;
          color: #5A433B;
        }

        .eb-shop-toolbar-count strong {
          color: #55000A;
          font-weight: 700;
        }

        .eb-shop-progress-bar-wrap {
          width: 140px;
          height: 5px;
          background: rgba(200, 154, 61, 0.18);
          border-radius: 999px;
          overflow: hidden;
        }

        .eb-shop-progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #C89A3D 0%, #E6BF68 100%);
          border-radius: 999px;
          transition: width 0.35s ease;
        }

        .eb-shop-mode-selector {
          display: inline-flex;
          align-items: center;
          background: #F7F3EB;
          padding: 3px;
          border-radius: 10px;
          border: 1px solid rgba(200, 154, 61, 0.20);
        }

        .eb-shop-mode-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 13px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: #6E5850;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .eb-shop-mode-btn:hover {
          color: #55000A;
        }

        .eb-shop-mode-btn--active {
          background: #55000A;
          color: #FFF8EC !important;
          box-shadow: 0 2px 8px rgba(85, 0, 10, 0.22);
        }

        /* ── Windowed Pagination ────────────────────────────── */
        .eb-shop-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin: 44px auto 16px;
          flex-wrap: wrap;
        }

        .eb-shop-page-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 40px;
          padding: 0 18px;
          border-radius: 999px;
          background: #FFFFFF;
          border: 1.5px solid rgba(200, 154, 61, 0.3);
          color: #55000A;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(85, 0, 10, 0.04);
        }

        .eb-shop-page-nav-btn:hover:not(:disabled) {
          background: #55000A;
          color: #FFF8EC;
          border-color: #55000A;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(85, 0, 10, 0.18);
        }

        .eb-shop-page-nav-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          border-color: rgba(200, 154, 61, 0.15);
          color: #9C8C84;
        }

        .eb-shop-page-numbers {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .eb-shop-page-num {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1.5px solid rgba(200, 154, 61, 0.25);
          background: #FFFFFF;
          color: #55000A;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 13px;
          font-weight: 700;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(85, 0, 10, 0.04);
        }

        .eb-shop-page-num:hover:not(.eb-shop-page-num--active) {
          border-color: #C89A3D;
          background: #FAF6F0;
          transform: scale(1.05);
        }

        .eb-shop-page-num--active {
          background: #55000A !important;
          color: #FFF8EC !important;
          border-color: #55000A !important;
          box-shadow: 0 4px 14px rgba(85, 0, 10, 0.26) !important;
        }

        /* ── Continuous Stream Load More Button ─────────────── */
        .eb-shop-load-more-wrap {
          text-align: center;
          margin: 36px auto 16px;
        }

        .eb-shop-load-more-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 46px;
          padding: 0 32px;
          border-radius: 999px;
          background: #55000A;
          color: #FFF8EC;
          border: 1.5px solid #55000A;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 4px 18px rgba(85, 0, 10, 0.20);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .eb-shop-load-more-btn:hover:not(:disabled) {
          background: #6B000D;
          border-color: #6B000D;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(85, 0, 10, 0.30);
        }

        .eb-shop-load-more-btn:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        /* ── Floating Back to Top & Tracker Capsule ─────────── */
        .eb-shop-scroll-top-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 40;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(85, 0, 10, 0.94);
          color: #FFF8EC;
          border: 1px solid rgba(200, 154, 61, 0.5);
          border-radius: 999px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
          box-shadow: 0 8px 24px rgba(85, 0, 10, 0.30), 0 2px 6px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(8px);
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          animation: ebFadeInUp 0.25s ease-out;
        }

        .eb-shop-scroll-top-btn:hover {
          background: #6B000D;
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(85, 0, 10, 0.38);
          border-color: #D4AA45;
        }

        @keyframes ebFadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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

          {/* Scroll Anchor */}
          <div ref={gridTopRef} style={{ scrollMarginTop: '100px' }} />

          {/* 4.5. Smart View Mode & Performance Toolbar */}
          <div className="eb-shop-toolbar">
            <div className="eb-shop-toolbar-status">
              <span className="eb-shop-toolbar-count">
                {viewMode === 'pages' ? (
                  <>
                    Showing <strong>{totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)}</strong> of <strong>{totalCount}</strong> Delicacies
                  </>
                ) : (
                  <>
                    Showing <strong>{products.length}</strong> of <strong>{totalCount}</strong> Delicacies
                  </>
                )}
              </span>
              {viewMode === 'stream' && totalCount > 0 && (
                <div className="eb-shop-progress-bar-wrap" title={`${Math.min(100, Math.round((products.length / totalCount) * 100))}% loaded`}>
                  <div
                    className="eb-shop-progress-bar-fill"
                    style={{ width: `${Math.min(100, Math.round((products.length / totalCount) * 100))}%` }}
                  />
                </div>
              )}
            </div>

            <div className="eb-shop-mode-selector" role="radiogroup" aria-label="Catalog browsing mode">
              <button
                type="button"
                className={`eb-shop-mode-btn ${viewMode === 'pages' ? 'eb-shop-mode-btn--active' : ''}`}
                onClick={() => handleViewModeChange('pages')}
                title="Windowed Pagination: loads 12 items at a time and dis-loads previous to maximize speed & reduce database load"
                aria-checked={viewMode === 'pages'}
                role="radio"
              >
                <Layers size={14} />
                <span>Pages (Lean)</span>
              </button>
              <button
                type="button"
                className={`eb-shop-mode-btn ${viewMode === 'stream' ? 'eb-shop-mode-btn--active' : ''}`}
                onClick={() => handleViewModeChange('stream')}
                title="Continuous Stream: scrolls smoothly with automatic off-screen DOM virtualization"
                aria-checked={viewMode === 'stream'}
                role="radio"
              >
                <Sparkles size={14} />
                <span>Continuous Stream</span>
              </button>
            </div>
          </div>

          {/* 5. Product Grid */}
          {initialLoading ? (
            <div className="eb-product-grid" role="status" aria-label="Loading delicacies">
              <SkeletonStyles />
              {Array.from({ length: 6 }).map((_, n) => (
                <ProductCardSkeleton key={`skeleton-${n}`} />
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
                  Array.from({ length: 3 }).map((_, n) => (
                    <ProductCardSkeleton key={`more-skeleton-${n}`} />
                  ))}
              </div>

              {/* Windowed Pagination Bar (active in Pages mode) */}
              {viewMode === 'pages' && totalPages > 1 && (
                <nav className="eb-shop-pagination" aria-label="Delicacies pagination">
                  <button
                    type="button"
                    className="eb-shop-page-nav-btn"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  <div className="eb-shop-page-numbers">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      const isActive = pageNum === page;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          className={`eb-shop-page-num ${isActive ? 'eb-shop-page-num--active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={`Page ${pageNum}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="eb-shop-page-nav-btn"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    aria-label="Next Page"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </nav>
              )}

              {/* Continuous Stream Load More Button & Sentinel */}
              {viewMode === 'stream' && (
                <>
                  {hasMore && (
                    <div className="eb-shop-load-more-wrap">
                      <button
                        type="button"
                        className="eb-shop-load-more-btn"
                        disabled={loadingMore}
                        onClick={() => fetchProductsBatch(page + 1, false)}
                      >
                        {loadingMore ? 'Loading Next Delicacies…' : `Load Next ${Math.min(STREAM_PAGE_SIZE, Math.max(1, totalCount - products.length))} Delicacies`}
                      </button>
                    </div>
                  )}

                  {/* Scroll Sentinel for triggering subsequent batches */}
                  {hasMore && (
                    <div
                      ref={sentinelRef}
                      style={{ height: '30px', margin: '20px 0', opacity: 0 }}
                      aria-hidden="true"
                    />
                  )}
                </>
              )}

              {/* End of catalog indicator */}
              {((viewMode === 'stream' && !hasMore) || (viewMode === 'pages' && page === totalPages)) && products.length > 0 && (
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

          {/* Floating Back to Top & Tracker Capsule */}
          {showScrollTop && (
            <button
              type="button"
              onClick={scrollToTop}
              className="eb-shop-scroll-top-btn"
              aria-label="Back to top of collection"
            >
              <ArrowUp size={16} />
              <span>Viewing {products.length} of {totalCount} • Top</span>
            </button>
          )}
        </div>
      </main>

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
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
