import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Product, type ProductWeightOption } from '../../data/products';
import { useCart } from '../../lib/cartContext';
import { useWishlist } from '../../lib/wishlistContext';
import { optimizeCloudinary } from '../../lib/cloudinary';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id || (product as any)._id);
  const [selectedOption, setSelectedOption] = useState<ProductWeightOption>(
    product.options?.[0] || { weight: 'Standard', price: 150 }
  );
  const [isAdding, setIsAdding] = useState(false);

  // Check if currently selected weight is in the cart
  const cartItem = cart.find(
    item => item.product.id === product.id && item.selectedOption.weight === selectedOption.weight
  );
  const quantityInCart = cartItem?.quantity ?? 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    addToCart(product, selectedOption, 1);
    setTimeout(() => setIsAdding(false), 500);
  };

  // Determine badge text: only show if explicitly given or bestseller
  const badgeText = product.badge?.trim() || (product.isBestSeller ? 'BESTSELLER' : undefined);

  // Oil / Purity feature tag: only show if oilUsed is provided
  const oilBadgeText = product.oilUsed?.trim()
    ? product.oilUsed.includes('Desi Cow Ghee') || product.oilUsed.includes('Ghee')
      ? 'Pure Desi Ghee'
      : product.oilUsed
    : undefined;

  const productUrl = `/product/${product.slug || product.id}`;

  return (
    <article className="eb-product-card" aria-label={product.name}>
      <style>{`
        .eb-product-card {
          background: #FFFFFF;
          border: 1.5px solid rgba(200, 154, 61, 0.22);
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 18px rgba(85, 0, 10, 0.04);
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease, border-color 0.28s ease;
          position: relative;
        }

        .eb-product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(85, 0, 10, 0.10);
          border-color: rgba(201, 154, 50, 0.6);
        }

        /* ── Image & Badges Media Container ────────────────── */
        .eb-product-card__media {
          position: relative;
          width: 100%;
          aspect-ratio: 1.15 / 1;
          background: #F8F4EE;
          overflow: hidden;
          cursor: pointer;
        }

        .eb-product-card__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .eb-product-card:hover .eb-product-card__img {
          transform: scale(1.06);
        }

        /* Top Left Highlight Tag (e.g. UNIQUE FLAVOUR / BESTSELLER / NEW) */
        .eb-product-card__badge-tag {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #FFD43B;
          color: #1A1A1A;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 9px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          z-index: 3;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        /* Bottom Left Rating Pill (like Eat Better ★ 4.9) */
        .eb-product-card__rating-pill {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(200, 154, 61, 0.35);
          border-radius: 6px;
          padding: 3px 8px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          color: #2D231E;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.10);
          z-index: 3;
          backdrop-filter: blur(4px);
        }

        .eb-product-card__rating-star {
          color: #E5A100;
          font-size: 12px;
          line-height: 1;
        }

        /* Top Right Wishlist Button */
        .eb-product-card__wish-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(200, 154, 61, 0.28);
          border-radius: 50%;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          cursor: pointer;
          z-index: 4;
          color: #75645C;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
          transition: transform 0.18s ease, color 0.18s ease, background 0.18s;
          backdrop-filter: blur(4px);
        }

        .eb-product-card__wish-btn:hover {
          transform: scale(1.12);
          background: #FFFFFF;
        }

        .eb-product-card__wish-btn--active {
          color: #DC2626 !important;
          background: #FFF5F5 !important;
          border-color: rgba(220, 38, 38, 0.3) !important;
        }

        /* Quick View Button on Image Hover */
        .eb-product-card__quick-btn {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(85, 0, 10, 0.90);
          color: #FFF8EC;
          border: 1px solid rgba(200, 154, 61, 0.4);
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 5px 12px;
          border-radius: 999px;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s;
          cursor: pointer;
          backdrop-filter: blur(4px);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          z-index: 3;
        }

        .eb-product-card:hover .eb-product-card__quick-btn,
        .eb-product-card__quick-btn:focus-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .eb-product-card__quick-btn:hover {
          background: #6B000D;
          color: #FFFDF8;
        }

        /* ── Card Content Body ─────────────────────────────── */
        .eb-product-card__body {
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
          background: #FFFFFF;
        }

        /* Dark Tag Chip (No Palm Oil) */
        .eb-product-card__oil-pill {
          display: inline-block;
          align-self: flex-start;
          background: #2B211E;
          color: #F8F3EA;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          padding: 3px 8px;
          border-radius: 4px;
          margin-bottom: 10px;
        }

        /* Title & Hindi Name */
        .eb-product-card__title-wrap {
          margin-bottom: 4px;
        }

        .eb-product-card__title {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14.5px;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #2D231E;
          margin: 0;
          line-height: 1.25;
          cursor: pointer;
          transition: color 0.18s ease;
        }

        .eb-product-card__title:hover {
          color: #55000A;
        }

        .eb-product-card__hindi {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          color: #8C756B;
          font-weight: 500;
          margin-left: 6px;
          text-transform: none;
        }

        /* Subtitle / Short Description */
        .eb-product-card__sub {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 400;
          color: #7A6961;
          margin: 0 0 12px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: 35px;
        }

        /* Weight Selector Chips */
        .eb-product-card__weights {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .eb-product-card__weight-btn {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 6px;
          border: 1px solid rgba(200, 154, 61, 0.32);
          background: #FAF6F0;
          color: #55000A;
          cursor: pointer;
          transition: all 0.15s ease;
          outline: none;
        }

        .eb-product-card__weight-btn:hover {
          border-color: #C99A32;
          background: #F3EBDD;
        }

        .eb-product-card__weight-btn--active {
          background: #55000A !important;
          color: #FFF8EC !important;
          border-color: #55000A !important;
          box-shadow: 0 2px 6px rgba(85, 0, 10, 0.2);
        }

        /* Pricing Section */
        .eb-product-card__price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 14px;
          margin-top: auto;
        }

        .eb-product-card__price {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 19px;
          font-weight: 700;
          color: #2D231E;
          letter-spacing: -0.01em;
          line-height: 1;
        }

        .eb-product-card__original-price {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 13px;
          font-weight: 500;
          color: #A39188;
          text-decoration: line-through;
        }

        .eb-product-card__discount-tag {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 10px;
          font-weight: 700;
          color: #15803D;
          background: #DCFCE7;
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* ── Quick Add / Add to Cart CTA Button ──────────────── */
        .eb-product-card__cta-btn {
          width: 100%;
          height: 42px;
          border-radius: 10px;
          background: #55000A;
          color: #FFF8EC;
          border: 1.5px solid #55000A;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(85, 0, 10, 0.18);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
        }

        .eb-product-card__cta-btn:hover {
          background: #6B000D;
          border-color: #6B000D;
          box-shadow: 0 6px 18px rgba(85, 0, 10, 0.26);
          transform: translateY(-1px);
        }

        .eb-product-card__cta-btn:active {
          transform: translateY(0);
        }

        /* Stepper when item is already in cart */
        .eb-product-card__stepper {
          width: 100%;
          height: 42px;
          border-radius: 10px;
          background: #55000A;
          border: 1.5px solid #55000A;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 8px;
          box-shadow: 0 4px 14px rgba(85, 0, 10, 0.18);
        }

        .eb-product-card__step-btn {
          width: 34px;
          height: 32px;
          border-radius: 6px;
          background: rgba(255, 248, 236, 0.15);
          border: none;
          color: #FFF8EC;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
        }

        .eb-product-card__step-btn:hover {
          background: rgba(255, 248, 236, 0.30);
          color: #D4AA45;
        }

        .eb-product-card__step-val {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 13px;
          font-weight: 700;
          color: #FFF8EC;
          letter-spacing: 0.02em;
        }

        @media (max-width: 768px) {
          .eb-product-card {
            border-radius: 14px;
          }
          .eb-product-card__body {
            padding: 12px 14px 14px;
          }
          .eb-product-card__title {
            font-size: 13px;
          }
          .eb-product-card__hindi {
            display: none;
          }
          .eb-product-card__sub {
            font-size: 11px;
            min-height: auto;
            margin-bottom: 8px;
            -webkit-line-clamp: 1;
          }
          .eb-product-card__weights {
            margin-bottom: 10px;
            gap: 4px;
          }
          .eb-product-card__weight-btn {
            font-size: 9.5px;
            padding: 2px 6px;
          }
          .eb-product-card__price {
            font-size: 16px;
          }
          .eb-product-card__cta-btn {
            height: 36px;
            font-size: 10.5px;
            border-radius: 8px;
          }
          .eb-product-card__stepper {
            height: 36px;
            border-radius: 8px;
          }
          .eb-product-card__step-btn {
            width: 30px;
            height: 28px;
            font-size: 14px;
          }
          .eb-product-card__quick-btn {
            display: none;
          }
        }
      `}</style>

      {/* Media: Large Image + Badges */}
      <div
        className="eb-product-card__media"
        onClick={() => navigate(productUrl)}
        title={`View details for ${product.name}`}
      >
        <img
          src={optimizeCloudinary(product.image, { width: 520, quality: 'auto', format: 'auto' })}
          alt={product.name}
          className="eb-product-card__img"
          loading="lazy"
          decoding="async"
          onError={e => {
            const el = e.currentTarget;
            if (!el.src.includes('/mishtichaat/chaat-plate.jpg')) {
              el.src = '/mishtichaat/chaat-plate.jpg';
            }
          }}
        />

        {/* Top-Left Tag Badge */}
        {badgeText && (
          <span className="eb-product-card__badge-tag">{badgeText}</span>
        )}

        {/* Bottom-Left Rating Pill */}
        {Boolean(product.rating && product.rating > 0 && product.reviewCount && product.reviewCount > 0) && (
          <div className="eb-product-card__rating-pill">
            <span className="eb-product-card__rating-star" aria-hidden="true">★</span>
            <span>{product.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Top-Right Wishlist Heart Button */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`eb-product-card__wish-btn ${isWishlisted ? 'eb-product-card__wish-btn--active' : ''}`}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={isWishlisted ? '#DC2626' : 'none'}
            stroke={isWishlisted ? '#DC2626' : 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Quick View Button on Desktop Hover */}
        <button
          type="button"
          className="eb-product-card__quick-btn"
          onClick={e => {
            e.stopPropagation();
            onQuickView(product);
          }}
          aria-label={`Quick view ${product.name}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Quick View
        </button>
      </div>

      {/* Card Body */}
      <div className="eb-product-card__body">
        {/* Characteristic Pill (only if oilBadgeText exists) */}
        {oilBadgeText && (
          <span className="eb-product-card__oil-pill">{oilBadgeText}</span>
        )}

        {/* Product Title */}
        <div className="eb-product-card__title-wrap">
          <h3
            className="eb-product-card__title"
            onClick={() => navigate(productUrl)}
          >
            {product.name}
            {Boolean(product.hindiName?.trim()) && (
              <span className="eb-product-card__hindi">{product.hindiName}</span>
            )}
          </h3>
        </div>

        {/* Subtitle / Tagline */}
        {Boolean(product.tagline?.trim() || product.description?.trim()) && (
          <p className="eb-product-card__sub">
            {product.tagline || product.description}
          </p>
        )}

        {/* Weight Selector */}
        {product.options && product.options.length > 0 && (
          <div className="eb-product-card__weights" role="group" aria-label="Available pack sizes">
            {product.options.map(opt => {
              const isSelected = selectedOption.weight === opt.weight;
              return (
                <button
                  key={opt.weight}
                  type="button"
                  className={`eb-product-card__weight-btn ${isSelected ? 'eb-product-card__weight-btn--active' : ''}`}
                  onClick={() => setSelectedOption(opt)}
                  aria-pressed={isSelected}
                >
                  {opt.weight}
                </button>
              );
            })}
          </div>
        )}

        {/* Price Row */}
        <div className="eb-product-card__price-row">
          <span className="eb-product-card__price">₹{selectedOption.price}</span>
          {selectedOption.originalPrice && selectedOption.originalPrice > selectedOption.price && (
            <>
              <span className="eb-product-card__original-price">₹{selectedOption.originalPrice}</span>
              <span className="eb-product-card__discount-tag">
                {Math.round(((selectedOption.originalPrice - selectedOption.price) / selectedOption.originalPrice) * 100)}% OFF
              </span>
            </>
          )}
        </div>

        {/* Add to Cart / Quick Add Button or Stepper */}
        {quantityInCart > 0 ? (
          <div className="eb-product-card__stepper" aria-label={`Quantity of ${product.name} in cart`}>
            <button
              type="button"
              className="eb-product-card__step-btn"
              onClick={e => {
                e.stopPropagation();
                updateQuantity(product.id, selectedOption.weight, quantityInCart - 1);
              }}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="eb-product-card__step-val">{quantityInCart} in Cart</span>
            <button
              type="button"
              className="eb-product-card__step-btn"
              onClick={e => {
                e.stopPropagation();
                updateQuantity(product.id, selectedOption.weight, quantityInCart + 1);
              }}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="eb-product-card__cta-btn"
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} ${selectedOption.weight} to cart`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {isAdding ? 'ADDING...' : 'QUICK ADD'}
          </button>
        )}
      </div>
    </article>
  );
}
