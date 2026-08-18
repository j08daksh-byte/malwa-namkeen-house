import { useState } from 'react';

const TAGS = ['100% Satvik', 'Pure Desi Ghee', 'Since 1978', 'Heritage Recipes'];

export default function LegacyStory() {
  const [hov, setHov] = useState(false);

  return (
    <section id="story">
      <style>{`
        #story {
          background: #F6EFE3;
          padding: 72px 24px 76px;
          overflow: hidden;
        }
        #story .ls-wrap {
          max-width: 1180px;
          margin-inline: auto;
        }
        #story .ls-grid {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 48px;
          align-items: center;
        }

        /* ── Left text ────────────────────────────────────────────── */
        #story .ls-text { max-width: 540px; }

        #story .ls-eyebrow {
          display: flex;
          align-items: center;
          margin-bottom: 22px;
        }
        #story .ls-eyebrow-text {
          font-family: Inter, sans-serif;
          font-size: 13px; font-weight: 800;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: #C99A32;
          line-height: 1;
        }

        #story .ls-h2 {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(36px, 4.4vw, 58px);
          font-weight: 700;
          color: #2B211D;
          line-height: 1.06;
          letter-spacing: -0.02em;
          margin: 0 0 24px;
        }
        #story .ls-h2 em {
          display: block;
          font-style: italic;
          color: #55000A;
          font-weight: 600;
        }

        #story .ls-body {
          font-family: Inter, sans-serif;
          font-size: 15px;
          color: #4A3830;
          line-height: 1.76;
          margin-bottom: 18px;
        }
        #story .ls-body-muted {
          font-family: Inter, sans-serif;
          font-size: 15px;
          color: #75645C;
          line-height: 1.76;
          margin-bottom: 0;
        }

        /* Pill tags */
        #story .ls-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 24px;
          margin-bottom: 28px;
        }
        #story .ls-tag {
          font-family: Inter, sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.09em;
          color: #55000A;
          background: rgba(85,0,10,0.07);
          border: 1px solid rgba(85,0,10,0.22);
          padding: 7px 16px;
          border-radius: 999px;
          white-space: nowrap;
        }

        /* CTA button — pill */
        #story .ls-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: Inter, sans-serif;
          font-size: 11px; font-weight: 800;
          letter-spacing: 0.12em; text-transform: uppercase;
          text-decoration: none;
          height: 50px;
          padding: 0 28px;
          border-radius: 999px;
          border: 1.5px solid #55000A;
          transition: background 0.22s, color 0.22s, transform 0.22s, box-shadow 0.22s;
        }
        #story .ls-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 26px rgba(85,0,10,0.16);
        }

        /* ── Right postcard ───────────────────────────────────────── */
        #story .ls-card-wrap {
          position: relative;
          display: flex;
          justify-content: center;
          width: 100%;
          max-width: 660px;
          margin-left: auto;
        }
        #story .ls-postcard {
          position: relative;
          box-shadow: 8px 12px 48px rgba(85,0,10,0.18), 0 2px 8px rgba(85,0,10,0.08);
          border-radius: 6px;
          width: 100%;
        }
        #story .ls-postcard-border {
          border: 8px solid #FFF9EF;
          border-bottom: 44px solid #FFF9EF;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }
        #story .ls-postcard-img {
          width: 100%;
          aspect-ratio: 0.85 / 1;
          object-fit: cover;
          object-position: center 60%;
          display: block;
        }
        #story .ls-postcard-inset {
          position: absolute;
          inset: 10px;
          border: 1px solid rgba(200,154,61,0.32);
          pointer-events: none;
        }
        #story .ls-postcard-caption {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 44px;
          display: flex;
          align-items: center;
          padding: 0 14px;
          gap: 8px;
        }
        #story .ls-postcard-caption-text {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 13px;
          font-style: italic;
          color: #74645B;
        }
        /* Since badge */
        #story .ls-since {
          position: absolute;
          bottom: 60px; left: -14px;
          background: #55000A;
          color: #FFF9EF;
          font-family: Inter, sans-serif;
          font-size: 8px; font-weight: 800;
          letter-spacing: 0.18em; text-transform: uppercase;
          padding: 7px 14px;
          border-radius: 999px;
          transform: rotate(-2deg);
          box-shadow: 2px 4px 14px rgba(35,0,5,0.32);
        }

        /* Corner flourish */
        #story .ls-flourish {
          position: absolute;
          bottom: -22px; left: -26px;
          opacity: 0.13;
          pointer-events: none;
        }

        /* ── Tablet 768–1024px ───────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          #story { padding: 60px 24px 64px; }
          #story .ls-grid {
            grid-template-columns: 1fr 1fr;
            gap: 36px;
          }
          #story .ls-h2   { font-size: clamp(30px, 5vw, 46px); }
          #story .ls-card-wrap { max-width: none; margin-left: 0; }
        }

        /* ── Mobile < 768px ──────────────────────────────────────── */
        @media (max-width: 767px) {
          #story { padding: 52px 18px 56px; }
          #story .ls-grid {
            grid-template-columns: 1fr;
            gap: 34px;
          }
          #story .ls-text { max-width: 100%; }
          #story .ls-card-wrap { max-width: none; width: 100%; margin-left: 0; }
          #story .ls-eyebrow-text { font-size: 12px; }
          #story .ls-h2   { font-size: clamp(32px, 9vw, 46px); }
          #story .ls-postcard { max-width: none; width: 100%; }
          #story .ls-postcard-border {
            padding: 8px;
            border: none;
            border-radius: 16px;
            overflow: visible;
            height: auto;
          }
          #story .ls-postcard-img {
            width: 100%;
            height: auto;
            aspect-ratio: auto;
            object-fit: contain;
            object-position: center;
            display: block;
          }
          #story .ls-since { left: -6px; bottom: 50px; }
          #story .ls-cta { width: 100%; justify-content: center; }
        }

        @media (max-width: 359px) {
          #story .ls-h2 { font-size: 29px; }
        }
      `}</style>

      <div className="ls-wrap">
        <div className="ls-grid">

          {/* ── Left: text ──────────────────────────────────────── */}
          <div className="ls-text">

            <div className="ls-eyebrow">
              <span className="ls-eyebrow-text">Our Story</span>
            </div>

            <h2 className="ls-h2">
              From the Ghats of Banaras
              <em>to the Streets of Bengaluru</em>
            </h2>

            <p className="ls-body" style={{ marginTop: '20px' }}>
              Born in the lanes of Banaras and inspired by its vibrant chaat culture, MishtiChaat brings traditional recipes, handcrafted sweets and the warmth of Indian hospitality to Bengaluru.
            </p>
            <p className="ls-body-muted">
              Every recipe carries the care of home-style preparation, pure ingredients, slow-crafted spices and generations of culinary memory.
            </p>

            <div className="ls-tags">
              {TAGS.map(tag => (
                <span key={tag} className="ls-tag">{tag}</span>
              ))}
            </div>

            <a
              href="#contact"
              className="ls-cta"
              onClick={e => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }); }}
              onMouseEnter={() => setHov(true)}
              onMouseLeave={() => setHov(false)}
              style={{
                color:           hov ? '#FFF9EF' : '#55000A',
                backgroundColor: hov ? '#55000A' : 'transparent',
              }}
            >
              Know Our Story
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>

          </div>

          {/* ── Right: postcard ──────────────────────────────────── */}
          <div className="ls-card-wrap">

            <div className="ls-postcard">
              <div className="ls-postcard-border">
                <img
                  src="/mishtichaat/banaras-ghat.jpg"
                  alt="Historic ghats of Banaras along the River Ganges"
                  className="ls-postcard-img"
                  loading="lazy"
                  decoding="async"
                  onError={e => {
                    const el = e.currentTarget as HTMLImageElement;
                    el.style.background = '#E9DED0';
                    el.style.minHeight = '280px';
                  }}
                />
                <div className="ls-postcard-inset" aria-hidden="true" />
              </div>
              <div className="ls-postcard-caption">
                <span className="ls-postcard-caption-text">The Ghats of Banaras</span>
              </div>
            </div>

            {/* Since badge */}
            <div className="ls-since" aria-hidden="true">Since 1978</div>

            {/* Corner flourish */}
            <svg className="ls-flourish" width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
              <path d="M4 4 Q40 4 40 40 Q40 76 76 76" stroke="#55000A" strokeWidth="1.5" fill="none"/>
              <path d="M12 4 Q40 4 40 40 Q40 68 76 68" stroke="#55000A" strokeWidth="0.8" fill="none"/>
              <circle cx="4" cy="4" r="3" fill="#C99A32"/>
              <circle cx="76" cy="76" r="3" fill="#C99A32"/>
            </svg>

          </div>
        </div>
      </div>
    </section>
  );
}
