import { Fragment } from 'react';
import { BUSINESS } from '../../lib/business';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocationBlock {
  id:      string;
  name:    string;
  area:    string;
  status:  'open' | 'coming_soon';
  detail:  string;
  mapUrl:  string | null;
}

// ── Location data ─────────────────────────────────────────────────────────────

const LOCATIONS: LocationBlock[] = [
  {
    id:     'sarjapur',
    name:   'Sarjapur Road',
    area:   'Bengaluru',
    status: 'open',
    detail: 'No. 87/4-B, Sulikunte Village',
    mapUrl: BUSINESS.mapsUrl,
  },
  {
    id:     'location-2',
    name:   'Location 2',
    area:   'Bengaluru',
    status: 'open',
    detail: 'Address to be updated',
    mapUrl: null,
  },
  {
    id:     'coming-soon',
    name:   'Coming Soon',
    area:   'Bengaluru',
    status: 'coming_soon',
    detail: 'Stay tuned for details',
    mapUrl: null,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Location() {
  return (
    <section id="locations" aria-label="Our Locations" style={{ scrollMarginTop: '68px' }}>
      <style>{`

        /* ═══════════════════════════════════════════════════
           LOCATION — Announcement / poster style
           Prefix: lc-
        ═══════════════════════════════════════════════════ */

        #locations {
          background: #FAF4E8;
          border-top:    1px solid rgba(201,154,50,0.28);
          border-bottom: 1px solid rgba(201,154,50,0.28);
          padding: clamp(40px, 5vw, 64px) clamp(20px, 5vw, 60px);
          text-align: center;
          overflow: hidden;
        }

        /* ── Header ──────────────────────────────────────── */
        #locations .lc-header {
          margin-bottom: clamp(28px, 4vw, 44px);
        }
        #locations .lc-eyebrow {
          display: block;
          font-family: Inter, sans-serif;
          font-size: 10.5px; font-weight: 800;
          letter-spacing: 0.34em; text-transform: uppercase;
          color: #C99A32;
          margin-bottom: 10px;
        }
        #locations .lc-h2 {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(30px, 3.6vw, 48px);
          font-weight: 700; line-height: 1.08;
          color: #2A1A16;
          margin: 0 0 10px;
          letter-spacing: -0.015em;
        }
        #locations .lc-sub {
          font-family: Inter, sans-serif;
          font-size: clamp(13px, 1vw, 15px);
          color: #8A7060; line-height: 1.6;
          margin: 0; max-width: 480px;
          margin-inline: auto;
        }

        /* ── Divider rule below header ───────────────────── */
        #locations .lc-rule {
          width: 56px; height: 2px;
          background: linear-gradient(90deg, transparent, #C99A32, transparent);
          border-radius: 2px;
          margin: 0 auto clamp(28px, 4vw, 44px);
        }

        /* ── Location row ────────────────────────────────── */
        #locations .lc-row {
          display: flex;
          align-items: stretch;
          justify-content: center;
          max-width: 960px;
          margin-inline: auto;
        }

        /* ── Vertical divider ────────────────────────────── */
        #locations .lc-divider {
          flex: 0 0 1px;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(201,154,50,0.45) 20%,
            rgba(201,154,50,0.45) 80%,
            transparent 100%
          );
          margin: 0 clamp(20px, 3vw, 48px);
          align-self: stretch;
          min-height: 160px;
        }

        /* ── Location block ──────────────────────────────── */
        #locations .lc-block {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
        }

        /* Status badge */
        #locations .lc-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: Inter, sans-serif;
          font-size: 9.5px; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid;
          margin-bottom: 6px;
        }
        #locations .lc-badge--open {
          color: #2E7D32;
          border-color: rgba(46,125,50,0.32);
          background: rgba(46,125,50,0.07);
        }
        #locations .lc-badge--open::before {
          content: '';
          display: inline-block;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #2E7D32;
        }
        #locations .lc-badge--soon {
          color: #8A7060;
          border-color: rgba(138,112,96,0.30);
          background: rgba(138,112,96,0.07);
        }

        /* Location name — the big serif */
        #locations .lc-name {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(22px, 2.8vw, 34px);
          font-weight: 700;
          color: #55000A;
          line-height: 1.05;
          letter-spacing: -0.01em;
          margin: 0;
        }
        #locations .lc-block--soon .lc-name {
          color: #9A8078;
        }

        /* Area name */
        #locations .lc-area {
          font-family: Inter, sans-serif;
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: #B09989;
          margin: 2px 0 0;
        }

        /* Detail line */
        #locations .lc-detail {
          font-family: Inter, sans-serif;
          font-size: 11.5px; color: #9A8078;
          line-height: 1.5; margin: 4px 0 0;
          max-width: 180px;
        }

        /* CTA button */
        #locations .lc-cta {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 12px;
          font-family: Inter, sans-serif;
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.14em; text-transform: uppercase;
          text-decoration: none;
          height: 34px; padding: 0 18px;
          border-radius: 999px;
          border: 1.5px solid #C99A32;
          color: #55000A;
          background: transparent;
          cursor: pointer;
          transition: background 0.18s, color 0.18s, border-color 0.18s;
        }
        #locations .lc-cta:hover {
          background: #55000A;
          border-color: #55000A;
          color: #FFF8EC;
        }
        #locations .lc-cta:focus-visible {
          outline: 2px solid #C99A32;
          outline-offset: 3px;
        }
        #locations .lc-cta--disabled {
          opacity: 0.45;
          cursor: default;
          pointer-events: none;
        }

        /* ═══════════════════════════════════════════════════
           TABLET  600–1023px
        ═══════════════════════════════════════════════════ */
        @media (min-width: 600px) and (max-width: 1023px) {
          #locations .lc-row { max-width: 700px; }
          #locations .lc-divider { margin: 0 clamp(12px, 2.5vw, 28px); }
          #locations .lc-name { font-size: clamp(18px, 3vw, 24px); }
        }

        /* ═══════════════════════════════════════════════════
           MOBILE < 600px  →  vertical stack
        ═══════════════════════════════════════════════════ */
        @media (max-width: 599px) {
          #locations {
            padding: 40px 20px;
          }
          #locations .lc-row {
            flex-direction: column;
            align-items: center;
            gap: 0;
          }
          #locations .lc-divider {
            flex: none;
            width: 56px; height: 1px; min-height: unset;
            margin: 18px auto;
            background: linear-gradient(
              to right,
              transparent,
              rgba(201,154,50,0.45),
              transparent
            );
          }
          #locations .lc-block {
            width: 100%; max-width: 280px;
          }
          #locations .lc-name { font-size: clamp(24px, 7vw, 30px); }
          #locations .lc-detail { max-width: 240px; }
        }

        /* ── Reduced motion ───────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          #locations .lc-cta { transition: none; }
        }

      `}</style>

      {/* ── Header ── */}
      <header className="lc-header">
        <span className="lc-eyebrow">Visit Us</span>
        <h2 className="lc-h2">Our Bengaluru Locations</h2>
        <p className="lc-sub">
          Bringing the warmth of Banaras to Bengaluru — one neighbourhood at a time.
        </p>
      </header>

      <div className="lc-rule" aria-hidden="true" />

      {/* ── 3-location row ── */}
      <div className="lc-row">

        {LOCATIONS.map((loc, idx) => (
          <Fragment key={loc.id}>
            {idx > 0 && (
              <div className="lc-divider" aria-hidden="true" />
            )}

            <div
              className={`lc-block${loc.status === 'coming_soon' ? ' lc-block--soon' : ''}`}
            >
              {/* Status badge */}
              <span
                className={`lc-badge ${loc.status === 'open' ? 'lc-badge--open' : 'lc-badge--soon'}`}
                aria-label={loc.status === 'open' ? 'Open now' : 'Coming soon'}
              >
                {loc.status === 'open' ? 'Open Now' : 'Coming Soon'}
              </span>

              {/* Name */}
              <h3 className="lc-name">{loc.name}</h3>

              {/* Area */}
              <p className="lc-area">{loc.area}</p>

              {/* Detail */}
              <p className="lc-detail">{loc.detail}</p>

              {/* CTA */}
              {loc.status !== 'coming_soon' && (
                loc.mapUrl ? (
                  <a
                    href={loc.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lc-cta"
                    aria-label={`Get directions to ${loc.name}`}
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M6 1C4.07 1 2.5 2.57 2.5 4.5 2.5 7.25 6 11 6 11s3.5-3.75 3.5-6.5C9.5 2.57 7.93 1 6 1z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                      <circle cx="6" cy="4.5" r="1.2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    </svg>
                    Get Directions
                  </a>
                ) : (
                  <span className="lc-cta lc-cta--disabled" aria-disabled="true">
                    Map Coming Soon
                  </span>
                )
              )}
            </div>
          </Fragment>
        ))}

      </div>

    </section>
  );
}
