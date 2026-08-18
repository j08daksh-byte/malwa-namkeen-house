import { EVENTS } from '../../lib/events';
import { NAV_HEIGHT } from '../../lib/tokens';
import { CARDS, type CardData } from '../../data/heritage-cards';

function goToMenu(categoryId: string) {
  window.dispatchEvent(new CustomEvent(EVENTS.MENU_CATEGORY, { detail: categoryId }));
  const el = document.querySelector('#menu');
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ card, idx }: { card: CardData; idx: number }) {
  const activate = () => goToMenu(card.menuCategory);
  return (
    <div
      className="heritage-card"
      data-ci={idx}
      role="button"
      tabIndex={0}
      aria-label={card.ariaLabel}
      onClick={activate}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } }}
    >
      <img
        src={card.image}
        alt={card.title}
        className="heritage-card__img"
        loading="lazy"
        decoding="async"
      />
      <div className="heritage-card__overlay">
        <span className="heritage-card__subtitle">{card.subtitle}</span>
        <h3 className="heritage-card__title">{card.title}</h3>
        <p className="heritage-card__desc">{card.description}</p>
        <div className="heritage-card__btn" aria-hidden="true">
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5h9.5M6.5 1.5L10.5 5l-4 3.5" stroke="#C99A32" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
export default function HeritageSpecialities() {
  return (
    <section id="heritage" aria-label="Heritage Specialities">
      <style>{`
        /* ── Section ───────────────────────────────────────────────── */
        #heritage {
          background: #F6EFE3;
          padding: clamp(48px, 7vw, 88px) clamp(16px, 4vw, 48px) clamp(56px, 8vw, 100px);
          overflow-x: hidden;
        }

        /* ── Heading block ─────────────────────────────────────────── */
        #heritage .hs-heading {
          text-align: center;
          margin-bottom: clamp(28px, 4vw, 52px);
          max-width: 680px;
          margin-inline: auto;
          margin-bottom: clamp(28px, 4vw, 52px);
        }
        #heritage .hs-h2 {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(26px, 4.5vw, 54px);
          font-weight: 600;
          line-height: 1.15;
          color: #55000A;
          margin: 0 0 14px;
          letter-spacing: -0.01em;
        }
        #heritage .hs-h2 em {
          font-style: italic;
          color: #C99A32;
        }
        #heritage .hs-hdivider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        #heritage .hs-hbar {
          width: clamp(32px, 4vw, 52px);
          height: 1px;
          background: #C99A32;
          opacity: 0.65;
        }
        #heritage .hs-hsub {
          font-family: Inter, sans-serif;
          font-size: clamp(12px, 1.4vw, 15px);
          color: #74645B;
          line-height: 1.68;
          margin: 0;
        }

        /* ── Grid ──────────────────────────────────────────────────── */
        #heritage .hs-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          max-width: 1050px;
          margin: 0 auto;
        }

        /* ── Card shell ────────────────────────────────────────────── */
        /* aspect-ratio matches PNG natural size (971×1619) exactly   */
        /* so object-fit:contain fills the card with zero letterboxing */
        .heritage-card {
          position: relative;
          display: block;
          background: #F6EFE3;
          aspect-ratio: 971 / 1350;
          transition: transform 250ms ease, box-shadow 250ms ease;
          cursor: pointer;
          outline: none;
          border-radius: 0 0 16px 16px;
          overflow: hidden;
          isolation: isolate;
        }
        .heritage-card:hover {
          transform: translateY(-6px) scale(1.015);
          box-shadow: 0 16px 24px rgba(85,0,10, 0.22);
        }
        .heritage-card:focus-visible {
          outline: 3px solid #C99A32;
          outline-offset: 4px;
        }
        @media (hover: none) {
          .heritage-card:hover {
            transform: none;
            box-shadow: none;
          }
        }
        .heritage-card__img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center top;
          filter: brightness(1.05);
          transition: transform 350ms ease;
          transform-origin: center 30%;
        }
        .heritage-card:hover .heritage-card__img {
          transform: scale(1.04);
        }

        /* ── Text overlay ──────────────────────────────────────────────
           PNG structure (1024×1536):
             0–62%  : arch food photo
             62–65% : baked-in gold divider ornament
             65–93% : maroon text panel
             93–100%: bottom gold border frame
           Overlay starts at 63% so it sits inside the maroon panel
           with just enough top breathing room. bottom:3% stays
           above the gold border. card overflow:hidden clips safely. */
        .heritage-card__overlay {
          position: absolute;
          left: 7%;
          right: 7%;
          top: 75%;
          bottom: 2%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 8px 10px 6px;
          overflow: hidden;
        }
        .heritage-card__subtitle {
          font-family: Inter, sans-serif;
          font-size: clamp(5px, 0.44vw, 7px);
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #C99A32;
          line-height: 1.2;
          flex-shrink: 0;
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .heritage-card__title {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(10px, 0.95vw, 14px);
          font-weight: 700;
          color: #FFF8EC;
          line-height: 1.1;
          letter-spacing: 0.03em;
          margin: 0 0 4px;
          flex-shrink: 0;
          word-break: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
        .heritage-card__desc {
          font-family: Inter, sans-serif;
          font-size: clamp(8px, 0.65vw, 9.5px);
          color: #E9D8C8;
          line-height: 1.35;
          margin: 0 auto;
          max-width: 92%;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          flex-shrink: 1;
        }
        .heritage-card__btn {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1.5px solid rgba(201,154,50,0.55);
          background: rgba(201,154,50,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          cursor: pointer;
          transition: border-color 220ms ease, background 220ms ease, transform 220ms ease;
          padding: 0;
          margin-top: 4px;
        }
        .heritage-card:hover .heritage-card__btn {
          border-color: rgba(201,154,50,0.95);
          background: rgba(201,154,50,0.18);
          transform: translateX(3px);
        }

        /* ── Tablet: 768px – 1099px ────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1099px) {
          #heritage .hs-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            max-width: 720px;
            gap: 20px;
          }
          .heritage-card__subtitle { font-size: clamp(5.5px, 0.7vw, 7.5px); letter-spacing: 0.10em; }
          .heritage-card__title    { font-size: clamp(11px, 1.4vw, 14px); }
          .heritage-card__desc     { font-size: clamp(8.5px, 0.85vw, 10px); -webkit-line-clamp: 2; }
        }

        /* ── Mobile: below 768px — 2 cards per row ──────────────────── */
        @media (max-width: 767px) {
          #heritage {
            padding: 32px 0 44px;
          }
          #heritage .hs-heading {
            padding: 0 16px;
          }
          #heritage .hs-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            padding-inline: 10px;
            max-width: 100%;
          }
          .heritage-card__overlay {
            left: 5%;
            right: 5%;
            top: 75%;
            bottom: 2%;
            padding: 6px 8px 5px;
          }
          .heritage-card__subtitle {
            font-size: clamp(4.5px, 1.1vw, 6.5px);
            letter-spacing: 0.09em;
            margin-bottom: 2px;
          }
          .heritage-card__title {
            font-size: clamp(9px, 2.2vw, 12px);
            margin-bottom: 2px;
            line-height: 1.08;
          }
          .heritage-card__desc {
            font-size: clamp(7px, 1.6vw, 9px);
            line-height: 1.3;
            -webkit-line-clamp: 2;
          }
          .heritage-card__btn {
            width: 20px;
            height: 20px;
            margin-top: 3px;
          }
          .heritage-card__btn svg {
            width: 9px;
            height: 7px;
          }
        }

        /* ── Very small screens: below 370px ────────────────────────── */
        @media (max-width: 369px) {
          .heritage-card__subtitle { font-size: 5.5px; letter-spacing: 0.09em; }
          .heritage-card__title    { font-size: 11px; }
          .heritage-card__desc     { font-size: 8px; }
          .heritage-card__btn      { width: 22px; height: 22px; }
        }
      `}</style>

      {/* Heading */}
      <div className="hs-heading">
        <h2 className="hs-h2">
          OUR HERITAGE <em>SPECIALITIES</em>
        </h2>
        <div className="hs-hdivider">
          <div className="hs-hbar" />
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M5 0.5 L9.5 5 L5 9.5 L0.5 5 Z" stroke="#C99A32" strokeWidth="0.9" fill="rgba(184,137,59,0.20)" />
            <circle cx="5" cy="5" r="1.7" fill="#C99A32" />
          </svg>
          <div className="hs-hbar" />
        </div>
        <p className="hs-hsub">
          Journey through the sacred culinary rituals of Banaras. An exploration of traditional morning delights, street-poetry chaats, and ceremonial feasts.
        </p>
      </div>

      {/* Cards */}
      <div className="hs-grid">
        {CARDS.map((card, i) => (
          <Card key={card.title} card={card} idx={i} />
        ))}
      </div>

    </section>
  );
}
