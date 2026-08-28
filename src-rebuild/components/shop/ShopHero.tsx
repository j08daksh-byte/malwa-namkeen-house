import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ShopHero() {
  const navigate = useNavigate();

  return (
    <section className="shop-intro-header" aria-labelledby="shop-main-heading">
      <style>{`
        .shop-intro-header {
          background: #FDFBF7;
          border-bottom: 1px solid rgba(200, 154, 61, 0.20);
          padding: clamp(20px, 3vw, 32px) clamp(16px, 3vw, 40px) clamp(16px, 2vw, 24px);
          position: relative;
        }

        .shop-intro-inner {
          max-width: 1240px;
          margin: 0 auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .shop-breadcrumb {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #8C756B;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          margin-bottom: clamp(32px, 3.2vw, 48px);
        }

        .shop-breadcrumb-link {
          color: #8C756B;
          text-decoration: none;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font: inherit;
          transition: color 0.18s;
        }

        .shop-breadcrumb-link:hover {
          color: #55000A;
        }

        .shop-breadcrumb-sep {
          color: #C99A32;
          font-size: 10px;
        }

        .shop-breadcrumb-current {
          color: #55000A;
        }

        .shop-title-h1 {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: clamp(36px, 4.4vw, 56px);
          font-weight: 700;
          letter-spacing: -0.025em;
          text-transform: uppercase;
          color: #55000A;
          margin: 0 0 clamp(38px, 4.0vw, 56px);
          line-height: 1.02;
        }

        /* Trust Strip */
        .shop-trust-pills {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(8px, 1.5vw, 16px);
          flex-wrap: wrap;
        }

        .shop-trust-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FFFDF9;
          border: 1px solid rgba(200, 154, 61, 0.28);
          border-radius: 999px;
          padding: 4px 12px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 600;
          color: #55000A;
          box-shadow: 0 2px 6px rgba(85, 0, 10, 0.03);
        }

        .shop-trust-icon {
          color: #C99A32;
          display: flex;
          align-items: center;
        }

        @media (max-width: 640px) {
          .shop-intro-header {
            padding: 20px 14px 20px;
          }
          .shop-breadcrumb {
            margin-bottom: 24px;
          }
          .shop-title-h1 {
            font-size: 26px;
            margin-bottom: 28px;
          }
          .shop-trust-pill {
            font-size: 10px;
            padding: 3px 9px;
          }
        }
      `}</style>

      <div className="shop-intro-inner">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="shop-breadcrumb">
          <button type="button" onClick={() => navigate('/')} className="shop-breadcrumb-link">
            Home
          </button>
          <span className="shop-breadcrumb-sep" aria-hidden="true">/</span>
          <span className="shop-breadcrumb-current" aria-current="page">Shop</span>
        </nav>

        {/* Clean Center Title: NAMKEEN & SNACKS */}
        <h1 id="shop-main-heading" className="shop-title-h1">
          NAMKEEN &amp; SNACKS
        </h1>

        {/* Trust Badges */}
        <div className="shop-trust-pills" role="list">
          <div className="shop-trust-pill" role="listitem">
            <span className="shop-trust-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <span>No Palm Oil</span>
          </div>

          <div className="shop-trust-pill" role="listitem">
            <span className="shop-trust-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
            <span>Cold-Pressed Groundnut Oil</span>
          </div>

          <div className="shop-trust-pill" role="listitem">
            <span className="shop-trust-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <span>Small Daily Batches</span>
          </div>

          <div className="shop-trust-pill" role="listitem">
            <span className="shop-trust-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </span>
            <span>Express All-India Delivery</span>
          </div>
        </div>
      </div>
    </section>
  );
}
