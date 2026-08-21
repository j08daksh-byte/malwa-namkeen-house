import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Product, type ProductWeightOption } from '../../data/products';
import { useCart } from '../../lib/cartContext';
import { BUSINESS } from '../../lib/business';

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductQuickViewModal({ product, onClose }: ProductQuickViewModalProps) {
  const navigate = useNavigate();
  const { addToCart, openCart } = useCart();
  const [selectedOption, setSelectedOption] = useState<ProductWeightOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedOption(product.options?.[0] || { weight: 'Standard', price: 150 });
      setQuantity(1);
      setIsAdded(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product || !selectedOption) return null;

  const handleAdd = () => {
    addToCart(product, selectedOption, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNowWhatsApp = () => {
    const text = encodeURIComponent(
      `Namaste ${BUSINESS.name}! 🙏\nI would like to order:\n*${product.name} (${selectedOption.weight})* × ${quantity} (₹${selectedOption.price * quantity})\n\nPlease share delivery details.`
    );
    window.open(`https://wa.me/${BUSINESS.whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <div className="qv-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="qv-title">
      <style>{`
        .qv-overlay {
          position: fixed;
          inset: 0;
          z-index: 300;
          background: rgba(35, 3, 10, 0.78);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: qvFadeIn 0.22s ease;
        }

        @keyframes qvFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .qv-modal {
          background: #FDFAF4;
          border: 1px solid rgba(200, 154, 61, 0.38);
          border-radius: 24px;
          max-width: 860px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          overflow-x: hidden;
        }

        .qv-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(85, 0, 10, 0.08);
          border: 1px solid rgba(85, 0, 10, 0.15);
          color: #55000A;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: background 0.18s, color 0.18s;
        }

        .qv-close-btn:hover {
          background: #55000A;
          color: #FFF8EC;
        }

        .qv-media {
          background: #55000A;
          position: relative;
          min-height: 360px;
        }

        .qv-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .qv-media-badge {
          position: absolute;
          top: 18px;
          left: 18px;
          background: #55000A;
          color: #D4AA45;
          border: 1px solid rgba(212, 170, 69, 0.5);
          font-family: Inter, sans-serif;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 999px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        .qv-content {
          padding: 32px clamp(20px, 4vw, 36px);
          display: flex;
          flex-direction: column;
        }

        .qv-eyebrow {
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #C99A32;
          margin-bottom: 6px;
        }

        .qv-title {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(26px, 2.5vw, 34px);
          font-weight: 700;
          color: #34211D;
          margin: 0 0 4px;
          line-height: 1.1;
          letter-spacing: -0.015em;
        }

        .qv-tagline {
          font-family: Inter, sans-serif;
          font-size: 13px;
          font-style: italic;
          color: #8C756B;
          margin: 0 0 16px;
        }

        .qv-price-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 18px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(200, 154, 61, 0.20);
        }

        .qv-price {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 32px;
          font-weight: 700;
          color: #55000A;
          line-height: 1;
        }

        .qv-orig-price {
          font-family: Inter, sans-serif;
          font-size: 14px;
          color: #9E8C82;
          text-decoration: line-through;
        }

        .qv-section-title {
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #55000A;
          margin: 0 0 8px;
        }

        .qv-story {
          font-family: Inter, sans-serif;
          font-size: 13px;
          line-height: 1.65;
          color: #5E4940;
          margin: 0 0 18px;
        }

        .qv-ingredients {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 20px;
        }

        .qv-ing-chip {
          font-family: Inter, sans-serif;
          font-size: 11px;
          background: rgba(201, 154, 50, 0.10);
          color: #55000A;
          border: 1px solid rgba(201, 154, 50, 0.25);
          padding: 3px 9px;
          border-radius: 999px;
        }

        .qv-specs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          background: #FAF5ED;
          border: 1px solid rgba(200, 154, 61, 0.20);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 22px;
        }

        .qv-spec-label {
          font-family: Inter, sans-serif;
          font-size: 10.5px;
          font-weight: 700;
          color: #8C756B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .qv-spec-val {
          font-family: Inter, sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          color: #34211D;
          margin-top: 1px;
        }

        .qv-weights-row {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .qv-weight-btn {
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 700;
          padding: 7px 14px;
          border-radius: 8px;
          border: 1.5px solid rgba(200, 154, 61, 0.35);
          background: #FFFDF8;
          color: #55000A;
          cursor: pointer;
          transition: all 0.15s;
        }

        .qv-weight-btn--active {
          background: #55000A;
          color: #FFF8EC;
          border-color: #55000A;
        }

        .qv-actions-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: auto;
          flex-wrap: wrap;
        }

        .qv-stepper {
          display: flex;
          align-items: center;
          height: 44px;
          border: 1.5px solid rgba(85, 0, 10, 0.25);
          border-radius: 999px;
          overflow: hidden;
          background: #FFFDF8;
        }

        .qv-step-btn {
          width: 38px;
          height: 100%;
          border: none;
          background: transparent;
          font-size: 16px;
          font-weight: 700;
          color: #55000A;
          cursor: pointer;
          transition: background 0.15s;
        }

        .qv-step-btn:hover {
          background: rgba(85, 0, 10, 0.08);
        }

        .qv-step-val {
          width: 32px;
          text-align: center;
          font-family: Inter, sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #34211D;
        }

        .qv-add-btn {
          flex: 1;
          min-width: 140px;
          height: 44px;
          border-radius: 999px;
          background: #55000A;
          color: #FFF8EC;
          border: 1px solid #55000A;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 6px 18px rgba(85, 0, 10, 0.20);
          transition: all 0.2s;
        }

        .qv-add-btn:hover {
          background: #6B000D;
          transform: translateY(-1px);
        }

        .qv-wa-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #25D366;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.30);
          transition: transform 0.2s;
          flex-shrink: 0;
        }

        .qv-wa-btn:hover {
          transform: scale(1.06);
        }

        @media (max-width: 768px) {
          .qv-modal {
            grid-template-columns: 1fr;
            max-height: 88dvh;
          }
          .qv-media {
            min-height: 220px;
            max-height: 260px;
          }
        }

        @media (max-width: 480px) {
          .qv-overlay {
            padding: 10px;
          }
          .qv-modal {
            border-radius: 16px;
          }
          .qv-content {
            padding: 18px 16px calc(18px + env(safe-area-inset-bottom, 0px));
          }
          .qv-title {
            font-size: 22px;
          }
          .qv-actions-row {
            flex-direction: column;
            align-items: stretch;
          }
          .qv-stepper {
            justify-content: center;
          }
          .qv-add-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="qv-modal" onClick={e => e.stopPropagation()}>
        <button
          className="qv-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* Left: Product Media */}
        <div className="qv-media">
          <img src={product.image} alt={product.name} className="qv-img" />
          {product.badge && <span className="qv-media-badge">{product.badge}</span>}
        </div>

        {/* Right: Detailed Content */}
        <div className="qv-content">
          <span className="qv-eyebrow">{product.categoryLabel} · {product.spiceLevel}</span>
          <h2 id="qv-title" className="qv-title">
            {product.name}
            {product.hindiName && (
              <span style={{ fontSize: '15px', color: '#8C756B', marginLeft: '8px', fontWeight: 500 }}>
                ({product.hindiName})
              </span>
            )}
          </h2>
          <p className="qv-tagline">{product.tagline}</p>

          <div className="qv-price-row">
            <span className="qv-price">₹{selectedOption.price * quantity}</span>
            {selectedOption.originalPrice && (
              <span className="qv-orig-price">₹{selectedOption.originalPrice * quantity}</span>
            )}
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#75645C' }}>
              ({selectedOption.weight})
            </span>
          </div>

          <h4 className="qv-section-title">Heritage & Craft</h4>
          <p className="qv-story">{product.story || product.description}</p>

          <h4 className="qv-section-title">Authentic Ingredients</h4>
          <div className="qv-ingredients">
            {product.ingredients.map(ing => (
              <span key={ing} className="qv-ing-chip">{ing}</span>
            ))}
          </div>

          <div className="qv-specs-grid">
            <div>
              <span className="qv-spec-label">Oil Used</span>
              <p className="qv-spec-val">{product.oilUsed}</p>
            </div>
            <div>
              <span className="qv-spec-label">Shelf Life</span>
              <p className="qv-spec-val">{product.shelfLife}</p>
            </div>
          </div>

          {/* Select Weight */}
          <h4 className="qv-section-title">Select Pack Size</h4>
          <div className="qv-weights-row">
            {product.options.map(opt => (
              <button
                key={opt.weight}
                type="button"
                className={`qv-weight-btn ${selectedOption.weight === opt.weight ? 'qv-weight-btn--active' : ''}`}
                onClick={() => setSelectedOption(opt)}
              >
                {opt.weight} — ₹{opt.price}
              </button>
            ))}
          </div>

          {/* Bottom actions */}
          <div className="qv-actions-row">
            <div className="qv-stepper" aria-label="Quantity">
              <button
                type="button"
                className="qv-step-btn"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="qv-step-val">{quantity}</span>
              <button
                type="button"
                className="qv-step-btn"
                onClick={() => setQuantity(q => q + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="qv-add-btn"
              onClick={handleAdd}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {isAdded ? 'Added to Cart ✓' : 'Add to Cart'}
            </button>

            <button
              type="button"
              className="qv-wa-btn"
              onClick={handleBuyNowWhatsApp}
              title="Order on WhatsApp"
              aria-label="Order on WhatsApp"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-1.127-.08-.271-.089-.624-.22-1.077-.42-1.912-.846-3.149-2.775-3.245-2.903-.095-.129-.773-1.029-.773-1.962 0-.933.489-1.393.663-1.583.174-.19.38-.238.507-.238.127 0 .254.001.365.006.118.005.277-.045.433.332.162.392.553 1.348.601 1.446.048.098.08.213.016.342-.064.129-.096.208-.19.319-.096.111-.202.247-.289.332-.097.094-.198.196-.085.39.113.194.502.828 1.077 1.341.74.66 1.364.865 1.558.961.194.096.308.08.423-.051.114-.131.488-.568.618-.762.13-.195.26-.162.437-.097.178.064 1.128.532 1.322.629.194.097.324.145.372.228.047.081.047.472-.097.877z" />
              </svg>
            </button>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/product/${product.slug || product.id}`);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#55000A',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                cursor: 'pointer',
              }}
            >
              View Full Delicacy Page & Story →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
