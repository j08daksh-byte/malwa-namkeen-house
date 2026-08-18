const DISHES = [
  {
    name:     'Banarasi Tamatar Chaat',
    image:    '/mishtichaat/chaat-tamatar.jpg',
    position: 'center center',
  },
  {
    name:     'Tikki Chaat',
    image:    '/mishtichaat/dahi-bhalla.jpg',
    position: 'center 42%',
  },
  {
    name:     'Dahi Puri',
    image:    '/mishtichaat/dahi-puri.png',
    position: 'center center',
  },
  {
    name:     'Rabdi Jalebi',
    image:    '/mishtichaat/jalebi.jpg',
    position: 'center 45%',
  },
];

export default function SignatureDelicacies() {
  function scrollToMenu(e: React.MouseEvent) {
    e.preventDefault();
    document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section id="sweets">
      <style>{`
        /* ── Section ─────────────────────────────────────────────── */
        #sweets {
          background: linear-gradient(160deg, #6B000D 0%, #55000A 100%);
          padding: 64px 56px;
          overflow: hidden;
        }

        #sweets .sd-inner {
          max-width: 1440px;
          margin-inline: auto;
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 42px;
          align-items: center;
        }

        /* ── Left text block ───────────────────────────────────── */
        #sweets .sd-text {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        #sweets .sd-eyebrow {
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #D6A93E;
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 16px;
        }
        #sweets .sd-eyebrow-line {
          width: 22px;
          height: 1px;
          background: rgba(200,154,61,0.55);
          flex-shrink: 0;
        }

        #sweets .sd-heading {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(44px, 4vw, 60px);
          line-height: 0.96;
          font-weight: 700;
          color: #FFF8EC;
          margin: 0 0 18px;
          letter-spacing: -0.02em;
        }
        #sweets .sd-heading em {
          display: block;
          font-style: italic;
          color: #D4AA45;
          font-weight: 600;
        }

        #sweets .sd-rule {
          width: 36px;
          height: 1.5px;
          background: linear-gradient(90deg, #C99A32, rgba(201,154,50,0.28));
          border-radius: 2px;
          margin-bottom: 18px;
        }

        #sweets .sd-desc {
          font-family: Inter, sans-serif;
          font-size: 15px;
          line-height: 1.7;
          color: rgba(255,248,236,0.84);
          max-width: 300px;
          margin-bottom: 28px;
        }

        #sweets .sd-btn {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: #D4AA45;
          color: #2C0612;
          border: none;
          border-radius: 999px;
          height: 48px;
          padding: 0 26px;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          align-self: flex-start;
          box-shadow: 0 10px 24px rgba(200,154,61,0.22);
          transition: background 0.20s, transform 0.20s, box-shadow 0.20s;
          white-space: nowrap;
        }
        #sweets .sd-btn:hover {
          background: #C99A32;
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(200,154,61,0.30);
        }

        /* ── Right: arrows + cards ─────────────────────────────── */
        #sweets .sd-right {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 0;
        }


        /* ── Cards grid ────────────────────────────────────────── */
        #sweets .sd-cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        /* ── Individual card ───────────────────────────────────── */
        #sweets .sd-card {
          position: relative;
          aspect-ratio: 0.78 / 1;
          min-width: 0;
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid rgba(200,154,61,0.42);
          background: #55000A;
          box-shadow: 0 12px 28px rgba(0,0,0,0.16);
          transition: transform 0.30s ease, border-color 0.30s ease, box-shadow 0.30s ease;
        }

        @media (hover: hover) {
          #sweets .sd-card:hover {
            transform: translateY(-5px);
            border-color: rgba(240,199,78,0.80);
            box-shadow: 0 20px 38px rgba(0,0,0,0.24);
          }
          #sweets .sd-card:hover .sd-card-img {
            transform: scale(1.045);
          }
        }

        /* Image fills the entire card */
        #sweets .sd-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.50s ease;
        }

        /* Gradient overlay at the bottom */
        #sweets .sd-card-overlay {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          min-height: 76px;
          padding: 28px 16px 14px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-end;
          background: linear-gradient(
            to top,
            rgba(0,0,0,0.72) 0%,
            rgba(0,0,0,0.40) 55%,
            transparent 100%
          );
        }

        /* Tiny gold line above title */
        #sweets .sd-card-line {
          width: 22px;
          height: 1px;
          background: rgba(200,154,61,0.70);
          border-radius: 2px;
          margin-bottom: 6px;
          flex-shrink: 0;
        }

        #sweets .sd-card-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 17px;
          font-weight: 700;
          line-height: 1.15;
          color: #FFF8EC;
          letter-spacing: -0.01em;
        }

        /* ── Tablet 768–1100px ─────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1100px) {
          #sweets {
            padding: 48px 32px;
          }
          #sweets .sd-inner {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          #sweets .sd-text { max-width: 100%; }
          #sweets .sd-heading { font-size: clamp(36px, 6vw, 52px); }
          #sweets .sd-desc { max-width: 100%; }
          #sweets .sd-cards {
            display: flex;
            gap: 14px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          #sweets .sd-cards::-webkit-scrollbar { display: none; }
          #sweets .sd-card {
            flex: 0 0 240px;
            aspect-ratio: 0.78 / 1;
            scroll-snap-align: start;
          }
        }

        /* ── Mobile < 768px ────────────────────────────────────── */
        @media (max-width: 767px) {
          #sweets {
            padding: 48px 18px;
          }
          #sweets .sd-inner {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          #sweets .sd-text { max-width: 100%; }
          #sweets .sd-heading { font-size: clamp(38px, 10vw, 50px); line-height: 1.0; }
          #sweets .sd-desc { font-size: 14px; max-width: 100%; }
          #sweets .sd-cards {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          #sweets .sd-cards::-webkit-scrollbar { display: none; }
          #sweets .sd-card {
            flex: 0 0 72vw;
            max-width: 250px;
            aspect-ratio: 0.78 / 1;
            scroll-snap-align: start;
          }
        }

        @media (max-width: 360px) {
          #sweets .sd-card { flex: 0 0 78vw; }
          #sweets .sd-heading { font-size: 36px; }
        }
      `}</style>

      <div className="sd-inner">

        {/* ── Left: text ──────────────────────────────────────── */}
        <div className="sd-text">
          <span className="sd-eyebrow">
            <span className="sd-eyebrow-line" aria-hidden="true" />
            Signature Tastes
          </span>
          <h2 className="sd-heading">
            Curated Delicacies
            <em>Just For You</em>
          </h2>
          <div className="sd-rule" aria-hidden="true" />
          <p className="sd-desc">
            From iconic Banarasi flavours to popular street-style chaat, every bite is a journey of nostalgia and delight.
          </p>
          <a href="#menu" className="sd-btn" onClick={scrollToMenu}>
            Explore Menu
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

        {/* ── Right: nav + cards ──────────────────────────────── */}
        <div className="sd-right">

          {/* Cards */}
          <div className="sd-cards" role="list">
            {DISHES.map((dish, i) => (
              <div key={dish.name} className="sd-card" role="listitem">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="sd-card-img"
                  style={{ objectPosition: dish.position }}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <div className="sd-card-overlay">
                  <div className="sd-card-line" aria-hidden="true" />
                  <span className="sd-card-name">{dish.name}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
