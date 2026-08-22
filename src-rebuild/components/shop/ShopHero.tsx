import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ShopHero() {
  const navigate = useNavigate();

  return (
    <section className="shop-hero" aria-labelledby="shop-hero-heading">
      <style>{`
        .shop-hero {
          background: linear-gradient(175deg, #55000A 0%, #400007 100%);
          color: #FFF8EC;
          padding: clamp(36px, 5vw, 56px) clamp(20px, 4vw, 48px) clamp(44px, 5vw, 64px);
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid rgba(200, 154, 61, 0.24);
        }

        .shop-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 82% 20%, rgba(201, 154, 50, 0.12) 0%, transparent 60%),
                      radial-gradient(circle at 10% 80%, rgba(201, 154, 50, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        .shop-hero__inner {
          max-width: 1240px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .shop-hero__breadcrumb {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 248, 236, 0.70);
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        .shop-hero__breadcrumb-link {
          color: rgba(255, 248, 236, 0.70);
          text-decoration: none;
          transition: color 0.18s ease;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          font: inherit;
        }

        .shop-hero__breadcrumb-link:hover {
          color: #D4AA45;
        }

        .shop-hero__breadcrumb-sep {
          color: #C99A32;
        }

        .shop-hero__breadcrumb-current {
          color: #D4AA45;
        }

        .shop-hero__header-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 32px;
          align-items: flex-end;
          margin-bottom: 36px;
        }

        .shop-hero__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #D4AA45;
          margin-bottom: 12px;
        }

        .shop-hero__eyebrow-line {
          width: 24px;
          height: 1.5px;
          background: #C99A32;
          display: inline-block;
        }

        .shop-hero__title {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(38px, 4.8vw, 68px);
          font-weight: 600;
          letter-spacing: -0.03em;
          line-height: 0.96;
          color: #FFF8EC;
          margin: 0 0 14px;
        }

        .shop-hero__title em {
          font-style: italic;
          color: #D4AA45;
          font-weight: 500;
        }

        .shop-hero__description {
          max-width: 620px;
          font-family: Inter, sans-serif;
          font-size: clamp(13.5px, 1.1vw, 15.5px);
          color: rgba(255, 248, 236, 0.82);
          line-height: 1.7;
          margin: 0;
        }

        .shop-hero__callout {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255, 248, 236, 0.05);
          border: 1px solid rgba(200, 154, 61, 0.32);
          padding: 16px 22px;
          border-radius: 16px;
          backdrop-filter: blur(8px);
          max-width: 380px;
        }

        .shop-hero__callout-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(201, 154, 50, 0.15);
          border: 1px solid rgba(201, 154, 50, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #D4AA45;
          flex-shrink: 0;
        }

        .shop-hero__callout-text h4 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 17px;
          font-weight: 700;
          color: #FFF8EC;
          margin: 0 0 2px;
          letter-spacing: -0.01em;
        }

        .shop-hero__callout-text p {
          font-family: Inter, sans-serif;
          font-size: 11.5px;
          color: rgba(255, 248, 236, 0.72);
          line-height: 1.45;
          margin: 0;
        }

        /* ── Trust highlights strip ────────────────────────── */
        .shop-hero__badges {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          padding-top: 28px;
          border-top: 1px solid rgba(200, 154, 61, 0.18);
        }

        .shop-hero__badge-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .shop-hero__badge-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(201, 154, 50, 0.12);
          border: 1px solid rgba(201, 154, 50, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #D4AA45;
          flex-shrink: 0;
        }

        .shop-hero__badge-label {
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #FFF8EC;
          letter-spacing: 0.02em;
          line-height: 1.3;
        }

        .shop-hero__badge-sub {
          display: block;
          font-size: 10.5px;
          font-weight: 400;
          color: rgba(255, 248, 236, 0.60);
        }

        @media (max-width: 960px) {
          .shop-hero__header-grid {
            grid-template-columns: 1fr;
            gap: 22px;
          }
          .shop-hero__callout {
            max-width: 100%;
          }
          .shop-hero__badges {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px 20px;
          }
        }

        @media (max-width: 540px) {
          .shop-hero {
            padding: 24px 16px 32px;
          }
          .shop-hero__title {
            font-size: clamp(32px, 9vw, 42px);
          }
          .shop-hero__callout {
            padding: 12px 16px;
            gap: 12px;
          }
          .shop-hero__badges {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px 10px;
          }
          .shop-hero__badge-label {
            font-size: 11px;
          }
          .shop-hero__badge-sub {
            font-size: 9.5px;
          }
        }

        @media (max-width: 360px) {
          .shop-hero__badges {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="shop-hero__inner">
        {/* Breadcrumb */}
        <nav className="shop-hero__breadcrumb" aria-label="Breadcrumb">
          <button
            className="shop-hero__breadcrumb-link"
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Home
          </button>
          <span className="shop-hero__breadcrumb-sep" aria-hidden="true">/</span>
          <span className="shop-hero__breadcrumb-current">The Malwa Shop</span>
        </nav>

        {/* Heading & Intro Grid */}
        <div className="shop-hero__header-grid">
          <div>
            <span className="shop-hero__eyebrow">
              <span className="shop-hero__eyebrow-line" aria-hidden="true" />
              Handcrafted in Small Batches
            </span>
            <h1 id="shop-hero-heading" className="shop-hero__title">
              The Taste of <em>Malwa</em>
            </h1>
            <p className="shop-hero__description">
              Authentic Ratlami sev, fragrant clove mixtures, flaky mathris, and pure-ghee mithai prepared with cold-pressed groundnut oil, whole spices, and time-honoured Ujjaini heritage recipes.
            </p>
          </div>

          <div className="shop-hero__callout">
            <div className="shop-hero__callout-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="shop-hero__callout-text">
              <h4>Fresh Dispatch Daily</h4>
              <p>Packaged in vacuum-sealed food-grade tins & zip pouches for peak freshness.</p>
            </div>
          </div>
        </div>

        {/* Badges Strip */}
        <div className="shop-hero__badges" role="list">
          <div className="shop-hero__badge-item" role="listitem">
            <div className="shop-hero__badge-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <span className="shop-hero__badge-label">100% Pure Oils</span>
              <span className="shop-hero__badge-sub">Groundnut & Desi Cow Ghee</span>
            </div>
          </div>

          <div className="shop-hero__badge-item" role="listitem">
            <div className="shop-hero__badge-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-5" />
              </svg>
            </div>
            <div>
              <span className="shop-hero__badge-label">Zero Preservatives</span>
              <span className="shop-hero__badge-sub">No artificial colors or MSG</span>
            </div>
          </div>

          <div className="shop-hero__badge-item" role="listitem">
            <div className="shop-hero__badge-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div>
              <span className="shop-hero__badge-label">Pan-India Express</span>
              <span className="shop-hero__badge-sub">Dispatched within 24 hours</span>
            </div>
          </div>

          <div className="shop-hero__badge-item" role="listitem">
            <div className="shop-hero__badge-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <span className="shop-hero__badge-label">Heirloom Recipes</span>
              <span className="shop-hero__badge-sub">Generations of craft</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
