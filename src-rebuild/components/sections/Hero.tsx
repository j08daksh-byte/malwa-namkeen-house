const HERO_IMAGE = "/mishtichaat/semi-hero.png";

function scrollTo(id: string) {
  if (id === '#hero') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Hero({ onReserve }: { onReserve?: () => void }) {
  return (
    <section id="hero" className="hero-split">
      <style>{`
        /* ══════════════════════════════════════════════════
           DESKTOP  ≥ 768px
           ══════════════════════════════════════════════════ */
        .hero-split {
          --nav-h: 68px;
          --mobile-nav-h: 68px;
          width: 100%;
          height: calc(100svh - var(--nav-h));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #EAD5C2;
        }

        .hero-image-section {
          position: relative;
          width: 100%;
          flex: 0 0 57%;
          min-height: 0;
          overflow: hidden;
          background: #EAD5C2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-image-section img {
          width: 103.1%;
          height: 103.1%;
          max-width: none;
          display: block;
          object-fit: cover;
          object-position: center 50%;
          transform: scale(0.97);
          transform-origin: center;
        }

        .hero-content-section {
          width: 100%;
          flex: 0 0 43%;
          min-height: 0;
          overflow: hidden;
          background: #EAD5C2;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 20px 14px;
        }

        .hero-inner {
          width: min(100%, 980px);
          margin-inline: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          transform: none;
        }

        /* Centred flex decorative dividers */
        .hero-divider {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-inline: auto;
        }

        .hero-divider-line {
          display: block;
          width: 52px;
          height: 1px;
          flex: 0 0 52px;
          background: #C99A32;
        }

        .hero-divider-diamond {
          display: block;
          flex: 0 0 auto;
          color: #C99A32;
          font-size: 8px;
          line-height: 1;
        }

        .hero-divider--top {
          margin: 0 auto 10px;
        }

        .hero-divider--bottom {
          margin: 10px auto 10px;
        }

        /* Main heading — refined editorial serif */
        .hero-title {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(44px, 4.4vw, 70px);
          line-height: 0.93;
          font-weight: 600;
          color: #55000A;
          letter-spacing: -0.025em;
          margin: 0;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.06em;
        }
        /* First line — upright */
        .hero-title-line1 {
          display: block;
          font-style: normal;
          font-weight: 600;
        }
        /* Second line — italic, slightly lighter */
        .hero-title-line2 {
          display: block;
          font-style: italic;
          font-weight: 500;
          color: #55000A;
        }

        /* Body copy */
        .hero-description {
          width: min(100%, 820px);
          margin: 0 auto;
          text-align: center;
          font-family: Inter, sans-serif;
          font-size: clamp(14px, 1.05vw, 17px);
          line-height: 1.42;
          font-weight: 500;
          color: #5E4940;
        }

        /* Buttons row */
        .hero-actions {
          width: 100%;
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }
        .hero-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 48px;
          padding: 0 34px;
          background: #55000A;
          color: #FFF8EC;
          border: 1.5px solid #55000A;
          border-radius: 999px;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          box-shadow: 0 10px 26px rgba(85,0,10,0.20);
          transition: background 0.22s, border-color 0.22s, transform 0.22s, box-shadow 0.22s;
          white-space: nowrap;
        }
        .hero-btn-primary:hover {
          background: #6B000D;
          border-color: #6B000D;
          transform: translateY(-2px);
          box-shadow: 0 16px 32px rgba(85,0,10,0.26);
        }
        .hero-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 48px;
          padding: 0 34px;
          background: transparent;
          color: #55000A;
          border: 1px solid rgba(85,0,10,0.45);
          border-radius: 999px;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.22s, border-color 0.22s, transform 0.22s;
          white-space: nowrap;
        }
        .hero-btn-secondary:hover {
          background: rgba(85,0,10,0.05);
          border-color: rgba(85,0,10,0.70);
          transform: translateY(-2px);
        }

        /* ── 1440px+ ────────────────────────────────────── */
        @media (min-width: 1440px) {
          .hero-inner { max-width: 860px; }
        }

        /* ── Tablet 768–1023px ──────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .hero-image-section {
            flex-basis: 54%;
          }
          .hero-content-section {
            flex-basis: 46%;
            padding: 14px 20px 18px;
          }
          .hero-image-section img {
            width: 102%;
            height: 102%;
            max-width: none;
            object-fit: cover;
            object-position: center;
            transform: scale(0.98);
          }
          .hero-title {
            font-size: clamp(42px, 6vw, 60px);
          }
          .hero-actions {
            margin-top: 14px;
          }
          .hero-divider-line {
            width: 44px;
            flex-basis: 44px;
          }
        }

        /* ══════════════════════════════════════════════════
           MOBILE  < 768px
           ══════════════════════════════════════════════════ */
        @media (max-width: 767px) {
          .hero-split {
            height: auto;
            min-height: calc(100svh - var(--mobile-nav-h));
            overflow: visible;
          }

          .hero-image-section {
            flex: none;
            width: 100%;
            height: clamp(260px, 38svh, 340px);
            overflow: hidden;
            background: #EAD5C2;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .hero-image-section img {
            width: 100%;
            height: 100%;
            max-width: none;
            object-fit: cover;
            object-position: center 50%;
            transform: scale(1.03);
            transform-origin: center;
          }

          .hero-content-section {
            flex: none;
            height: auto;
            min-height: 0;
            overflow: visible;
            padding: 18px 18px 28px;
            background: #EAD5C2;
          }

          .hero-inner {
            width: 100%;
            transform: none;
          }

          .hero-divider--top { margin-bottom: 8px; }
          .hero-ornament-bar { width: 18px; }

          .hero-title {
            font-size: clamp(38px, 11.5vw, 52px);
            line-height: 0.94;
          }

          .hero-divider--bottom { margin-top: 8px; }
          .hero-divider-bar { width: 30px; }

          .hero-description {
            font-size: 14px;
            line-height: 1.5;
            max-width: 300px;
            margin: 8px auto 0;
          }

          .hero-divider {
            gap: 9px;
          }

          .hero-divider-line {
            width: 36px;
            flex-basis: 36px;
          }

          .hero-actions {
            display: flex;
            flex-direction: row;
            justify-content: center;
            gap: 12px;
            margin-top: 14px;
            width: 100%;
            flex-wrap: wrap;
          }
          .hero-btn-primary,
          .hero-btn-secondary {
            width: auto;
            flex: 0 1 auto;
            height: 46px;
            font-size: 10px;
            padding: 0 24px;
          }
        }

        @media (max-width: 480px) {
          .hero-actions {
            flex-direction: column;
            gap: 10px;
          }
          .hero-actions > * {
            width: 100%;
          }
          .hero-btn-primary,
          .hero-btn-secondary {
            padding: 0 16px;
          }
        }

        @media (max-width: 430px) {
          .hero-title  { font-size: clamp(30px, 9.5vw, 42px); }
          .hero-description { font-size: 12.5px; }
        }
        @media (max-width: 390px) {
          .hero-title  { font-size: clamp(28px, 9vw, 38px); }
          .hero-description { font-size: 12px; max-width: 270px; }
        }
        @media (max-width: 360px) {
          .hero-title  { font-size: 26px; }
          .hero-description { font-size: 11.5px; }
          .hero-actions { gap: 7px; }
          .hero-btn-primary, .hero-btn-secondary { height: 42px; }
        }
        @media (max-width: 320px) {
          .hero-title  { font-size: 24px; }
          .hero-description { font-size: 11px; }
        }
      `}</style>

      <div className="hero-image-section">
        <img
          src={HERO_IMAGE}
          alt="MishtiChaat Banaras heritage"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <div className="hero-content-section">
        <div className="hero-inner">

          <h1 className="hero-title">
            <span className="hero-title-line1">With Love</span>
            <span className="hero-title-line2">From Banaras</span>
          </h1>

          <div className="hero-divider hero-divider--bottom" aria-hidden="true">
            <span className="hero-divider-line" />
            <span className="hero-divider-diamond">◆</span>
            <span className="hero-divider-line" />
          </div>

          <p className="hero-description">
            Rooted in the timeless flavours of Banaras, Mishti Chaat brings handcrafted sweets, soulful street food and warm hospitality to the heart of Bengaluru.
          </p>

          <div className="hero-actions">
            <a
              href="#menu"
              className="hero-btn-primary"
              onClick={e => { e.preventDefault(); scrollTo('#menu'); }}
            >
              Explore Menu
            </a>
            <button
              className="hero-btn-secondary"
              onClick={() => onReserve?.()}
              style={{ background: 'transparent', cursor: 'pointer' }}
              title="Reservation requests are manually confirmed by our team"
            >
              Reservation Enquiry
            </button>
          </div>

        </div>
      </div>

    </section>
  );
}
