import { Link } from 'react-router-dom';

export default function Hero({ onReserve: _onReserve }: { onReserve?: () => void }) {
  return (
    <section id="hero" className="hero-editorial" aria-label="Welcome to Malwa Namkeen House">
      <style>{`
        /* ── Hero Section Main ────────────────────────────────── */
        .hero-editorial {
          --nav-h: 68px;
          position: relative;
          width: 100%;
          min-height: calc(100svh - var(--nav-h));
          background:
            radial-gradient(ellipse at 80% 35%, rgba(201, 154, 50, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 15% 85%, rgba(85, 0, 10, 0.04) 0%, transparent 55%),
            linear-gradient(180deg, #F8F2E8 0%, #F4EAD9 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          padding: clamp(36px, 5vh, 64px) clamp(20px, 4vw, 56px) clamp(24px, 3vh, 40px);
          box-sizing: border-box;
        }

        /* ── Subtle Background Heritage Motifs ────────────────── */
        .hero-editorial__bg-motif {
          position: absolute;
          pointer-events: none;
          opacity: 0.045;
          color: #55000A;
        }
        .hero-editorial__bg-motif--left {
          top: 8%;
          left: -40px;
          width: 260px;
          height: 260px;
        }
        .hero-editorial__bg-motif--right {
          bottom: 4%;
          right: -30px;
          width: 300px;
          height: 300px;
        }

        /* ── Inner Grid Container ─────────────────────────────── */
        .hero-editorial__inner {
          width: min(100%, 1280px);
          margin: auto;
          display: grid;
          grid-template-columns: 44fr 56fr;
          gap: clamp(36px, 5vw, 68px);
          align-items: center;
          position: relative;
          z-index: 1;
        }

        /* ── Left Editorial Copy ──────────────────────────────── */
        .hero-editorial__copy {
          max-width: 500px;
        }

        /* ── Heritage Eyebrow ─────────────────────────────────── */
        .hero-editorial__eyebrow-row {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .hero-editorial__eyebrow {
          color: #B77F22;
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.22em;
          line-height: 1;
          text-transform: uppercase;
        }
        .hero-editorial__eyebrow-star {
          width: 10px;
          height: 10px;
          color: #C99A32;
          flex-shrink: 0;
        }

        /* ── Editorial Headline ───────────────────────────────── */
        .hero-editorial__title {
          margin: 0;
          color: #55000A;
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(48px, 5.2vw, 76px);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 0.94;
        }

        /* ── Description ──────────────────────────────────────── */
        .hero-editorial__description {
          max-width: 440px;
          margin: 22px 0 0;
          color: #5E4940;
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: clamp(14px, 1.15vw, 15.5px);
          font-weight: 450;
          line-height: 1.68;
        }

        /* ── CTA Action Buttons ───────────────────────────────── */
        .hero-editorial__actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 13px;
          margin-top: 28px;
        }
        .hero-editorial__btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 48px;
          padding: 0 26px;
          border-radius: 999px;
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.22s ease, border-color 0.22s ease, color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
        }
        .hero-editorial__btn--primary {
          border: 1px solid #55000A;
          background: #55000A;
          color: #FFF8EC;
          box-shadow: 0 8px 22px rgba(85, 0, 10, 0.18);
        }
        .hero-editorial__btn--primary:hover {
          background: #6B000D;
          border-color: #6B000D;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(85, 0, 10, 0.26);
        }
        .hero-editorial__btn--primary .hero-editorial__btn-arrow {
          transition: transform 0.22s ease;
        }
        .hero-editorial__btn--primary:hover .hero-editorial__btn-arrow {
          transform: translateX(3px);
        }

        .hero-editorial__btn--secondary {
          border: 1.5px solid rgba(85, 0, 10, 0.36);
          background: transparent;
          color: #55000A;
        }
        .hero-editorial__btn--secondary:hover {
          background: rgba(85, 0, 10, 0.07);
          border-color: #55000A;
          transform: translateY(-2px);
        }

        /* ── Trust / Authenticity Strip ───────────────────────── */
        .hero-editorial__trust-strip {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px 14px;
          margin-top: 26px;
          padding-top: 18px;
          border-top: 1px solid rgba(201, 154, 50, 0.24);
        }
        .hero-editorial__trust-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #7A655D;
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        .hero-editorial__trust-dot {
          color: #C99A32;
          font-size: 10px;
          line-height: 1;
        }

        /* ── Right Image Section & Composition ────────────────── */
        .hero-editorial__image-section {
          position: relative;
          width: 100%;
        }

        /* Subtle decorative frame around image */
        .hero-editorial__image-frame {
          position: relative;
          border-radius: 24px;
          padding: 8px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.7) 0%, rgba(246, 237, 224, 0.4) 100%);
          border: 1px solid rgba(201, 154, 50, 0.28);
          box-shadow: 0 20px 48px rgba(85, 0, 10, 0.12);
        }

        .hero-editorial__image-wrap {
          width: 100%;
          aspect-ratio: 1.32 / 1;
          overflow: hidden;
          border-radius: 18px;
          background: #E4D2BF;
          position: relative;
        }
        .hero-editorial__image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
          transition: transform 0.6s cubic-bezier(0.2, 0, 0.2, 1);
        }
        .hero-editorial__image-frame:hover .hero-editorial__image {
          transform: scale(1.025);
        }

        /* ── Floating Authenticity Badge ──────────────────────── */
        .hero-editorial__badge {
          position: absolute;
          bottom: -12px;
          left: -12px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFFDF8;
          border: 1px solid rgba(201, 154, 50, 0.45);
          border-radius: 999px;
          padding: 8px 16px;
          box-shadow:
            0 8px 24px rgba(85, 0, 10, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .hero-editorial__badge-icon {
          width: 14px;
          height: 14px;
          color: #B77F22;
          flex-shrink: 0;
        }
        .hero-editorial__badge-text {
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 750;
          letter-spacing: 0.05em;
          color: #55000A;
          white-space: nowrap;
          text-transform: uppercase;
        }

        /* ── Bottom Scroll Cue ────────────────────────────────── */
        .hero-editorial__scroll-cue {
          margin-top: clamp(16px, 2.5vh, 28px);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #9E887E;
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.2s ease, transform 0.2s ease;
          position: relative;
          z-index: 1;
        }
        .hero-editorial__scroll-cue:hover {
          color: #55000A;
          transform: translateY(2px);
        }
        .hero-editorial__scroll-cue-arrow {
          animation: heroScrollBob 2s ease-in-out infinite;
        }

        @keyframes heroScrollBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }

        /* ── Tablet Viewport 768px – 1023px ──────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .hero-editorial {
            padding: 44px 28px 32px;
          }
          .hero-editorial__inner {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
          .hero-editorial__title {
            font-size: clamp(38px, 4.5vw, 54px);
          }
          .hero-editorial__description {
            font-size: 13.5px;
            margin-top: 16px;
          }
          .hero-editorial__actions {
            margin-top: 22px;
          }
          .hero-editorial__trust-strip {
            margin-top: 20px;
            padding-top: 14px;
          }
          .hero-editorial__badge {
            bottom: -8px;
            left: -8px;
            padding: 6px 13px;
          }
          .hero-editorial__badge-text {
            font-size: 10px;
          }
        }

        /* ── Mobile Viewport < 768px ──────────────────────────── */
        @media (max-width: 767px) {
          .hero-editorial {
            min-height: auto;
            padding: 28px 16px 32px;
            display: block;
          }
          .hero-editorial__inner {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .hero-editorial__copy {
            max-width: 100%;
          }
          .hero-editorial__eyebrow-row {
            margin-bottom: 10px;
          }
          .hero-editorial__title {
            font-size: clamp(34px, 10vw, 48px);
            line-height: 0.96;
          }
          .hero-editorial__description {
            margin-top: 14px;
            font-size: 13.5px;
            line-height: 1.62;
          }
          .hero-editorial__actions {
            margin-top: 20px;
            gap: 10px;
          }
          .hero-editorial__btn {
            padding: 0 20px;
            min-height: 44px;
            font-size: 11px;
          }
          .hero-editorial__trust-strip {
            margin-top: 18px;
            padding-top: 12px;
            gap: 6px 10px;
          }
          .hero-editorial__trust-item {
            font-size: 11px;
          }
          .hero-editorial__image-section {
            margin-top: 8px;
          }
          .hero-editorial__image-frame {
            border-radius: 18px;
            padding: 6px;
          }
          .hero-editorial__image-wrap {
            border-radius: 14px;
            aspect-ratio: 1.28 / 1;
          }
          .hero-editorial__badge {
            bottom: 10px;
            left: 10px;
            padding: 6px 12px;
          }
          .hero-editorial__badge-text {
            font-size: 9.5px;
          }
          .hero-editorial__scroll-cue {
            display: none;
          }
        }

        /* ── Very Small Mobile < 480px ────────────────────────── */
        @media (max-width: 480px) {
          .hero-editorial__actions {
            display: flex;
            flex-direction: column;
            width: 100%;
          }
          .hero-editorial__btn {
            width: 100%;
          }
        }

        /* ── Reduced Motion Preference ────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .hero-editorial__btn,
          .hero-editorial__image,
          .hero-editorial__scroll-cue-arrow {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>

      {/* ── Faint Heritage Motif Overlays ─────────────────────── */}
      <svg className="hero-editorial__bg-motif hero-editorial__bg-motif--left" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <path d="M50 0 C77.6 0 100 22.4 100 50 C100 77.6 77.6 100 50 100 C22.4 100 0 77.6 0 50 C0 22.4 22.4 0 50 0 Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3"/>
        <path d="M50 15 C69.3 15 85 30.7 85 50 C85 69.3 69.3 85 50 85 C30.7 85 15 69.3 15 50 C15 30.7 30.7 15 50 15 Z" stroke="currentColor" strokeWidth="0.8"/>
        <path d="M50 30 L50 70 M30 50 L70 50 M36 36 L64 64 M36 64 L64 36" stroke="currentColor" strokeWidth="0.6"/>
      </svg>
      <svg className="hero-editorial__bg-motif hero-editorial__bg-motif--right" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <path d="M50 5 Q75 25 95 50 Q75 75 50 95 Q25 75 5 50 Q25 25 50 5 Z" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="50" cy="50" r="24" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2"/>
      </svg>

      {/* ── Main Content Grid ─────────────────────────────────── */}
      <div className="hero-editorial__inner">
        {/* ── Left Column: Editorial Copy ── */}
        <div className="hero-editorial__copy">
          {/* Eyebrow */}
          <div className="hero-editorial__eyebrow-row">
            <svg className="hero-editorial__eyebrow-star" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M6 0L7.4 4.6L12 6L7.4 7.4L6 12L4.6 7.4L0 6L4.6 4.6L6 0Z" />
            </svg>
            <span className="hero-editorial__eyebrow">MALWA • UJJAIN • EST. 1978</span>
          </div>

          {/* Headline */}
          <h1 className="hero-editorial__title">
            Ujjain&apos;s crisp<br />
            tradition,<br />
            made to share.
          </h1>

          {/* Description */}
          <p className="hero-editorial__description">
            Small-batch sev, chivda and traditional mixtures made with authentic Malwa flavours, roasted spices and recipes passed down through generations.
          </p>

          {/* CTA Buttons */}
          <div className="hero-editorial__actions">
            <Link className="hero-editorial__btn hero-editorial__btn--primary" to="/shop">
              <span>Explore The Shop</span>
              <svg className="hero-editorial__btn-arrow" width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link className="hero-editorial__btn hero-editorial__btn--secondary" to="/#story">
              Our Story
            </Link>
          </div>

          {/* Trust / Authenticity Strip */}
          <div className="hero-editorial__trust-strip" aria-label="Brand hallmarks">
            <span className="hero-editorial__trust-item">Freshly Packed</span>
            <span className="hero-editorial__trust-dot" aria-hidden="true">•</span>
            <span className="hero-editorial__trust-item">Authentic Malwa Taste</span>
            <span className="hero-editorial__trust-dot" aria-hidden="true">•</span>
            <span className="hero-editorial__trust-item">Small Batch</span>
          </div>
        </div>

        {/* ── Right Column: Editorial Image Composition ── */}
        <div className="hero-editorial__image-section">
          <div className="hero-editorial__image-frame">
            <div className="hero-editorial__image-wrap">
              <img
                className="hero-editorial__image"
                src="/mishtichaat/chaat-plate.jpg"
                alt="Artisanal Malwa Ratlami Sev and Namkeens"
                fetchPriority="high"
                onError={e => {
                  const el = e.currentTarget;
                  if (!el.src.includes('/mishtichaat/chaat-plate.jpg')) {
                    el.src = '/mishtichaat/chaat-plate.jpg';
                  }
                }}
              />
            </div>
          </div>

          {/* Floating Authenticity Badge */}
          <div className="hero-editorial__badge" aria-hidden="true">
            <svg className="hero-editorial__badge-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0L9.8 5.6L15.6 6.2L11.2 9.9L12.7 15.6L8 12.6L3.3 15.6L4.8 9.9L0.4 6.2L6.2 5.6L8 0Z" />
            </svg>
            <span className="hero-editorial__badge-text">Traditional Malwa Recipe</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Scroll Cue ─────────────────────────────────── */}
      <a className="hero-editorial__scroll-cue" href="#heritage" aria-label="Scroll to discover">
        <span>Scroll to discover</span>
        <span className="hero-editorial__scroll-cue-arrow" aria-hidden="true">↓</span>
      </a>
    </section>
  );
}
