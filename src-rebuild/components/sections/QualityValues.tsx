const CARDS = [
  {
    title: 'Pure Groundnut Oil',
    desc: 'Prepared exclusively in 100% pure cold-pressed groundnut oil — zero palm oil, zero trans fats.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2C9 7 5 8.5 5 13a7 7 0 0014 0c0-4.5-4-6-7-11z" stroke="#B77F22" strokeWidth="1.6" strokeLinejoin="round" fill="rgba(183,127,34,0.14)"/>
        <path d="M12 9v8M9 14l3 3 3-3" stroke="#B77F22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Stone-Ground Spices',
    desc: 'Aromatic cloves, black pepper, hing, and ajwain blended in-house for bold authentic Malwa taste.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2l1.5 4.5H18l-3.7 2.7 1.4 4.3L12 11l-3.7 2.5 1.4-4.3L6 6.5h4.5z" stroke="#B77F22" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(183,127,34,0.14)"/>
        <circle cx="12" cy="19" r="1.5" fill="#B77F22"/>
        <path d="M8.5 16.5q3.5 2 7 0" stroke="#B77F22" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'Small-Batch Heritage',
    desc: 'Traditional artisan techniques passed down through generations — never rushed, never automated.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <ellipse cx="12" cy="8" rx="7" ry="3" stroke="#B77F22" strokeWidth="1.5" fill="rgba(183,127,34,0.12)"/>
        <path d="M5 8v4c0 1.66 3.13 3 7 3s7-1.34 7-3V8" stroke="#B77F22" strokeWidth="1.5"/>
        <path d="M5 12v4c0 1.66 3.13 3 7 3s7-1.34 7-3v-4" stroke="#B77F22" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    title: 'Aroma-Seal Freshness',
    desc: 'Crisp, vacuum-sealed packaging protects flavour and crunch for fresh delivery anywhere in India.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="9" width="16" height="12" rx="2" stroke="#B77F22" strokeWidth="1.5" fill="rgba(183,127,34,0.12)"/>
        <path d="M8 9V7a4 4 0 018 0v2" stroke="#B77F22" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 14h6M12 12v4" stroke="#B77F22" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
];

type Card = typeof CARDS[0];

function PromiseCard({ title, desc, icon }: Card) {
  return (
    <div className="qv-card">
      {/* Top gold accent bar — via pseudo, replicated with inline div for JSX compat */}
      <div className="qv-top-accent" aria-hidden="true" />
      {/* Bottom-right glow */}
      <div className="qv-corner-glow" aria-hidden="true" />
      {/* Corner flourish */}
      <svg className="qv-corner-flourish" width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path d="M2 26 Q2 2 26 2" stroke="rgba(201,154,50,0.22)" strokeWidth="1" fill="none"/>
        <circle cx="2" cy="26" r="2" fill="rgba(200,154,61,0.18)"/>
        <circle cx="26" cy="2" r="2" fill="rgba(200,154,61,0.18)"/>
      </svg>

      <div className="qv-badge">{icon}</div>
      <div className="qv-icon-line" aria-hidden="true" />
      <h3 className="qv-title">{title}</h3>
      <p className="qv-desc">{desc}</p>
    </div>
  );
}

export default function QualityValues() {
  return (
    <section id="quality" aria-label="Our Promise">
      <style>{`
        /* ── Section ──────────────────────────────────────────────── */
        #quality {
          background:
            radial-gradient(circle at 50% 12%, rgba(200,154,61,0.08), transparent 32%),
            linear-gradient(180deg, #F8F1E7 0%, #F3E9DA 100%);
          padding: 78px 24px 86px;
          overflow-x: hidden;
        }
        #quality .qv-inner {
          max-width: 1220px;
          margin-inline: auto;
        }

        /* ── Header ───────────────────────────────────────────────── */
        #quality .qv-header {
          max-width: 760px;
          margin: 0 auto clamp(44px, 5.5vw, 64px);
          text-align: center;
          position: relative;
        }
        #quality .qv-eyebrow-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-bottom: 16px;
          position: relative;
        }
        #quality .qv-eyebrow {
          font-family: Inter, sans-serif;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #B77F22;
        }
        #quality .qv-h2 {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(50px, 5vw, 72px);
          line-height: 0.95;
          font-weight: 650;
          color: #3A211D;
          letter-spacing: -0.02em;
          margin: 0 0 22px;
        }
        #quality .qv-h2 em {
          color: #55000A;
          font-style: italic;
          font-weight: 600;
        }
        #quality .qv-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        #quality .qv-dbar {
          width: clamp(28px, 3vw, 48px);
          height: 1px;
          background: rgba(200,154,61,0.55);
        }
        #quality .qv-sub {
          font-family: Inter, sans-serif;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.65;
          color: #5E4940;
          max-width: 720px;
          margin: 0 auto;
        }

        /* ── Grid ─────────────────────────────────────────────────── */
        #quality .qv-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 22px;
          align-items: stretch;
        }

        /* ── Card ─────────────────────────────────────────────────── */
        #quality .qv-card {
          background: linear-gradient(180deg, #FFFDF8 0%, #FBF6EE 100%);
          border: 1px solid rgba(200,154,61,0.38);
          border-radius: 22px;
          padding: 32px 26px 30px;
          box-shadow:
            0 14px 34px rgba(79,31,24,0.08),
            inset 0 1px 0 rgba(255,255,255,0.85);
          text-align: center;
          position: relative;
          overflow: hidden;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease;
        }
        @media (hover: hover) {
          #quality .qv-card:hover {
            transform: translateY(-7px);
            border-color: rgba(200,154,61,0.72);
            box-shadow:
              0 22px 46px rgba(79,31,24,0.14),
              0 0 0 1px rgba(200,154,61,0.08);
          }
          #quality .qv-card:hover .qv-badge {
            transform: scale(1.06) rotate(2deg);
            background: linear-gradient(145deg, #FFF4D7, #EFD495);
          }
        }

        /* ── Top accent bar ───────────────────────────────────────── */
        #quality .qv-top-accent {
          position: absolute;
          top: 0; left: 18%; right: 18%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #C99A32, transparent);
          border-radius: 0 0 2px 2px;
        }

        /* ── Corner glow ──────────────────────────────────────────── */
        #quality .qv-corner-glow {
          position: absolute;
          width: 110px; height: 110px;
          right: -45px; bottom: -45px;
          border-radius: 50%;
          background: rgba(85,0,10,0.04);
          pointer-events: none;
        }

        /* ── Corner flourish SVG ──────────────────────────────────── */
        #quality .qv-corner-flourish {
          position: absolute;
          top: 12px; left: 12px;
          pointer-events: none;
        }

        /* ── Icon badge ───────────────────────────────────────────── */
        #quality .qv-badge {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(145deg, #FFF8E9, #F2E1BC);
          border: 1px solid rgba(200,154,61,0.55);
          box-shadow: 0 8px 18px rgba(200,154,61,0.14);
          display: grid;
          place-items: center;
          margin-top: 10px;
          flex-shrink: 0;
          transition: transform 0.25s ease, background 0.25s ease;
        }

        /* ── Icon-to-title separator ──────────────────────────────── */
        #quality .qv-icon-line {
          width: 28px;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, #C99A32, transparent);
          border-radius: 2px;
          margin: 14px auto 0;
          flex-shrink: 0;
        }

        /* ── Card typography ──────────────────────────────────────── */
        #quality .qv-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.15;
          color: #55000A;
          margin: 18px 0 10px;
        }
        #quality .qv-desc {
          font-family: Inter, Arial, sans-serif;
          font-size: 14.5px;
          font-weight: 500;
          line-height: 1.65;
          color: #5A463E;
          max-width: 250px;
          margin: 0 auto;
        }

        /* ── Tablet 768–1100px ────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1100px) {
          #quality .qv-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }
        }

        /* ── Mobile < 768px ───────────────────────────────────────── */
        @media (max-width: 767px) {
          #quality {
            padding: 44px 16px 48px;
          }
          #quality .qv-header {
            margin-bottom: 28px;
          }
          #quality .qv-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          #quality .qv-card {
            padding: 18px 12px 16px;
            border-radius: 16px;
            min-height: 0;
          }
          #quality .qv-badge {
            width: 44px; height: 44px;
            margin-top: 4px;
          }
          #quality .qv-h2 {
            font-size: clamp(32px, 8vw, 42px);
            line-height: 0.98;
            margin-bottom: 14px;
          }
          #quality .qv-sub {
            font-size: 13.5px;
            line-height: 1.55;
          }
          #quality .qv-title {
            font-size: 16.5px;
            margin: 12px 0 6px;
          }
          #quality .qv-desc {
            font-size: 12px;
            line-height: 1.5;
            max-width: none;
          }
        }

        /* ── Very small < 360px ───────────────────────────────────── */
        @media (max-width: 359px) {
          #quality .qv-grid {
            grid-template-columns: 1fr;
          }
          #quality .qv-h2 { font-size: 28px; }
        }
      `}</style>

      <div className="qv-inner">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="qv-header">
          {/* Faint arc behind heading */}
          <div className="qv-eyebrow-row">
            {/* Tiny gold star */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              {[0,60,120,180,240,300].map(deg => (
                <ellipse key={deg} cx="6" cy="6" rx="1.5" ry="3" fill="rgba(183,127,34,0.60)" transform={`rotate(${deg} 6 6)`} />
              ))}
              <circle cx="6" cy="6" r="1.7" fill="#B77F22" />
            </svg>
            <span className="qv-eyebrow">Our Promise</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              {[0,60,120,180,240,300].map(deg => (
                <ellipse key={deg} cx="6" cy="6" rx="1.5" ry="3" fill="rgba(183,127,34,0.60)" transform={`rotate(${deg} 6 6)`} />
              ))}
              <circle cx="6" cy="6" r="1.7" fill="#B77F22" />
            </svg>
          </div>

          <h2 className="qv-h2">
            Crafted with Love
          </h2>

          <div className="qv-divider">
            <div className="qv-dbar" />
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M5 0.5L9.5 5L5 9.5L0.5 5Z" stroke="#C99A32" strokeWidth="0.9" fill="rgba(201,154,50,0.22)"/>
              <circle cx="5" cy="5" r="1.7" fill="#C99A32"/>
            </svg>
            <div className="qv-dbar" />
          </div>

          <p className="qv-sub">
            Our sweets and dishes are prepared with carefully selected ingredients, hygienic processes and traditional recipes.
          </p>
        </div>

        {/* ── Cards ───────────────────────────────────────────────── */}
        <div className="qv-grid">
          {CARDS.map(card => <PromiseCard key={card.title} {...card} />)}
        </div>

      </div>
    </section>
  );
}
