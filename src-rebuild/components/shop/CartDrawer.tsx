import React, { useEffect } from 'react';
import { useCart } from '../../lib/cartContext';
import { BUSINESS } from '../../lib/business';

interface CartDrawerProps {
  onOpenCheckout: () => void;
}

const FREE_SHIPPING_THRESHOLD = 800;

export default function CartDrawer({ onOpenCheckout }: CartDrawerProps) {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart, subtotal, totalItems, clearCart } = useCart();

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) closeCart();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    let itemsList = '';
    cart.forEach((item, idx) => {
      itemsList += `${idx + 1}. *${item.product.name}* (${item.selectedOption.weight}) × ${item.quantity} — ₹${item.selectedOption.price * item.quantity}\n`;
    });

    const message = `Namaste ${BUSINESS.name}! 🙏\nI would like to order from your Shop:\n\n🛍️ *ORDER SUMMARY:*\n${itemsList}\n📦 *Total Items:* ${totalItems}\n💰 *Subtotal:* ₹${subtotal}\n\nPlease confirm availability and payment details. Thank you!`;

    window.open(`https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="cart-drawer-overlay" onClick={closeCart} role="dialog" aria-modal="true" aria-label="Shopping Cart">
      <style>{`
        .cart-drawer-overlay {
          position: fixed;
          inset: 0;
          z-index: 350;
          background: rgba(35, 3, 10, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: flex-end;
          animation: drawerBackdrop 0.25s ease;
        }

        @keyframes drawerBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .cart-drawer {
          width: min(100%, 460px);
          height: 100%;
          background: #FDFAF4;
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.28);
          display: flex;
          flex-direction: column;
          position: relative;
          animation: drawerSlide 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          border-left: 1px solid rgba(200, 154, 61, 0.35);
        }

        @keyframes drawerSlide {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        /* ── Header ─────────────────────────────────────────── */
        .cart-drawer__header {
          background: #55000A;
          color: #FFF8EC;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(200, 154, 61, 0.25);
        }

        .cart-drawer__title-wrap {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .cart-drawer__title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          color: #FFF8EC;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .cart-drawer__count-badge {
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          color: #2C0612;
          background: #D4AA45;
          padding: 2px 8px;
          border-radius: 999px;
        }

        .cart-drawer__close-btn {
          background: none;
          border: none;
          color: rgba(255, 248, 236, 0.80);
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: color 0.15s, background 0.15s;
        }

        .cart-drawer__close-btn:hover {
          color: #D4AA45;
          background: rgba(255, 255, 255, 0.08);
        }

        /* ── Free Shipping Progress ─────────────────────────── */
        .cart-drawer__shipping-bar {
          background: #FAF5ED;
          padding: 12px 24px;
          border-bottom: 1px solid rgba(200, 154, 61, 0.18);
        }

        .cart-drawer__shipping-text {
          font-family: Inter, sans-serif;
          font-size: 12px;
          color: #5E4940;
          margin: 0 0 6px;
          line-height: 1.4;
        }

        .cart-drawer__shipping-text strong {
          color: #55000A;
        }

        .cart-drawer__progress-track {
          width: 100%;
          height: 5px;
          background: rgba(200, 154, 61, 0.22);
          border-radius: 4px;
          overflow: hidden;
        }

        .cart-drawer__progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #C99A32 0%, #D4AA45 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        /* ── Items List ─────────────────────────────────────── */
        .cart-drawer__items {
          flex: 1;
          overflow-y: auto;
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 68px 1fr auto;
          gap: 14px;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(200, 154, 61, 0.14);
        }

        .cart-item__thumb {
          width: 68px;
          height: 68px;
          border-radius: 10px;
          overflow: hidden;
          background: #55000A;
          border: 1px solid rgba(200, 154, 61, 0.25);
          flex-shrink: 0;
        }

        .cart-item__thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cart-item__info {
          min-width: 0;
        }

        .cart-item__name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 17px;
          font-weight: 700;
          color: #34211D;
          margin: 0 0 2px;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cart-item__meta {
          font-family: Inter, sans-serif;
          font-size: 11.5px;
          color: #75645C;
          margin: 0 0 8px;
        }

        .cart-item__stepper {
          display: inline-flex;
          align-items: center;
          height: 28px;
          border-radius: 999px;
          border: 1px solid rgba(85, 0, 10, 0.25);
          background: #FFFDF8;
          overflow: hidden;
        }

        .cart-item__step-btn {
          width: 26px;
          height: 100%;
          background: transparent;
          border: none;
          color: #55000A;
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .cart-item__step-btn:hover {
          background: rgba(85, 0, 10, 0.08);
        }

        .cart-item__step-val {
          font-family: Inter, sans-serif;
          font-size: 11.5px;
          font-weight: 700;
          color: #34211D;
          padding: 0 6px;
          min-width: 20px;
          text-align: center;
        }

        .cart-item__right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .cart-item__price {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 18px;
          font-weight: 700;
          color: #55000A;
          line-height: 1;
        }

        .cart-item__delete {
          background: none;
          border: none;
          color: #A38C82;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }

        .cart-item__delete:hover {
          color: #C0392B;
        }

        /* ── Empty State ────────────────────────────────────── */
        .cart-drawer__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          text-align: center;
          flex: 1;
        }

        .cart-drawer__empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(201, 154, 50, 0.12);
          border: 1px solid rgba(201, 154, 50, 0.30);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C99A32;
          margin-bottom: 16px;
        }

        .cart-drawer__empty-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          color: #55000A;
          margin: 0 0 6px;
        }

        .cart-drawer__empty-sub {
          font-family: Inter, sans-serif;
          font-size: 13px;
          color: #75645C;
          max-width: 260px;
          margin: 0 0 20px;
          line-height: 1.5;
        }

        .cart-drawer__browse-btn {
          height: 40px;
          padding: 0 24px;
          border-radius: 999px;
          background: #55000A;
          color: #FFF8EC;
          border: none;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.18s;
        }

        .cart-drawer__browse-btn:hover {
          background: #6B000D;
        }

        /* ── Footer / Checkout ──────────────────────────────── */
        .cart-drawer__footer {
          background: #FFFDF8;
          border-top: 1px solid rgba(200, 154, 61, 0.22);
          padding: 20px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cart-drawer__summary-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-family: Inter, sans-serif;
        }

        .cart-drawer__summary-label {
          font-size: 13px;
          color: #75645C;
        }

        .cart-drawer__summary-subtotal {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: #55000A;
        }

        .cart-drawer__note {
          font-family: Inter, sans-serif;
          font-size: 11px;
          color: #9E8C82;
          line-height: 1.4;
          margin: 0;
        }

        .cart-drawer__btn-primary {
          width: 100%;
          height: 46px;
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
          transition: background 0.18s, transform 0.18s;
        }

        .cart-drawer__btn-primary:hover {
          background: #6B000D;
          transform: translateY(-1px);
        }

        .cart-drawer__btn-wa {
          width: 100%;
          height: 42px;
          border-radius: 999px;
          background: #25D366;
          color: white;
          border: none;
          font-family: Inter, sans-serif;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.25);
          transition: background 0.18s, transform 0.18s;
        }

        .cart-drawer__btn-wa:hover {
          background: #20BA5A;
          transform: translateY(-1px);
        }
      `}</style>

      <div className="cart-drawer" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-drawer__header">
          <div className="cart-drawer__title-wrap">
            <h2 className="cart-drawer__title">Your Pantry Basket</h2>
            <span className="cart-drawer__count-badge">{totalItems}</span>
          </div>
          <button className="cart-drawer__close-btn" onClick={closeCart} aria-label="Close cart drawer">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Free shipping bar */}
        {cart.length > 0 && (
          <div className="cart-drawer__shipping-bar">
            <p className="cart-drawer__shipping-text">
              {remainingForFreeShipping > 0 ? (
                <>Add <strong>₹{remainingForFreeShipping}</strong> more for <strong>Complimentary Shipping</strong></>
              ) : (
                <>🎉 <strong>Complimentary Shipping</strong> unlocked!</>
              )}
            </p>
            <div className="cart-drawer__progress-track">
              <div
                className="cart-drawer__progress-fill"
                style={{ width: `${freeShippingPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Item list or Empty state */}
        {cart.length === 0 ? (
          <div className="cart-drawer__empty">
            <div className="cart-drawer__empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h3 className="cart-drawer__empty-title">Your basket is empty</h3>
            <p className="cart-drawer__empty-sub">
              Explore our small-batch Ratlami sev, signature mixtures, and pure ghee mithai.
            </p>
            <button className="cart-drawer__browse-btn" onClick={closeCart}>
              Explore Delicacies
            </button>
          </div>
        ) : (
          <div className="cart-drawer__items" role="list">
            {cart.map((item) => (
              <div key={`${item.product.id}-${item.selectedOption.weight}`} className="cart-item" role="listitem">
                <div className="cart-item__thumb">
                  <img src={item.product.image} alt={item.product.name} />
                </div>
                <div className="cart-item__info">
                  <h4 className="cart-item__name">{item.product.name}</h4>
                  <p className="cart-item__meta">{item.selectedOption.weight} · ₹{item.selectedOption.price}</p>
                  <div className="cart-item__stepper">
                    <button
                      type="button"
                      className="cart-item__step-btn"
                      onClick={() => updateQuantity(item.product.id, item.selectedOption.weight, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="cart-item__step-val">{item.quantity}</span>
                    <button
                      type="button"
                      className="cart-item__step-btn"
                      onClick={() => updateQuantity(item.product.id, item.selectedOption.weight, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="cart-item__right">
                  <span className="cart-item__price">₹{item.selectedOption.price * item.quantity}</span>
                  <button
                    type="button"
                    className="cart-item__delete"
                    onClick={() => removeFromCart(item.product.id, item.selectedOption.weight)}
                    aria-label={`Remove ${item.product.name} from basket`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Checkout actions */}
        {cart.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__summary-row">
              <span className="cart-drawer__summary-label">Subtotal</span>
              <span className="cart-drawer__summary-subtotal">₹{subtotal}</span>
            </div>
            <p className="cart-drawer__note">
              Taxes included. Standard shipping calculated at checkout or confirmed via WhatsApp.
            </p>

            <button
              type="button"
              className="cart-drawer__btn-primary"
              onClick={() => {
                closeCart();
                onOpenCheckout();
              }}
            >
              Proceed to Delivery Details
            </button>

            <button
              type="button"
              className="cart-drawer__btn-wa"
              onClick={handleWhatsAppCheckout}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-1.127-.08-.271-.089-.624-.22-1.077-.42-1.912-.846-3.149-2.775-3.245-2.903-.095-.129-.773-1.029-.773-1.962 0-.933.489-1.393.663-1.583.174-.19.38-.238.507-.238.127 0 .254.001.365.006.118.005.277-.045.433.332.162.392.553 1.348.601 1.446.048.098.08.213.016.342-.064.129-.096.208-.19.319-.096.111-.202.247-.289.332-.097.094-.198.196-.085.39.113.194.502.828 1.077 1.341.74.66 1.364.865 1.558.961.194.096.308.08.423-.051.114-.131.488-.568.618-.762.13-.195.26-.162.437-.097.178.064 1.128.532 1.322.629.194.097.324.145.372.228.047.081.047.472-.097.877z" />
              </svg>
              Quick Order via WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
