import { useState } from 'react';
import { REVIEWS, type Review } from '../../data/reviews';

// ── Star Rating ───────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <span className="gr-stars" aria-label={`${rating} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2l2.9 6 6.6.9-4.8 4.7 1.1 6.6L12 17.2l-5.8 3 1.1-6.6L2.5 8.9l6.6-.9z"
            fill={i <= rating ? '#F4B400' : '#DDD5C8'}
          />
        </svg>
      ))}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initial = name.trim()[0]?.toUpperCase() ?? 'G';
  return (
    <div className="gr-avatar" aria-hidden="true">
      <span className="gr-avatar-initial">{initial}</span>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

const CLAMP_LINES = 5;

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);

  // Estimate if text needs clamping (~70 chars per line × 5 lines)
  const isLong = review.text.length > 320;

  return (
    <article className="gr-card" aria-label={`Review by ${review.name}`}>
      {/* Top accent */}
      <div className="gr-card-topbar" aria-hidden="true" />

      {/* Author row */}
      <div className="gr-card-header">
        <Avatar name={review.name} />
        <div className="gr-card-meta">
          <span className="gr-author">{review.name}</span>
          {review.date && <span className="gr-date">{review.date}</span>}
        </div>
        {review.source && (
          <span className="gr-source">{review.source}</span>
        )}
      </div>

      {/* Stars */}
      <div className="gr-card-stars">
        <Stars rating={review.rating} />
      </div>

      {/* Review text */}
      <p
        className="gr-text"
        style={isLong && !expanded ? {
          display: '-webkit-box',
          WebkitLineClamp: CLAMP_LINES,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } : undefined}
      >
        {review.text}
      </p>

      {isLong && (
        <button
          className="gr-expand-btn"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </article>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

export default function GuestReviews() {
  return (
    <section id="reviews" aria-label="Guest Reviews">
      <style>{`
        /* ── Section ───────────────────────────────────────────────── */
        #reviews {
          background: linear-gradient(180deg, #F8F1E7 0%, #F3E9DA 100%);
          padding: clamp(64px, 8vw, 100px) clamp(16px, 4vw, 48px);
          overflow-x: hidden;
        }
        #reviews .gr-inner {
          max-width: 1180px;
          margin-inline: auto;
        }

        /* ── Header ───────────────────────────────────────────────── */
        #reviews .gr-header {
          text-align: center;
          margin-bottom: clamp(36px, 5vw, 56px);
        }
        #reviews .gr-eyebrow-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-bottom: 14px;
        }
        #reviews .gr-eyebrow {
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #B77F22;
        }
        #reviews .gr-h2 {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(34px, 4vw, 54px);
          font-weight: 650;
          color: #3A211D;
          letter-spacing: -0.02em;
          line-height: 1.05;
          margin: 0 0 14px;
        }
        #reviews .gr-h2 em { color: #55000A; font-style: italic; font-weight: 600; }
        #reviews .gr-divider {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 14px;
        }
        #reviews .gr-dbar {
          width: clamp(28px, 3vw, 46px); height: 1px;
          background: rgba(200,154,61,0.55);
        }
        #reviews .gr-sub {
          font-family: Inter, sans-serif;
          font-size: clamp(14px, 1.1vw, 16px);
          font-weight: 500;
          color: #5E4940;
          line-height: 1.65;
          margin: 0 auto;
          max-width: 520px;
        }

        /* ── Grid ─────────────────────────────────────────────────── */
        #reviews .gr-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          align-items: stretch;
        }

        /* ── Card ─────────────────────────────────────────────────── */
        .gr-card {
          position: relative;
          background: #FFFDF8;
          border: 1px solid rgba(200,154,61,0.28);
          border-radius: 20px;
          padding: 24px 22px 20px;
          box-shadow: 0 8px 28px rgba(85,0,10,0.06);
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: hidden;
          height: 100%;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        @media (hover: hover) {
          .gr-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 40px rgba(85,0,10,0.10);
          }
        }
        .gr-card-topbar {
          position: absolute;
          top: 0; left: 14%; right: 14%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #C99A32, transparent);
          border-radius: 0 0 2px 2px;
        }

        /* ── Card header ──────────────────────────────────────────── */
        .gr-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .gr-avatar {
          flex-shrink: 0;
          width: 38px; height: 38px;
          border-radius: 50%;
          background: #55000A;
          display: flex; align-items: center; justify-content: center;
        }
        .gr-avatar-initial {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 17px;
          font-weight: 700;
          color: #FFF8EC;
          line-height: 1;
        }
        .gr-card-meta {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .gr-author {
          font-family: Inter, sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #2B1D1A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gr-date {
          font-family: Inter, sans-serif;
          font-size: 11px;
          color: #9A8078;
        }
        .gr-source {
          font-family: Inter, sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #C99A32;
          background: rgba(201,154,50,0.08);
          border: 1px solid rgba(201,154,50,0.28);
          border-radius: 999px;
          padding: 2px 8px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ── Stars ────────────────────────────────────────────────── */
        .gr-card-stars { display: flex; align-items: center; }
        .gr-stars { display: inline-flex; gap: 2px; }

        /* ── Review text ──────────────────────────────────────────── */
        .gr-text {
          font-family: Inter, sans-serif;
          font-size: 14px;
          line-height: 1.65;
          color: #4A3830;
          margin: 0;
          flex: 1;
        }
        .gr-expand-btn {
          background: none;
          border: none;
          padding: 0;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #55000A;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
          letter-spacing: 0.02em;
          min-height: 44px;
          display: flex;
          align-items: center;
          align-self: flex-start;
        }
        .gr-expand-btn:focus-visible {
          outline: 2px solid #C99A32;
          outline-offset: 3px;
          border-radius: 3px;
        }

        /* ── Google rating badge ──────────────────────────────────── */
        #reviews .gr-rating-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
          padding: 10px 20px;
          background: #FFFDF8;
          border: 1px solid rgba(201,154,50,0.28);
          border-radius: 999px;
          box-shadow: 0 2px 12px rgba(85,0,10,0.06);
          text-decoration: none;
          cursor: pointer;
          transition: box-shadow 0.18s, transform 0.18s;
        }
        #reviews a.gr-rating-badge:hover {
          box-shadow: 0 4px 18px rgba(85,0,10,0.12);
          transform: translateY(-1px);
        }
        #reviews .gr-google-icon { flex-shrink: 0; }
        #reviews .gr-rating-num {
          font-family: Inter, sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #2B1D1A;
          line-height: 1;
          letter-spacing: -0.01em;
        }
        #reviews .gr-rating-stars {
          display: inline-flex;
          gap: 1px;
          align-items: center;
        }
        #reviews .gr-rating-label {
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #8A7060;
          text-transform: uppercase;
          border-left: 1px solid rgba(201,154,50,0.30);
          padding-left: 10px;
        }

        /* ── Tablet 768–1099px ────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1099px) {
          #reviews .gr-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        /* ── Mobile < 768px ───────────────────────────────────────── */
        @media (max-width: 767px) {
          #reviews {
            padding: clamp(48px, 8vw, 72px) 18px;
          }
          #reviews .gr-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .gr-card { padding: 20px 18px 16px; }
        }
      `}</style>

      <div className="gr-inner">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="gr-header">
          <div className="gr-eyebrow-row">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              {[0,60,120,180,240,300].map(deg => (
                <ellipse key={deg} cx="6" cy="6" rx="1.5" ry="3" fill="rgba(183,127,34,0.60)" transform={`rotate(${deg} 6 6)`} />
              ))}
              <circle cx="6" cy="6" r="1.7" fill="#B77F22" />
            </svg>
            <span className="gr-eyebrow">Guest Reviews</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              {[0,60,120,180,240,300].map(deg => (
                <ellipse key={deg} cx="6" cy="6" rx="1.5" ry="3" fill="rgba(183,127,34,0.60)" transform={`rotate(${deg} 6 6)`} />
              ))}
              <circle cx="6" cy="6" r="1.7" fill="#B77F22" />
            </svg>
          </div>

          <h2 className="gr-h2">
            Loved by Our <em>Guests</em>
          </h2>

          <div className="gr-divider">
            <div className="gr-dbar" />
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M5 0.5L9.5 5L5 9.5L0.5 5Z" stroke="#C99A32" strokeWidth="0.9" fill="rgba(201,154,50,0.22)"/>
              <circle cx="5" cy="5" r="1.7" fill="#C99A32"/>
            </svg>
            <div className="gr-dbar" />
          </div>

          <p className="gr-sub">
            Real words from people who have experienced MishtiChaat.
          </p>

          {/* ── Google rating badge ──────────────────────────────── */}
          <a
            className="gr-rating-badge"
            href="https://www.google.com/search?q=MishtiChaat+Sarjapur+Road+Bengaluru"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Rated 4.6 out of 5 on Google — view reviews"
          >
            {/* Google G icon */}
            <svg className="gr-google-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <div className="gr-rating-num" aria-hidden="true">4.6</div>
            <div className="gr-rating-stars" aria-hidden="true">
              {[1,2,3,4].map(i => (
                <svg key={i} width="15" height="15" viewBox="0 0 24 24">
                  <path d="M12 2l2.9 6 6.6.9-4.8 4.7 1.1 6.6L12 17.2l-5.8 3 1.1-6.6L2.5 8.9l6.6-.9z" fill="#F4B400"/>
                </svg>
              ))}
              {/* Partial 5th star at ~60% */}
              <svg width="15" height="15" viewBox="0 0 24 24">
                <defs>
                  <linearGradient id="gr-partial">
                    <stop offset="60%" stopColor="#F4B400"/>
                    <stop offset="60%" stopColor="#DDD5C8"/>
                  </linearGradient>
                </defs>
                <path d="M12 2l2.9 6 6.6.9-4.8 4.7 1.1 6.6L12 17.2l-5.8 3 1.1-6.6L2.5 8.9l6.6-.9z" fill="url(#gr-partial)"/>
              </svg>
            </div>
            <div className="gr-rating-label">on Google</div>
          </a>
        </div>

        {/* ── Review cards ────────────────────────────────────────── */}
        <div className="gr-grid" role="list">
          {REVIEWS.map(review => (
            <div key={review.id} role="listitem">
              <ReviewCard review={review} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
