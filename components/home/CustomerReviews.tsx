import { Star, MapPin, CheckCircle2, Quote } from 'lucide-react';
import { getHomepageReviews, globalRating } from '@/data/reviews';
import { Rating } from '@/components/ui/Rating';

export function CustomerReviews() {
  const reviews = getHomepageReviews();

  return (
    <section className="section-padding bg-cream-50/70 border-b border-cream-200/80" aria-label="Customer reviews">
      <div className="container-brand">
        {/* Header with Global Rating Scorecard */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8 bg-saffron-600" />
              <p className="font-body text-xs font-semibold text-saffron-700 uppercase tracking-[0.25em]">
                Customer Stories
              </p>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-dark-900 leading-tight">
              The Taste Speaks for Itself
            </h2>
          </div>

          {/* Editorial Score Banner */}
          <div className="flex items-center gap-5 p-4 sm:p-5 rounded-2xl bg-white border border-cream-200 shadow-2xs">
            <div className="font-display text-4xl sm:text-5xl font-bold text-maroon-900 leading-none">
              {globalRating.average}
            </div>
            <div className="border-l border-cream-200 pl-4">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-gold-500 text-gold-500" />
                ))}
              </div>
              <p className="font-body text-xs text-dark-500 font-light">
                Based on <strong className="font-semibold text-dark-900">{globalRating.total.toLocaleString('en-IN')}+</strong> verified customer reviews
              </p>
            </div>
          </div>
        </div>

        {/* Review Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-cream-200/90 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-cream-300 transition-all duration-300"
            >
              <div>
                {/* Stars & Quote Icon */}
                <div className="flex items-center justify-between mb-4">
                  <Rating value={review.rating} size="sm" />
                  <Quote className="h-4 w-4 text-saffron-400/40 rotate-180" />
                </div>

                {/* Review Headline */}
                <h3 className="font-display text-base font-semibold text-dark-900 leading-snug mb-3">
                  &ldquo;{review.title}&rdquo;
                </h3>

                {/* Review Body */}
                <p className="font-body text-xs sm:text-[13px] text-dark-600 font-light leading-relaxed mb-6">
                  {review.body}
                </p>
              </div>

              {/* Author & Location Footer */}
              <div className="pt-4 border-t border-cream-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-body text-xs font-semibold text-dark-900">
                      {review.author}
                    </p>
                    {review.verified && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    )}
                  </div>
                  {review.location && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-dark-400" />
                      <span className="font-body text-[11px] text-dark-400">
                        {review.location}
                      </span>
                    </div>
                  )}
                </div>
                <span className="font-body text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                  Verified Buyer
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

