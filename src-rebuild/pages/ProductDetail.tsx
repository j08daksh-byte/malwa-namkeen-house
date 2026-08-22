import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/sections/Footer';
import ProductCard from '../components/shop/ProductCard';
import ProductQuickViewModal from '../components/shop/ProductQuickViewModal';
import CartDrawer from '../components/shop/CartDrawer';
import CheckoutModal from '../components/shop/CheckoutModal';
import ShopToast from '../components/shop/ShopToast';
import { type Product, type ProductWeightOption } from '../data/products';
import { useCart } from '../lib/cartContext';
import { useWishlist } from '../lib/wishlistContext';
import { BUSINESS } from '../lib/business';
import { optimizeCloudinary } from '../lib/cloudinary';
import {
  ChevronRight,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Heart,
  Share2,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  Flame,
  Check,
  AlertCircle,
  ArrowLeft,
  X,
  Maximize2,
  Package,
} from 'lucide-react';

// Helper to reliably find product in fallback catalog by any slug or name permutation
function findStaticProduct(slugOrId?: string): Product | null {
  if (!slugOrId) return null;
  const decoded = decodeURIComponent(slugOrId).trim().toLowerCase();
  const normalized = decoded.replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
  const cleanAlphaNumeric = decoded.replace(/[^a-z0-9]/g, '');

  const directMatch = FALLBACK_PRODUCTS.find(p => {
    const pId = (p.id || '').toLowerCase();
    const pSlug = (p.slug || '').toLowerCase();
    const pName = (p.name || '').toLowerCase();
    const pNameNorm = pName.replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
    const pNameClean = pName.replace(/[^a-z0-9]/g, '');
    const pIdClean = pId.replace(/[^a-z0-9]/g, '');

    return (
      pId === decoded ||
      pId === normalized ||
      pSlug === decoded ||
      pSlug === normalized ||
      pIdClean === cleanAlphaNumeric ||
      pNameNorm === normalized ||
      pNameClean === cleanAlphaNumeric
    );
  });

  if (directMatch) return directMatch;

  return (
    FALLBACK_PRODUCTS.find(p => {
      const pId = (p.id || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      return pId.includes(normalized) || normalized.includes(pId) || pName.includes(decoded);
    }) || null
  );
}

function getStaticRelatedProducts(prod: Product): Product[] {
  const sameCat = FALLBACK_PRODUCTS.filter(
    p => (p.category === prod.category || p.categoryLabel === prod.categoryLabel) && p.id !== prod.id
  );
  if (sameCat.length > 0) {
    return sameCat.slice(0, 4);
  }
  return FALLBACK_PRODUCTS.filter(p => p.id !== prod.id).slice(0, 4);
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { addToCart, openCart, toastMessage, dismissToast } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const initialStaticProduct = useMemo(() => findStaticProduct(slug), [slug]);

  const [product, setProduct] = useState<Product | null>(() => initialStaticProduct);
  const [selectedOption, setSelectedOption] = useState<ProductWeightOption | null>(
    () => initialStaticProduct?.options?.[0] || null
  );
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(() => !initialStaticProduct);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Related products state
  const [relatedProducts, setRelatedProducts] = useState<Product[]>(() =>
    initialStaticProduct ? getStaticRelatedProducts(initialStaticProduct) : []
  );
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // 1. Fetch Product by Slug or ID with fallback
  const fetchProduct = useCallback(async () => {
    if (!slug) return;
    const staticProd = findStaticProduct(slug);

    if (staticProd) {
      setProduct(prev => prev || staticProd);
      setSelectedOption(prev => prev || staticProd.options?.[0] || { weight: 'Standard', price: 150 });
      setRelatedProducts(prev => (prev.length > 0 ? prev : getStaticRelatedProducts(staticProd)));
    }

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.product) {
          const prod: Product = data.product;
          setProduct(prod);
          setSelectedImageIdx(0);
          setQuantity(1);

          // Select first active variant
          const firstOpt = prod.options?.[0] || { weight: 'Standard', price: 150 };
          setSelectedOption(firstOpt);

          // Fetch related products from category
          if (prod.category || (prod as any).categoryId) {
            const catId = (prod as any).categoryId || prod.category;
            fetch(`/api/products?category=${encodeURIComponent(catId)}&limit=5`)
              .then(r => (r.ok ? r.json() : null))
              .then(relData => {
                if (relData?.success && Array.isArray(relData.products)) {
                  setRelatedProducts(
                    relData.products.filter((p: Product) => p.id !== prod.id && (p as any)._id !== prod.id).slice(0, 4)
                  );
                }
              })
              .catch(() => {});
          }
          setApiError(null);
          setLoading(false);
          return;
        }
      }

      // If API returned 404 or empty, but static item exists
      if (staticProd) {
        setProduct(staticProd);
        setSelectedOption(staticProd.options?.[0] || { weight: 'Standard', price: 150 });
        setRelatedProducts(getStaticRelatedProducts(staticProd));
        setApiError(null);
        setLoading(false);
        return;
      }

      setProduct(null);
    } catch (_err: unknown) {
      if (staticProd) {
        setProduct(staticProd);
        setSelectedOption(staticProd.options?.[0] || { weight: 'Standard', price: 150 });
        setRelatedProducts(getStaticRelatedProducts(staticProd));
        setApiError(null);
      } else {
        setProduct(null);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [fetchProduct]);

  // 2. Dynamic SEO & JSON-LD Structured Data
  useEffect(() => {
    if (!product) return;

    // Document Title & Meta Description
    document.title = `${product.name} ${product.hindiName ? `(${product.hindiName})` : ''} — ${BUSINESS.name}`;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const cleanDesc = (product.description || product.tagline || '').slice(0, 160);
    metaDesc.setAttribute('content', cleanDesc);

    // JSON-LD Product Schema
    const scriptId = 'product-jsonld-schema';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const currentPrice = selectedOption?.price || (product as any).price || 150;
    const currentStock = (selectedOption as any)?.stock ?? 50;

    const schemaData = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      image: Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image],
      description: product.description || product.tagline,
      brand: {
        '@type': 'Brand',
        name: BUSINESS.name,
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: currentPrice,
        availability: currentStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: BUSINESS.name,
        },
      },
    };

    scriptTag.textContent = JSON.stringify(schemaData);

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();
    };
  }, [product, selectedOption]);

  // Image list
  const imageList = useMemo<string[]>(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    return [product.image || '/mishtichaat/chaat-plate.jpg'];
  }, [product]);

  const activeImage = imageList[selectedImageIdx] || imageList[0];

  const isWishlisted = product ? isInWishlist(product.id || (product as any)._id) : false;
  const isAvailable = product?.isAvailable && ((selectedOption as any)?.stock === undefined || (selectedOption as any)?.stock > 0);
  const maxStock = typeof (selectedOption as any)?.stock === 'number' ? (selectedOption as any).stock : 100;

  // Handle Add to Cart
  const handleAddToCart = () => {
    if (!product || !selectedOption || !isAvailable) return;
    setIsAdding(true);
    addToCart(product, selectedOption, quantity);
    setTimeout(() => {
      setIsAdding(false);
      openCart();
    }, 350);
  };

  // Handle Social Share
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = product ? `${product.name} | ${BUSINESS.name}` : BUSINESS.name;
    const shareText = product?.tagline || 'Explore authentic Malwa delicacies.';

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // Fallback to clipboard
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('Link copied to clipboard!');
        setTimeout(() => setShareFeedback(null), 2500);
      } catch {
        setShareFeedback('Could not copy link.');
      }
    }
  };

  // ── Render Loading Skeleton ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="pdp-wrapper">
        <Navbar />
        <main className="pdp-container pdp-loading-skeleton">
          <div className="pdp-skeleton-gallery" />
          <div className="pdp-skeleton-details">
            <div className="pdp-sk-line" style={{ width: '40%', height: '14px' }} />
            <div className="pdp-sk-line" style={{ width: '80%', height: '36px', marginTop: '12px' }} />
            <div className="pdp-sk-line" style={{ width: '50%', height: '24px', marginTop: '8px' }} />
            <div className="pdp-sk-line" style={{ width: '100%', height: '80px', marginTop: '20px' }} />
            <div className="pdp-sk-line" style={{ width: '60%', height: '48px', marginTop: '24px' }} />
            <div className="pdp-sk-line" style={{ width: '100%', height: '54px', marginTop: '24px', borderRadius: '999px' }} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Render 404 / Nonexistent Product ───────────────────────────────────────
  if (!product && !loading && !apiError) {
    return (
      <div className="pdp-wrapper">
        <Navbar />
        <main className="pdp-not-found">
          <div className="pdp-empty-badge">
            <Package size={36} />
          </div>
          <h1>Delicacy Not Found</h1>
          <p>
            The Malwa delicacy you are searching for is currently unavailable or has been moved to our seasonal archives.
          </p>
          <Link to="/shop" className="pdp-btn-primary" style={{ width: 'max-content', margin: '24px auto 0' }}>
            <ArrowLeft size={16} /> Explore All Delicacies
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Render Error State ─────────────────────────────────────────────────────
  if (apiError) {
    return (
      <div className="pdp-wrapper">
        <Navbar />
        <main className="pdp-not-found">
          <div className="pdp-empty-badge" style={{ color: '#DC2626', background: '#FEE2E2' }}>
            <AlertCircle size={36} />
          </div>
          <h1>Unable to Load Product</h1>
          <p>{apiError}</p>
          <button onClick={fetchProduct} className="pdp-btn-primary" style={{ width: 'max-content', margin: '24px auto 0' }}>
            Try Again
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product || !selectedOption) return null;

  const discountPercent =
    selectedOption.originalPrice && selectedOption.originalPrice > selectedOption.price
      ? Math.round(((selectedOption.originalPrice - selectedOption.price) / selectedOption.originalPrice) * 100)
      : 0;

  return (
    <div className="pdp-wrapper">
      <style>{`
        .pdp-wrapper {
          background-color: var(--bg-parchment, #F6EFE3);
          color: var(--text-dark, #34211D);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .pdp-container {
          width: min(100%, 1240px);
          margin: 0 auto;
          padding: clamp(24px, 3.5vw, 48px) clamp(16px, 3vw, 40px) clamp(60px, 8vw, 96px);
        }

        /* ── Breadcrumb ────────────────────────────────────────── */
        .pdp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: Inter, sans-serif;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #75645C;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .pdp-breadcrumb a {
          color: #75645C;
          text-decoration: none;
          transition: color 0.15s;
        }

        .pdp-breadcrumb a:hover {
          color: #55000A;
        }

        .pdp-breadcrumb span {
          color: #34211D;
        }

        /* ── Product Hero Layout ───────────────────────────────── */
        .pdp-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
          gap: clamp(28px, 4vw, 56px);
          align-items: start;
        }

        /* ── Gallery ───────────────────────────────────────────── */
        .pdp-gallery-card {
          background: #FFFDF8;
          border: 1px solid rgba(200, 154, 61, 0.32);
          border-radius: 20px;
          overflow: hidden;
          padding: 16px;
          box-shadow: 0 10px 30px rgba(85, 0, 10, 0.05);
          position: sticky;
          top: 96px;
        }

        .pdp-main-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 1.12 / 1;
          border-radius: 14px;
          overflow: hidden;
          background: #55000A;
          cursor: zoom-in;
        }

        .pdp-main-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .pdp-main-image-wrap:hover .pdp-main-image {
          transform: scale(1.03);
        }

        .pdp-badge-pill {
          position: absolute;
          top: 14px;
          left: 14px;
          background: #3C0815;
          color: #F0DFA0;
          font-family: Inter, sans-serif;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 999px;
          border: 1px solid rgba(200, 154, 61, 0.45);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
          display: flex;
          align-items: center;
          gap: 5px;
          z-index: 2;
        }

        .pdp-zoom-btn {
          position: absolute;
          bottom: 14px;
          right: 14px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(200, 154, 61, 0.35);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          cursor: pointer;
          color: #3C0815;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: transform 0.15s, background 0.15s;
          z-index: 2;
        }

        .pdp-zoom-btn:hover {
          transform: scale(1.08);
          background: #FFFFFF;
        }

        .pdp-thumbnail-row {
          display: flex;
          gap: 10px;
          margin-top: 14px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .pdp-thumb-btn {
          width: 68px;
          height: 68px;
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          background: #EAE3D2;
          flex-shrink: 0;
          padding: 0;
          transition: border-color 0.15s, transform 0.15s;
        }

        .pdp-thumb-btn--active {
          border-color: #D4AA45;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(201, 154, 50, 0.25);
        }

        .pdp-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* ── Product Info ──────────────────────────────────────── */
        .pdp-title-section {
          margin-bottom: 20px;
        }

        .pdp-category-tag {
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #D4AA45;
          display: inline-block;
          margin-bottom: 6px;
        }

        .pdp-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .pdp-title {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(34px, 4.2vw, 48px);
          font-weight: 700;
          color: #3C0815;
          line-height: 1.08;
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }

        .pdp-hindi-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(20px, 2.2vw, 26px);
          font-weight: 500;
          color: #75645C;
          margin: 0 0 12px;
        }

        .pdp-tagline {
          font-family: Inter, sans-serif;
          font-size: 14.5px;
          font-style: italic;
          color: #55000A;
          margin: 0 0 16px;
        }

        .pdp-meta-pills {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .pdp-veg-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #065F46;
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .pdp-veg-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #059669;
        }

        .pdp-spice-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          color: #991B1B;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .pdp-rating-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          font-weight: 800;
          color: #3C0815;
          background: #FFF9EF;
          border: 1px solid rgba(200, 154, 61, 0.4);
          padding: 4px 10px;
          border-radius: 6px;
        }

        /* ── Price Block ───────────────────────────────────────── */
        .pdp-price-card {
          background: #FFFDF8;
          border: 1px solid rgba(200, 154, 61, 0.28);
          border-radius: 16px;
          padding: 20px 24px;
          margin-bottom: 24px;
        }

        .pdp-price-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 6px;
        }

        .pdp-price-current {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 38px;
          font-weight: 700;
          color: #3C0815;
          line-height: 1;
        }

        .pdp-price-original {
          font-family: Inter, sans-serif;
          font-size: 18px;
          color: #8C786E;
          text-decoration: line-through;
        }

        .pdp-price-save {
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 800;
          color: #059669;
          background: #D1FAE5;
          padding: 3px 8px;
          border-radius: 999px;
          text-transform: uppercase;
        }

        .pdp-sku-row {
          font-size: 11px;
          color: #75645C;
          font-family: monospace;
          margin-top: 4px;
        }

        /* ── Variant Selector ──────────────────────────────────── */
        .pdp-variant-section {
          margin-bottom: 24px;
        }

        .pdp-section-label {
          font-family: Inter, sans-serif;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: #34211D;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
        }

        .pdp-variant-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 10px;
        }

        .pdp-variant-card {
          border: 1px solid rgba(200, 154, 61, 0.35);
          background: #FFFFFF;
          border-radius: 12px;
          padding: 10px 12px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.15s;
          text-align: center;
        }

        .pdp-variant-card:hover {
          border-color: #D4AA45;
          transform: translateY(-1px);
        }

        .pdp-variant-card--active {
          border: 2px solid #55000A;
          background: #FFFDF8;
          box-shadow: 0 4px 12px rgba(85, 0, 10, 0.08);
        }

        .pdp-variant-card--disabled {
          opacity: 0.45;
          cursor: not-allowed;
          background: #F3ECE1;
          border-style: dashed;
        }

        .pdp-variant-weight {
          font-family: Inter, sans-serif;
          font-size: 13px;
          font-weight: 800;
          color: #34211D;
          margin-bottom: 2px;
        }

        .pdp-variant-price {
          font-size: 12px;
          font-weight: 700;
          color: #55000A;
        }

        /* ── Add to Cart & Quantity ────────────────────────────── */
        .pdp-purchase-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .pdp-qty-stepper {
          display: flex;
          align-items: center;
          border: 1px solid rgba(200, 154, 61, 0.38);
          background: #FFFFFF;
          border-radius: 999px;
          padding: 4px;
        }

        .pdp-qty-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: #3C0815;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: background 0.15s;
        }

        .pdp-qty-btn:hover {
          background: #F6EFE3;
        }

        .pdp-qty-val {
          font-family: Inter, sans-serif;
          font-size: 14px;
          font-weight: 800;
          padding: 0 12px;
          min-width: 28px;
          text-align: center;
        }

        .pdp-btn-add {
          flex: 1;
          min-width: 200px;
          height: 48px;
          background: #3C0815;
          color: #FFF8EC;
          border: none;
          border-radius: 999px;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 6px 20px rgba(60, 8, 21, 0.25);
          transition: background 0.18s, transform 0.18s;
        }

        .pdp-btn-add:hover {
          background: #55000A;
          transform: translateY(-1px);
        }

        .pdp-btn-add:disabled {
          background: #8C786E;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .pdp-action-icon-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid rgba(200, 154, 61, 0.35);
          background: #FFFFFF;
          display: grid;
          place-items: center;
          cursor: pointer;
          color: #3C0815;
          transition: border-color 0.15s, transform 0.15s;
        }

        .pdp-action-icon-btn:hover {
          border-color: #55000A;
          transform: translateY(-1px);
        }

        /* ── Highlights / Trust ────────────────────────────────── */
        .pdp-trust-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          border-top: 1px solid rgba(200, 154, 61, 0.25);
          padding-top: 20px;
        }

        .pdp-trust-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          font-weight: 700;
          color: #75645C;
        }

        .pdp-trust-icon {
          color: #D4AA45;
          flex-shrink: 0;
        }

        /* ── Detailed Info Tabs / Cards ────────────────────────── */
        .pdp-details-section {
          margin-top: 56px;
          background: #FFFDF8;
          border: 1px solid rgba(200, 154, 61, 0.28);
          border-radius: 20px;
          padding: clamp(24px, 4vw, 40px);
          box-shadow: 0 6px 24px rgba(85, 0, 10, 0.04);
        }

        .pdp-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
        }

        .pdp-detail-card h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          color: #3C0815;
          margin: 0 0 12px;
        }

        .pdp-detail-card p {
          font-size: 14px;
          line-height: 1.75;
          color: #4A3530;
          margin: 0 0 14px;
        }

        .pdp-ingredients-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .pdp-chip {
          background: #F6EFE3;
          border: 1px solid rgba(200, 154, 61, 0.3);
          color: #3C0815;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 999px;
        }

        .pdp-specs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .pdp-specs-table tr {
          border-bottom: 1px solid rgba(200, 154, 61, 0.18);
        }

        .pdp-specs-table td {
          padding: 8px 0;
        }

        .pdp-specs-table td:first-child {
          color: #75645C;
          font-weight: 600;
          width: 42%;
        }

        .pdp-specs-table td:last-child {
          color: #34211D;
          font-weight: 700;
        }

        /* ── Related Products ──────────────────────────────────── */
        .pdp-related-section {
          margin-top: 64px;
        }

        .pdp-related-heading {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(28px, 3.5vw, 38px);
          font-weight: 700;
          color: #3C0815;
          margin: 0 0 24px;
          text-align: center;
        }

        .pdp-related-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        /* ── Mobile Sticky Purchase Bar ────────────────────────── */
        .pdp-mobile-bar {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #FFFFFF;
          border-top: 1px solid rgba(200, 154, 61, 0.35);
          padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
          box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.12);
          z-index: 100;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        /* ── Skeletons & States ────────────────────────────────── */
        .pdp-loading-skeleton {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          padding-top: 40px;
        }

        .pdp-skeleton-gallery {
          aspect-ratio: 1.12 / 1;
          background: #EAE3D2;
          border-radius: 20px;
          animation: pulse 1.5s infinite ease-in-out;
        }

        .pdp-sk-line {
          background: #EAE3D2;
          border-radius: 6px;
          animation: pulse 1.5s infinite ease-in-out;
        }

        .pdp-not-found {
          max-width: 500px;
          margin: 80px auto;
          text-align: center;
          padding: 24px;
        }

        .pdp-empty-badge {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(201, 154, 50, 0.15);
          color: #D4AA45;
          display: grid;
          place-items: center;
          margin: 0 auto 16px;
        }

        .pdp-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 46px;
          padding: 0 24px;
          background: #3C0815;
          color: #FFF8EC;
          border-radius: 999px;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          border: none;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 960px) {
          .pdp-related-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .pdp-hero-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .pdp-gallery-card {
            position: static;
            padding: 12px;
            border-radius: 16px;
          }
          .pdp-thumb-btn {
            width: 56px;
            height: 56px;
          }
          .pdp-mobile-bar {
            display: flex;
          }
          .pdp-container {
            padding: 16px 14px calc(96px + env(safe-area-inset-bottom, 0px));
          }
          .pdp-trust-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .shop-floating-cart {
            bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;
          }
        }

        @media (max-width: 640px) {
          .pdp-related-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          .pdp-details-section {
            padding: 20px 16px;
            border-radius: 16px;
            margin-top: 36px;
          }
          .pdp-related-section {
            margin-top: 40px;
          }
        }

        @media (max-width: 380px) {
          .pdp-title {
            font-size: 28px;
          }
          .pdp-hindi-title {
            font-size: 18px;
          }
          .pdp-related-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
        }
      `}</style>

      <Navbar />

      <main className="pdp-container">
        {/* Breadcrumb */}
        <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={13} />
          <Link to="/shop">The Shop</Link>
          <ChevronRight size={13} />
          <Link to={`/shop?category=${encodeURIComponent(product.category || '')}`}>
            {product.categoryLabel || 'Heritage Collection'}
          </Link>
          <ChevronRight size={13} />
          <span>{product.name}</span>
        </nav>

        {/* Main Hero Product Grid */}
        <div className="pdp-hero-grid">
          {/* Gallery Column */}
          <div className="pdp-gallery-card">
            <div className="pdp-main-image-wrap" onClick={() => setIsLightboxOpen(true)}>
              <img
                src={optimizeCloudinary(activeImage, { width: 900, quality: 'auto', format: 'auto' })}
                alt={product.name}
                className="pdp-main-image"
                loading="eager"
                onError={e => {
                  const el = e.currentTarget;
                  if (!el.src.includes('/mishtichaat/chaat-plate.jpg')) {
                    el.src = '/mishtichaat/chaat-plate.jpg';
                  }
                }}
              />

              {product.badge && (
                <div className="pdp-badge-pill">
                  <Sparkles size={12} /> {product.badge}
                </div>
              )}

              <button
                type="button"
                className="pdp-zoom-btn"
                onClick={e => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                }}
                aria-label="Zoom image"
              >
                <Maximize2 size={16} />
              </button>
            </div>

            {/* Thumbnail Row if multiple images */}
            {imageList.length > 1 && (
              <div className="pdp-thumbnail-row" role="tablist" aria-label="Product thumbnails">
                {imageList.map((imgUrl, idx) => (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    role="tab"
                    aria-selected={selectedImageIdx === idx}
                    className={`pdp-thumb-btn ${selectedImageIdx === idx ? 'pdp-thumb-btn--active' : ''}`}
                    onClick={() => setSelectedImageIdx(idx)}
                  >
                    <img
                      src={optimizeCloudinary(imgUrl, { width: 180, height: 180, crop: 'fill', quality: 'auto', format: 'auto' })}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="pdp-thumb-img"
                      onError={e => {
                        const el = e.currentTarget;
                        if (!el.src.includes('/mishtichaat/chaat-plate.jpg')) {
                          el.src = '/mishtichaat/chaat-plate.jpg';
                        }
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Purchase Column */}
          <div className="pdp-details-column">
            <div className="pdp-title-section">
              <span className="pdp-category-tag">{product.categoryLabel || 'Heritage Namkeen'}</span>

              <div className="pdp-title-row">
                <h1 className="pdp-title">{product.name}</h1>
              </div>

              {product.hindiName && (
                <div className="pdp-hindi-title">{product.hindiName}</div>
              )}

              {product.tagline && (
                <div className="pdp-tagline">“{product.tagline}”</div>
              )}

              {/* Meta Badges */}
              <div className="pdp-meta-pills">
                <div className="pdp-veg-badge">
                  <span className="pdp-veg-dot" /> 100% Pure Vegetarian
                </div>

                <div className="pdp-spice-badge">
                  <Flame size={13} /> {product.spiceLevel || 'Medium'}
                </div>

                <div className="pdp-rating-badge">
                  <Star size={13} fill="#D4AA45" stroke="none" />
                  <span>{product.rating ?? 4.9}</span>
                  <span style={{ color: '#75645C', fontWeight: 500 }}>
                    ({product.reviewCount ?? 120} Reviews)
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '14.5px', lineHeight: 1.7, color: '#4A3530', margin: '0 0 20px' }}>
                {product.description}
              </p>
            </div>

            {/* Price Card */}
            <div className="pdp-price-card">
              <div className="pdp-price-row">
                <span className="pdp-price-current">₹{selectedOption.price}</span>
                {selectedOption.originalPrice && selectedOption.originalPrice > selectedOption.price && (
                  <span className="pdp-price-original">₹{selectedOption.originalPrice}</span>
                )}
                {discountPercent > 0 && (
                  <span className="pdp-price-save">{discountPercent}% Off</span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#75645C' }}>
                Inclusive of all taxes · Prepared in 100% pure cold-pressed groundnut oil
              </div>
              {(selectedOption as any)?.sku && (
                <div className="pdp-sku-row">SKU: {(selectedOption as any).sku}</div>
              )}
            </div>

            {/* Dynamic Variant Selector */}
            <div className="pdp-variant-section">
              <div className="pdp-section-label">
                <span>Select Packaging / Weight</span>
                <span style={{ color: '#55000A', textTransform: 'none' }}>
                  {selectedOption.weight}
                </span>
              </div>

              <div className="pdp-variant-grid" role="radiogroup" aria-label="Available product packaging options">
                {(product.options || []).map((opt, idx) => {
                  const isSelected = selectedOption.weight === opt.weight || (selectedOption as any).id === (opt as any).id;
                  const isOptSoldOut = typeof (opt as any).stock === 'number' && (opt as any).stock <= 0;

                  return (
                    <div
                      key={`${opt.weight}-${idx}`}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={isOptSoldOut ? -1 : 0}
                      className={`pdp-variant-card ${isSelected ? 'pdp-variant-card--active' : ''} ${isOptSoldOut ? 'pdp-variant-card--disabled' : ''}`}
                      onClick={() => {
                        if (!isOptSoldOut) {
                          setSelectedOption(opt);
                          setQuantity(1);
                        }
                      }}
                      onKeyDown={e => {
                        if ((e.key === 'Enter' || e.key === ' ') && !isOptSoldOut) {
                          setSelectedOption(opt);
                          setQuantity(1);
                        }
                      }}
                    >
                      <div className="pdp-variant-weight">{opt.weight}</div>
                      <div className="pdp-variant-price">₹{opt.price}</div>
                      {isOptSoldOut && (
                        <div style={{ fontSize: '10px', color: '#DC2626', fontWeight: 800, marginTop: '2px' }}>
                          Sold Out
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quantity and Add to Cart Action */}
            <div className="pdp-purchase-actions">
              <div className="pdp-qty-stepper" aria-label="Quantity selector">
                <button
                  type="button"
                  className="pdp-qty-btn"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || !isAvailable}
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <span className="pdp-qty-val">{quantity}</span>
                <button
                  type="button"
                  className="pdp-qty-btn"
                  onClick={() => setQuantity(q => Math.min(maxStock, q + 1))}
                  disabled={quantity >= maxStock || !isAvailable}
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>

              <button
                type="button"
                className="pdp-btn-add"
                onClick={handleAddToCart}
                disabled={!isAvailable || isAdding}
              >
                <ShoppingBag size={16} />
                {!isAvailable
                  ? 'Currently Sold Out'
                  : isAdding
                  ? 'Adding to Cart…'
                  : `Add to Cart • ₹${selectedOption.price * quantity}`}
              </button>

              {/* Wishlist Button */}
              <button
                type="button"
                className="pdp-action-icon-btn"
                onClick={() => toggleWishlist(product)}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                style={{ color: isWishlisted ? '#DC2626' : '#3C0815' }}
              >
                <Heart size={18} fill={isWishlisted ? '#DC2626' : 'none'} />
              </button>

              {/* Share Button */}
              <button
                type="button"
                className="pdp-action-icon-btn"
                onClick={handleShare}
                aria-label="Share this delicacy"
              >
                <Share2 size={18} />
              </button>
            </div>

            {shareFeedback && (
              <div style={{ background: '#ECFDF5', color: '#065F46', fontSize: '12px', padding: '8px 12px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} /> {shareFeedback}
              </div>
            )}

            {/* Trust Badges */}
            <div className="pdp-trust-grid">
              <div className="pdp-trust-item">
                <ShieldCheck size={18} className="pdp-trust-icon" />
                <span>Small Batch Freshness</span>
              </div>
              <div className="pdp-trust-item">
                <Truck size={18} className="pdp-trust-icon" />
                <span>Free Shipping over ₹499</span>
              </div>
              <div className="pdp-trust-item">
                <RotateCcw size={18} className="pdp-trust-icon" />
                <span>Authentic Malwa Spices</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Product Specifications & Story */}
        <section className="pdp-details-section">
          <div className="pdp-details-grid">
            {/* Story */}
            {product.story && (
              <div className="pdp-detail-card">
                <h3>Heritage & Craft Story</h3>
                <p>{product.story}</p>
                <p style={{ fontStyle: 'italic', color: '#75645C' }}>
                  Handcrafted following traditional recipe proportions preserved through generations.
                </p>
              </div>
            )}

            {/* Ingredients */}
            {Array.isArray(product.ingredients) && product.ingredients.length > 0 && (
              <div className="pdp-detail-card">
                <h3>Authentic Ingredients</h3>
                <p>Pure ingredients sourced directly from prime regional harvests:</p>
                <div className="pdp-ingredients-chips">
                  {product.ingredients.map((ing, i) => (
                    <span key={i} className="pdp-chip">{ing}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications Table */}
            <div className="pdp-detail-card">
              <h3>Delicacy Specifications</h3>
              <table className="pdp-specs-table">
                <tbody>
                  <tr>
                    <td>Shelf Life</td>
                    <td>{product.shelfLife || '90 Days from packaging'}</td>
                  </tr>
                  <tr>
                    <td>Cooking Oil</td>
                    <td>{product.oilUsed || 'Pure Cold-Pressed Groundnut Oil'}</td>
                  </tr>
                  <tr>
                    <td>Dietary Standard</td>
                    <td>100% Pure Vegetarian (Satvik)</td>
                  </tr>
                  <tr>
                    <td>Spice Level</td>
                    <td>{product.spiceLevel || 'Medium Malwa Spice'}</td>
                  </tr>
                  <tr>
                    <td>Packaging</td>
                    <td>Food-Grade Multi-Layer Aroma Seal</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="pdp-related-section">
            <h2 className="pdp-related-heading">More Heritage Pairings</h2>
            <div className="pdp-related-grid">
              {relatedProducts.map(relProd => (
                <ProductCard
                  key={relProd.id}
                  product={relProd}
                  onQuickView={p => setQuickViewProduct(p)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Mobile Sticky Bar */}
      <aside className="pdp-mobile-bar" aria-label="Quick purchase bar">
        <div>
          <div style={{ fontSize: '11px', color: '#75645C' }}>{selectedOption.weight}</div>
          <div style={{ fontWeight: 800, fontSize: '18px', color: '#3C0815' }}>
            ₹{selectedOption.price * quantity}
          </div>
        </div>

        <button
          type="button"
          className="pdp-btn-add"
          style={{ minWidth: '150px', height: '42px' }}
          onClick={handleAddToCart}
          disabled={!isAvailable || isAdding}
        >
          <ShoppingBag size={14} />
          {!isAvailable ? 'Sold Out' : isAdding ? 'Adding…' : 'Add to Bag'}
        </button>
      </aside>

      {/* Lightbox / Zoom Modal */}
      {isLightboxOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 10, 15, 0.94)',
            backdropFilter: 'blur(8px)',
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'grid',
              placeItems: 'center',
              color: '#FFF8EC',
              cursor: 'pointer',
            }}
            aria-label="Close image zoom"
          >
            <X size={20} />
          </button>

          <img
            src={activeImage}
            alt={product.name}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
            }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      <ShopToast />

      <Footer />
    </div>
  );
}
