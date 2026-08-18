import { BUSINESS } from '../../lib/business';
import type { MouseEvent } from 'react';

function scrollToMenu(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' });
}

export default function Hero({ onReserve: _onReserve }: { onReserve?: () => void }) {
  return (
    <section id="hero" className="hero-editorial">
      <style>{`
        .hero-editorial {
          --nav-h: 68px;
          width: 100%;
          min-height: calc(100svh - var(--nav-h));
          background: #EAD5C2;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .hero-editorial__inner {
          width: min(100%, 1240px);
          margin: 0 auto;
          padding: clamp(52px, 7vw, 96px) clamp(20px, 4vw, 48px) clamp(40px, 5vw, 72px);
          display: grid;
          grid-template-columns: minmax(280px, 0.9fr) minmax(440px, 1.35fr);
          gap: clamp(44px, 7vw, 112px);
          align-items: center;
        }

        .hero-editorial__copy { max-width: 480px; }
        .hero-editorial__eyebrow {
          display: block;
          margin-bottom: 19px;
          color: #C99A32;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          line-height: 1.2;
        }
        .hero-editorial__title {
          margin: 0;
          color: #55000A;
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(48px, 5.2vw, 78px);
          font-weight: 600;
          letter-spacing: -0.035em;
          line-height: 0.92;
        }
        .hero-editorial__description {
          max-width: 415px;
          margin: 25px 0 0;
          color: #5E4940;
          font-family: Inter, sans-serif;
          font-size: clamp(13px, 1.15vw, 16px);
          font-weight: 500;
          line-height: 1.65;
        }
        .hero-editorial__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 29px;
        }
        .hero-editorial__button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 47px;
          padding: 0 23px;
          border-radius: 999px;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-decoration: none;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
        .hero-editorial__button:hover { transform: translateY(-2px); }
        .hero-editorial__button--primary {
          border: 1px solid #55000A;
          background: #55000A;
          color: #FFF8EC;
          box-shadow: 0 10px 24px rgba(85, 0, 10, 0.18);
        }
        .hero-editorial__button--primary:hover { background: #6B000D; border-color: #6B000D; }
        .hero-editorial__button--secondary {
          border: 1px solid rgba(85, 0, 10, 0.44);
          background: transparent;
          color: #55000A;
        }
        .hero-editorial__button--secondary:hover { background: rgba(85, 0, 10, 0.06); }

        .hero-editorial__image-wrap {
          width: 100%;
          aspect-ratio: 1.34 / 1;
          overflow: hidden;
          border-radius: 22px;
          background: #D8BFA8;
          box-shadow: 0 22px 44px rgba(85, 0, 10, 0.18);
          transition: box-shadow 0.45s ease;
        }
        .hero-editorial__image-wrap:hover { box-shadow: 0 30px 58px rgba(85, 0, 10, 0.28); }
        .hero-editorial__image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
          transition: transform 0.45s ease;
        }
        .hero-editorial__image-wrap:hover .hero-editorial__image { transform: scale(1.045); }

        @media (max-width: 767px) {
          .hero-editorial { display: block; }
          .hero-editorial__inner {
            min-height: calc(100svh - var(--nav-h));
            grid-template-columns: 1fr;
            gap: 34px;
            padding: 100px 20px 42px;
          }
          .hero-editorial__copy { max-width: 530px; }
          .hero-editorial__eyebrow { margin-bottom: 15px; font-size: 10px; }
          .hero-editorial__title { font-size: clamp(46px, 13vw, 64px); }
          .hero-editorial__description { margin-top: 19px; font-size: 13px; }
          .hero-editorial__actions { margin-top: 24px; }
          .hero-editorial__image-wrap { border-radius: 17px; aspect-ratio: 1.28 / 1; }
        }

        @media (hover: none) {
          .hero-editorial__image-wrap:hover .hero-editorial__image { transform: none; }
        }

        @media (max-width: 390px) {
          .hero-editorial__actions { display: grid; grid-template-columns: 1fr; }
          .hero-editorial__button { width: 100%; }
        }
      `}</style>

      <div className="hero-editorial__inner">
        <div className="hero-editorial__copy">
          <span className="hero-editorial__eyebrow">MALWA · UJJAIN · NAMKEEN</span>
          <h1 className="hero-editorial__title">Ujjain&apos;s crisp<br />tradition, since<br />generations</h1>
          <p className="hero-editorial__description">
            Small-batch sev, chivda and mixtures fried the Malwa way — clove-warm masalas, groundnut oil, and recipes our family has kept unchanged for decades.
          </p>
          <div className="hero-editorial__actions">
            <a className="hero-editorial__button hero-editorial__button--primary" href={`https://wa.me/${BUSINESS.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
              Order on WhatsApp
            </a>
            <a className="hero-editorial__button hero-editorial__button--secondary" href="#menu" onClick={scrollToMenu}>
              Browse bestsellers
            </a>
          </div>
        </div>

        <div className="hero-editorial__image-wrap">
          <img className="hero-editorial__image" src="/mishtichaat/chaat-plate.jpg" alt="Assorted chaat topped with sev" fetchPriority="high" />
        </div>
      </div>
    </section>
  );
}
