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
      {[1, 2, 3, 4, 5].map(star => <span key={star} aria-hidden="true">{star <= rating ? '★' : '☆'}</span>)}
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="guest-review" aria-label={`Review by ${review.name}`}>
      <div className="guest-review__top">
        <div className="guest-review__person">
          <span className="guest-review__avatar" aria-hidden="true">{review.name.charAt(0)}</span>
          <div>
            <h3>{review.name}</h3>
            <p>{review.date ?? 'Google Review'}</p>
          </div>
        </div>
        <span className="guest-review__source">Google Review</span>
      </div>

      <Stars rating={review.rating} />
      <p className="guest-review__text">{review.text}</p>
      <div className="guest-review__google"><GoogleMark /></div>
    </article>
  );
}

export default function GuestReviews() {
  return (
    <section id="reviews" aria-label="Guest Reviews">
      <style>{`
        #reviews {
          background: #F6EFE3;
          padding: clamp(58px, 7vw, 88px) clamp(18px, 4vw, 48px) clamp(64px, 7vw, 92px);
        }
        #reviews .guest-reviews__inner { width: min(100%, 1180px); margin: 0 auto; }
        #reviews .guest-reviews__head { margin-bottom: clamp(28px, 3.5vw, 42px); }
        #reviews .guest-reviews__eyebrow {
          display: block;
          margin-bottom: 10px;
          color: #C99A32;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          line-height: 1.2;
        }
        #reviews .guest-reviews__head h2 {
          margin: 0;
          color: #55000A;
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(38px, 4.3vw, 56px);
          font-weight: 600;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        #reviews .guest-reviews__head p {
          margin: 10px 0 0;
          color: #75645C;
          font-family: Inter, sans-serif;
          font-size: 14px;
          line-height: 1.55;
        }
        #reviews .guest-reviews__grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          align-items: stretch;
        }
        .guest-review {
          position: relative;
          display: flex;
          min-width: 0;
          min-height: 236px;
          flex-direction: column;
          padding: 19px 19px 17px;
          overflow: hidden;
          border: 1px solid rgba(85, 0, 10, 0.16);
          border-radius: 22px 22px 54px 22px;
          background: #FFF9EF;
          box-shadow: 0 8px 22px rgba(85, 0, 10, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .guest-review:nth-child(2) { border-radius: 54px 22px 22px; }
        .guest-review:nth-child(3) { border-radius: 22px 54px 22px 22px; }
        @media (hover: hover) {
          .guest-review:hover { transform: translateY(-3px); box-shadow: 0 13px 28px rgba(85, 0, 10, 0.1); }
        }
        .guest-review__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .guest-review__person { display: flex; min-width: 0; align-items: center; gap: 10px; }
        .guest-review__avatar {
          display: grid;
          width: 39px;
          height: 39px;
          flex: 0 0 auto;
          place-items: center;
          border-radius: 50%;
          background: #55000A;
          color: #FFF8EC;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 19px;
          font-weight: 700;
        }
        .guest-review__person h3 {
          margin: 0;
          color: #3A211D;
          font-family: Inter, sans-serif;
          font-size: 13px;
          font-weight: 750;
          line-height: 1.3;
        }
        .guest-review__person p { margin: 2px 0 0; color: #927F74; font-family: Inter, sans-serif; font-size: 11px; }
        .guest-review__source {
          flex: 0 0 auto;
          border: 1px solid rgba(201, 154, 50, 0.32);
          border-radius: 999px;
          background: rgba(201, 154, 50, 0.08);
          color: #A87320;
          font-family: Inter, sans-serif;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          line-height: 1;
          padding: 6px 8px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .guest-review__stars { display: flex; gap: 2px; margin-top: 14px; color: #C99A32; font-size: 16px; letter-spacing: 0; line-height: 1; }
        .guest-review__text {
          margin: 11px 0 0;
          color: #4A3830;
          font-family: Inter, sans-serif;
          font-size: 13px;
          line-height: 1.65;
        }
        .guest-review__google { display: flex; justify-content: flex-end; margin-top: auto; padding-top: 11px; opacity: 0.78; }

        @media (min-width: 768px) and (max-width: 1099px) {
          #reviews .guest-reviews__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 767px) {
          #reviews { padding: 40px 18px 48px; }
          #reviews .guest-reviews__head { margin-bottom: 22px; }
          #reviews .guest-reviews__head p { margin-top: 6px; font-size: 13px; }
          #reviews .guest-reviews__grid { grid-template-columns: 1fr; gap: 10px; }
          .guest-review { min-height: 168px; padding: 14px 15px 12px; }
          .guest-review__avatar { width: 32px; height: 32px; font-size: 16px; }
          .guest-review__source { font-size: 8px; padding: 5px 6px; }
          .guest-review__stars { margin-top: 10px; font-size: 14px; }
          .guest-review__text {
            display: -webkit-box;
            margin-top: 8px;
            overflow: hidden;
            color: #4A3830;
            font-size: 11px;
            line-height: 1.45;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
          }
          .guest-review__google { padding-top: 7px; }
        }
      `}</style>

      <div className="guest-reviews__inner">
        <header className="guest-reviews__head">
          <span className="guest-reviews__eyebrow">Guest Reviews</span>
          <h2>Loved by Our Guests</h2>
          <p>Real words from our guests.</p>
        </header>
        <div className="guest-reviews__grid" role="list">
          {REVIEWS.slice(0, 3).map(review => <ReviewCard key={review.id} review={review} />)}
        </div>
      </div>
    </section>
  );
}
