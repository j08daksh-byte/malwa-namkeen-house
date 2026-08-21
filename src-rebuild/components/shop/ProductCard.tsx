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

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product, selectedOption, 1);
    setTimeout(() => setIsAdding(false), 400);
  };

  const discountPercent = selectedOption.originalPrice
    ? Math.round(((selectedOption.originalPrice - selectedOption.price) / selectedOption.originalPrice) * 100)
    : 0;

  return (
    <article className="shop-product-card" aria-label={product.name}>
      <style>{`
        .shop-product-card {
          background: #FFFDF8;
          border: 1px solid rgba(200, 154, 61, 0.28);
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(85, 0, 10, 0.04);
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
          position: relative;
        }

        .shop-product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(85, 0, 10, 0.09);
          border-color: rgba(201, 154, 50, 0.55);
        }

        /* ── Image & Badges ─────────────────────────────────── */
        .shop-product-card__media {
          position: relative;
          width: 100%;
          aspect-ratio: 1.22 / 1;
          overflow: hidden;
          background: #55000A;
          cursor: pointer;
        }

        .shop-product-card__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease;
        }

        .shop-product-card:hover .shop-product-card__img {
          transform: scale(1.06);
        }

        .shop-product-card__badge-tag {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #55000A;
          color: #D4AA45;
          border: 1px solid rgba(212, 170, 69, 0.40);
          font-family: Inter, sans-serif;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 999px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.20);
          z-index: 2;
        }

        .shop-product-card__quick-btn {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(255, 253, 248, 0.92);
          color: #55000A;
          border: 1px solid rgba(200, 154, 61, 0.35);
          font-family: Inter, sans-serif;
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
          gap: 4px;
          z-index: 2;
        }

        .shop-product-card:hover .shop-product-card__quick-btn,
        .shop-product-card__quick-btn:focus-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .shop-product-card__quick-btn:hover {
          background: #55000A;
          color: #FFF8EC;
          border-color: #55000A;
        }

        /* ── Content Body ───────────────────────────────────── */
        .shop-product-card__body {
          padding: 18px 20px 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .shop-product-card__top-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 6px;
        }

        .shop-product-card__cat-label {
          font-family: Inter, sans-serif;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #C99A32;
        }

        .shop-product-card__spice-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: Inter, sans-serif;
          font-size: 10px;
          font-weight: 600;
          color: #75645C;
          background: rgba(200, 154, 61, 0.12);
          padding: 2px 7px;
          border-radius: 999px;
        }

        .shop-product-card__title-row {
          margin-bottom: 6px;
        }

        .shop-product-card__title {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(19px, 1.6vw, 22px);
          font-weight: 700;
          line-height: 1.15;
          color: #34211D;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .shop-product-card__hindi {
          font-family: 'Playfair Display', serif;
          font-size: 12.5px;
          color: #8C756B;
          margin-left: 6px;
          font-weight: 500;
        }

        .shop-product-card__tagline {
          font-family: Inter, sans-serif;
          font-size: 11.5px;
          font-style: italic;
          color: #C99A32;
          margin: 0 0 8px;
        }

        .shop-product-card__desc {
          font-family: Inter, sans-serif;
          font-size: 12.5px;
          line-height: 1.55;
          color: #6B5248;
          margin: 0 0 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-grow: 1;
        }

        /* ── Weight Options Selector ────────────────────────── */
        .shop-product-card__weights {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .shop-product-card__weight-chip {
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid rgba(200, 154, 61, 0.32);
          background: #FAF5ED;
          color: #55000A;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .shop-product-card__weight-chip:hover {
          border-color: #C99A32;
          background: #F5EAD8;
        }

        .shop-product-card__weight-chip--selected {
          background: #55000A;
          color: #FFF8EC;
          border-color: #55000A;
          box-shadow: 0 2px 8px rgba(85, 0, 10, 0.18);
        }

        /* ── Price & CTA Bottom Bar ─────────────────────────── */
        .shop-product-card__bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 14px;
          border-top: 1px solid rgba(200, 154, 61, 0.18);
        }

        .shop-product-card__pricing {
          display: flex;
          flex-direction: column;
        }

        .shop-product-card__price-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .shop-product-card__price {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          color: #55000A;
          line-height: 1;
        }

        .shop-product-card__original-price {
          font-family: Inter, sans-serif;
          font-size: 12px;
          color: #9E8C82;
          text-decoration: line-through;
        }

        .shop-product-card__oil-note {
          font-family: Inter, sans-serif;
          font-size: 10px;
          color: #8C756B;
          letter-spacing: 0.02em;
          margin-top: 2px;
        }

        /* ── Add to Cart & Stepper ──────────────────────────── */
        .shop-product-card__add-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 38px;
          padding: 0 16px;
          border-radius: 999px;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: #55000A;
          color: #FFF8EC;
          border: 1px solid #55000A;
          cursor: pointer;
          transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
          box-shadow: 0 4px 12px rgba(85, 0, 10, 0.15);
          white-space: nowrap;
        }

        .shop-product-card__add-btn:hover {
          background: #6B000D;
          border-color: #6B000D;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(85, 0, 10, 0.22);
        }

        .shop-product-card__stepper {
          display: inline-flex;
          align-items: center;
          height: 38px;
          border-radius: 999px;
          background: #55000A;
          border: 1px solid #55000A;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(85, 0, 10, 0.15);
        }

        .shop-product-card__step-btn {
          width: 32px;
          height: 100%;
          background: transparent;
          border: none;
          color: #D4AA45;
          font-family: Inter, sans-serif;
          font-size: 14px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
        }

        .shop-product-card__step-btn:hover {
          background: rgba(212, 170, 69, 0.15);
        }

        .shop-product-card__step-val {
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 800;
          color: #FFF8EC;
          padding: 0 8px;
          min-width: 24px;
          text-align: center;
        }

        @media (max-width: 640px) {
          .shop-product-card {
            border-radius: 14px;
          }
          .shop-product-card__body {
            padding: 12px 13px 14px;
          }
          .shop-product-card__top-meta {
            margin-bottom: 4px;
          }
          .shop-product-card__cat-label {
            font-size: 9.5px;
          }
          .shop-product-card__spice-chip {
            font-size: 9px;
            padding: 1px 5px;
          }
          .shop-product-card__title {
            font-size: 16.5px;
            line-height: 1.15;
          }
          .shop-product-card__hindi {
            display: none;
          }
          .shop-product-card__desc {
            display: none;
          }
          .shop-product-card__tagline {
            font-size: 10px;
            margin-bottom: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .shop-product-card__weights {
            margin-bottom: 10px;
            gap: 4px;
          }
          .shop-product-card__weight-chip {
            font-size: 9.5px;
            padding: 3px 6px;
          }
          .shop-product-card__bottom {
            padding-top: 10px;
            gap: 8px;
          }
          .shop-product-card__price {
            font-size: 18px;
          }
          .shop-product-card__add-btn {
            height: 34px;
            padding: 0 10px;
            font-size: 9.5px;
            gap: 4px;
          }
          .shop-product-card__stepper {
            height: 34px;
          }
          .shop-product-card__step-btn {
            width: 26px;
            font-size: 13px;
          }
          .shop-product-card__step-val {
            font-size: 11px;
            padding: 0 4px;
            min-width: 18px;
          }
          .shop-product-card__quick-btn {
            display: none;
          }
        }
      `}</style>

      {/* Media & Badges */}
      <div
        className="shop-product-card__media"
        onClick={() => navigate(`/product/${product.slug || product.id}`)}
        title={`View details for ${product.name}`}
      >
        <img
          src={optimizeCloudinary(product.image, { width: 520, quality: 'auto', format: 'auto' })}
          alt={product.name}
          className="shop-product-card__img"
          loading="lazy"
          decoding="async"
          onError={e => {
            const el = e.currentTarget;
            if (!el.src.includes('/mishtichaat/chaat-plate.jpg')) {
              el.src = '/mishtichaat/chaat-plate.jpg';
            }
          }}
        />
        {product.badge && (
          <span className="shop-product-card__badge-tag">{product.badge}</span>
        )}

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255, 255, 255, 0.92)',
            border: '1px solid rgba(200, 154, 61, 0.3)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            zIndex: 3,
            color: isWishlisted ? '#DC2626' : '#75645C',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'transform 0.15s, color 0.15s',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill={isWishlisted ? '#DC2626' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <button
          type="button"
          className="shop-product-card__quick-btn"
          onClick={e => {
            e.stopPropagation();
            onQuickView(product);
          }}
          aria-label={`Quick view details for ${product.name}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Quick View
        </button>
      </div>

      {/* Body Content */}
      <div className="shop-product-card__body">
        <div className="shop-product-card__top-meta">
          <span className="shop-product-card__cat-label">{product.categoryLabel}</span>
          <span className="shop-product-card__spice-chip">
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: product.spiceLevel === 'Clove Hot' ? '#C0392B' : '#C99A32',
                display: 'inline-block',
              }}
            />
            {product.spiceLevel}
          </span>
        </div>

        <div className="shop-product-card__title-row">
          <h3
            className="shop-product-card__title"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/product/${product.slug || product.id}`)}
          >
            {product.name}
            {product.hindiName && (
              <span className="shop-product-card__hindi">{product.hindiName}</span>
            )}
          </h3>
        </div>

        <p className="shop-product-card__tagline">{product.tagline}</p>
        <p className="shop-product-card__desc">{product.description}</p>

        {/* Weight options */}
        <div className="shop-product-card__weights" role="group" aria-label="Pack size options">
          {product.options.map(opt => {
            const isSelected = selectedOption.weight === opt.weight;
            return (
              <button
                key={opt.weight}
                type="button"
                className={`shop-product-card__weight-chip ${isSelected ? 'shop-product-card__weight-chip--selected' : ''}`}
                onClick={() => setSelectedOption(opt)}
                aria-pressed={isSelected}
              >
                {opt.weight}
              </button>
            );
          })}
        </div>

        {/* Bottom bar with price & cart button */}
        <div className="shop-product-card__bottom">
          <div className="shop-product-card__pricing">
            <div className="shop-product-card__price-row">
              <span className="shop-product-card__price">₹{selectedOption.price}</span>
              {selectedOption.originalPrice && (
                <span className="shop-product-card__original-price">₹{selectedOption.originalPrice}</span>
              )}
            </div>
            <span className="shop-product-card__oil-note">{product.oilUsed}</span>
          </div>

          {quantityInCart > 0 ? (
            <div className="shop-product-card__stepper" aria-label={`Quantity in cart for ${product.name}`}>
              <button
                type="button"
                className="shop-product-card__step-btn"
                onClick={() => updateQuantity(product.id, selectedOption.weight, quantityInCart - 1)}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="shop-product-card__step-val">{quantityInCart}</span>
              <button
                type="button"
                className="shop-product-card__step-btn"
                onClick={() => updateQuantity(product.id, selectedOption.weight, quantityInCart + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="shop-product-card__add-btn"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} ${selectedOption.weight} to cart`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
