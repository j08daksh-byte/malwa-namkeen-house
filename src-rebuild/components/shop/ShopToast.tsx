import React from 'react';
import { useCart } from '../../lib/cartContext';

export default function ShopToast() {
  const { toastMessage, dismissToast, openCart, totalItems, subtotal } = useCart();

  return (
    <>
      <style>{`
        /* ── Floating Cart Trigger ───────────────────────────── */
        .shop-floating-cart {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 250;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #55000A;
          color: #FFF8EC;
          border: 1.5px solid #D4AA45;
          padding: 10px 18px 10px 14px;
          border-radius: 999px;
          box-shadow: 0 10px 28px rgba(85, 0, 10, 0.35);
          cursor: pointer;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          transition: transform 0.22s ease, background 0.22s, box-shadow 0.22s;
        }

        .shop-floating-cart:hover {
          background: #6B000D;
          transform: translateY(-2px);
          box-shadow: 0 14px 34px rgba(85, 0, 10, 0.45);
        }

        .shop-floating-cart__badge {
          background: #D4AA45;
          color: #2C0612;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
        }

        .shop-floating-cart__amount {
          color: #D4AA45;
          font-weight: 700;
          border-left: 1px solid rgba(255, 248, 236, 0.25);
          padding-left: 10px;
        }

        /* ── Toast Message ───────────────────────────────────── */
        .shop-toast {
          position: fixed;
          bottom: 84px;
          right: 24px;
          z-index: 260;
          background: #3D0007;
          border: 1px solid rgba(200, 154, 61, 0.45);
          color: #FFF8EC;
          padding: 12px 18px;
          border-radius: 14px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.30);
          display: flex;
          align-items: center;
          gap: 14px;
          animation: toastSlideUp 0.24s cubic-bezier(0.16, 1, 0.3, 1);
          max-width: min(90vw, 380px);
        }

        @keyframes toastSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .shop-toast__text {
          font-family: Inter, sans-serif;
          font-size: 12.5px;
          font-weight: 500;
          line-height: 1.4;
          flex: 1;
        }

        .shop-toast__btn {
          background: #D4AA45;
          color: #2C0612;
          border: none;
          padding: 6px 12px;
          border-radius: 999px;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }

        .shop-toast__btn:hover {
          background: #C99A32;
        }

        .shop-toast__close {
          background: none;
          border: none;
          color: rgba(255, 248, 236, 0.60);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
        }

        .shop-toast__close:hover {
          color: #FFF8EC;
        }

        @media (max-width: 540px) {
          .shop-floating-cart {
            bottom: 18px;
            right: 16px;
            padding: 8px 14px 8px 12px;
          }
          .shop-toast {
            bottom: 74px;
            right: 16px;
            left: 16px;
            max-width: none;
          }
        }
      `}</style>

      {/* Floating cart button */}
      {totalItems > 0 && (
        <button
          type="button"
          className="shop-floating-cart"
          onClick={openCart}
          aria-label={`View shopping cart with ${totalItems} items, total ₹${subtotal}`}
        >
          <span className="shop-floating-cart__badge">{totalItems}</span>
          <span>Basket</span>
          <span className="shop-floating-cart__amount">₹{subtotal}</span>
        </button>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="shop-toast" role="status" aria-live="polite">
          <div className="shop-toast__text">{toastMessage}</div>
          <button
            type="button"
            className="shop-toast__btn"
            onClick={() => {
              dismissToast();
              openCart();
            }}
          >
            View
          </button>
          <button
            type="button"
            className="shop-toast__close"
            onClick={dismissToast}
            aria-label="Dismiss notification"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
