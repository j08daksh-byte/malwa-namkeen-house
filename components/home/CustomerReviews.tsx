import { Star, MapPin, CheckCircle } from 'lucide-react';
import { getHomepageReviews, globalRating } from '@/data/reviews';
import { Rating } from '@/components/ui/Rating';

export function CustomerReviews() {
  const reviews = getHomepageReviews();

  return (
    <section className="section-padding bg-cream-100/90 border-t border-cream-200/70" aria-label="Customer reviews">
      <div className="container-brand">
        {/* Header */}
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="section-heading">Verified Feedback</span>
            <div className="h-px w-8 bg-saffron-500" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-dark-900 leading-tight mb-6">
            The Taste Speaks <span className="font-serif italic text-maroon-900 font-normal">for Itself.</span>
          </h2>

          {/* Global Rating Seal */}
          <div className="inline-flex items-center gap-5 bg-white px-7 py-3.5 rounded-2xl border border-cream-300/80 shadow-sm">
            <span className="font-display text-5xl font-extrabold text-maroon-900 leading-none">
              {globalRating.average}
            </span>
            <div className="text-left border-l border-cream-200 pl-5">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-5 w-5 fill-gold-500 text-gold-500" />
                ))}
              </div>
              <p className="font-body text-xs font-semibold text-dark-600 tracking-wide">
                Based on {globalRating.total.toLocaleString('en-IN')}+ verified order reviews
              </p>
            </div>
          </div>
        </div>

        {/* Review Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-6 border border-cream-200/80 flex flex-col justify-between gap-4 shadow-card hover:shadow-float transition-all duration-300 hover:-translate-y-1"
            >
              <div className="space-y-3">
                {/* Stars */}
                <Rating value={review.rating} size="sm" />

                {/* Title */}
                <h3 className="font-display italic text-lg font-bold text-dark-900 leading-snug">
                  &ldquo;{review.title}&rdquo;
                </h3>

                {/* Body */}
                <p className="font-body text-xs sm:text-sm text-dark-700 leading-relaxed font-light">
                  {review.body}
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center justify-between pt-4 border-t border-cream-100 mt-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-body text-xs font-bold text-dark-900">
                      {review.author}
                    </p>
                    {review.verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                        <CheckCircle className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  {review.location && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-dark-400" />
                      <span className="font-body text-[11px] text-dark-500 font-light">
                        {review.location}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
