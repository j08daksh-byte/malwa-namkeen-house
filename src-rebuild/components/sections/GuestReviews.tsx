import { REVIEWS, type Review } from '../../data/reviews';

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="guest-review__stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} aria-hidden="true">
          {star <= rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="guest-review" aria-label={`Review by ${review.name}`}>
      <div className="guest-review__top">
        <div className="guest-review__person">
          <span className="guest-review__avatar" aria-hidden="true">
            {review.name.charAt(0)}
          </span>
          <div>
            <h3>{review.name}</h3>
            <p>{review.date ?? 'Google Review'}</p>
          </div>
        </div>
        <span className="guest-review__source">{review.source || 'Google Review'}</span>
      </div>

      <Stars rating={review.rating} />
      <p className="guest-review__text">{review.text}</p>
      <div className="guest-review__google">
        <GoogleMark />
      </div>
    </article>
  );
}

export default function GuestReviews() {
  // Quadruple the reviews array for a completely seamless, infinite continuous marquee loop
  const marqueeReviews = [...REVIEWS, ...REVIEWS, ...REVIEWS, ...REVIEWS];

  return (
    <section id="reviews" aria-label="Guest Reviews">
      <style>{`
        #reviews {
          background: #F6EFE3;
          padding: clamp(58px, 7vw, 88px) 0 clamp(64px, 7vw, 92px);
          overflow: hidden;
          position: relative;
        }

        #reviews .guest-reviews__head-wrap {
          width: min(100%, 1240px);
          margin: 0 auto;
          padding: 0 clamp(20px, 4vw, 48px);
        }

        #reviews .guest-reviews__head {
          margin-bottom: clamp(32px, 4vw, 46px);
        }

        #reviews .guest-reviews__eyebrow {
          display: block;
          margin-bottom: 10px;
          color: #C99A32;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.20em;
          line-height: 1.2;
          text-transform: uppercase;
        }

        #reviews .guest-reviews__head h2 {
          margin: 0;
          color: #55000A;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: clamp(34px, 4.4vw, 54px);
          font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1.04;
        }

        #reviews .guest-reviews__head p {
          margin: 10px 0 0;
          color: #75645C;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14.5px;
          font-weight: 400;
          line-height: 1.55;
        }

        /* ── Continuous Marquee Slider from Right to Left ──────────────── */
        .guest-reviews__marquee-container {
          position: relative;
          width: 100%;
          overflow: hidden;
          padding: 12px 0 20px;
          /* Smooth edge masks */
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 5%,
            black 95%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 5%,
            black 95%,
            transparent 100%
          );
        }

        .guest-reviews__track {
          display: flex;
          gap: 20px;
          width: max-content;
          will-change: transform;
          animation: marquee-slide-left 45s linear infinite;
        }

        /* Pause on hover so guests can read comfortably */
        .guest-reviews__marquee-container:hover .guest-reviews__track,
        .guest-reviews__marquee-container:focus-within .guest-reviews__track {
          animation-play-state: paused;
        }

        @keyframes marquee-slide-left {
          0% {
            transform: translateX(0);
          }
          100% {
            /* Since we duplicated the array 4 times, shifting 50% cleanly cycles 2 sets seamlessly */
            transform: translateX(-50%);
          }
        }

        /* ── Review Cards ────────────────────────────────────────── */
        .guest-review {
          position: relative;
          display: flex;
          flex-direction: column;
          width: clamp(300px, 28vw, 380px);
          min-height: 240px;
          flex-shrink: 0;
          padding: 22px 22px 18px;
          overflow: hidden;
          border: 1px solid rgba(85, 0, 10, 0.14);
          border-radius: 22px;
          background: #FFF9EF;
          box-shadow: 0 8px 24px rgba(85, 0, 10, 0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          user-select: none;
        }

        .guest-review:nth-child(3n + 1) { border-radius: 24px 24px 48px 24px; }
        .guest-review:nth-child(3n + 2) { border-radius: 48px 24px 24px 24px; }
        .guest-review:nth-child(3n + 3) { border-radius: 24px 48px 24px 24px; }

        @media (hover: hover) {
          .guest-review:hover {
            transform: translateY(-4px);
            border-color: rgba(201, 154, 50, 0.5);
            box-shadow: 0 16px 32px rgba(85, 0, 10, 0.12);
          }
        }

        .guest-review__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .guest-review__person {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 10px;
        }

        .guest-review__avatar {
          display: grid;
          width: 40px;
          height: 40px;
          flex: 0 0 auto;
          place-items: center;
          border-radius: 50%;
          background: #55000A;
          color: #FFF8EC;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 16px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(85, 0, 10, 0.25);
        }

        .guest-review__person h3 {
          margin: 0;
          color: #3A211D;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14px;
          font-weight: 700;
          line-height: 1.3;
        }

        .guest-review__person p {
          margin: 2px 0 0;
          color: #927F74;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11px;
        }

        .guest-review__source {
          flex: 0 0 auto;
          border: 1px solid rgba(201, 154, 50, 0.32);
          border-radius: 999px;
          background: rgba(201, 154, 50, 0.08);
          color: #A87320;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          line-height: 1;
          padding: 6px 9px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .guest-review__stars {
          display: flex;
          gap: 2px;
          margin-top: 14px;
          color: #C99A32;
          font-size: 16px;
          letter-spacing: 0;
          line-height: 1;
        }

        .guest-review__text {
          margin: 11px 0 0;
          color: #4A3830;
          font-family: Inter, sans-serif;
          font-size: 13.5px;
          line-height: 1.65;
        }

        .guest-review__google {
          display: flex;
          justify-content: flex-end;
          margin-top: auto;
          padding-top: 14px;
          opacity: 0.85;
        }

        /* ── Responsive rules ─────────────────────────────────────── */
        @media (max-width: 767px) {
          #reviews {
            padding: 44px 0 48px;
          }
          #reviews .guest-reviews__head {
            margin-bottom: 24px;
          }
          #reviews .guest-reviews__head h2 {
            font-size: clamp(32px, 8.5vw, 42px);
          }
          #reviews .guest-reviews__head p {
            margin-top: 6px;
            font-size: 13.5px;
          }
          .guest-reviews__track {
            gap: 14px;
            animation-duration: 35s;
          }
          .guest-review {
            width: 290px;
            min-height: 220px;
            padding: 18px 16px 14px;
            border-radius: 18px !important;
          }
          .guest-review__avatar {
            width: 36px;
            height: 36px;
            font-size: 15px;
          }
          .guest-review__source {
            font-size: 8.5px;
            padding: 4px 8px;
          }
          .guest-review__stars {
            margin-top: 10px;
            font-size: 15px;
          }
          .guest-review__text {
            font-size: 13px;
            line-height: 1.6;
          }
          .guest-review__google {
            padding-top: 10px;
          }
        }
      `}</style>

      <div className="guest-reviews__head-wrap">
        <header className="guest-reviews__head">
          <span className="guest-reviews__eyebrow">Guest Reviews</span>
          <h2>Loved by Our Guests</h2>
          <p>Real words from our guests.</p>
        </header>
      </div>

      {/* Infinite Marquee moving from right to left */}
      <div className="guest-reviews__marquee-container" role="region" aria-label="Customer Reviews Slider">
        <div className="guest-reviews__track" role="list">
          {marqueeReviews.map((review, idx) => (
            <ReviewCard key={`review-marquee-${review.id}-${idx}`} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
