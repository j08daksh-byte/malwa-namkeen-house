import { Star, MapPin, CheckCircle } from 'lucide-react';
import { getHomepageReviews, globalRating } from '@/data/reviews';
import { Rating } from '@/components/ui/Rating';

interface ProductReviewsSectionProps {
  productRating: number;
  productReviewCount: number;
}

export function ProductReviewsSection({ productRating, productReviewCount }: ProductReviewsSectionProps) {
  const reviews = getHomepageReviews().slice(0, 4);

  return (
    <section className="space-y-8" aria-label="Product customer reviews">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cream-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-body text-xs font-bold text-saffron-600 uppercase tracking-widest">
              Verified Feedback
            </span>
            <div className="h-px w-6 bg-saffron-500" />
          </div>
          <h2 className="font-display text-3xl font-bold text-dark-900">
            Customer Reviews & Ratings
          </h2>
        </div>

        <div className="flex items-center gap-3 bg-cream-50 px-4 py-2 rounded-2xl border border-cream-200 shrink-0">
          <Star className="h-5 w-5 fill-gold-500 text-gold-500" />
          <span className="font-display text-2xl font-extrabold text-dark-900">
            {productRating.toFixed(1)}
          </span>
          <span className="font-body text-xs text-dark-500">
            ({productReviewCount.toLocaleString('en-IN')} reviews)
          </span>
        </div>
      </div>

      {/* Review Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-2xl p-6 border border-cream-200/80 flex flex-col justify-between gap-3 shadow-card"
          >
            <div className="space-y-2">
              <Rating value={review.rating} size="sm" />
              <h3 className="font-display italic text-base font-bold text-dark-900 leading-snug">
                &ldquo;{review.title}&rdquo;
              </h3>
              <p className="font-body text-xs text-dark-700 leading-relaxed font-light">
                {review.body}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-cream-100 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-body font-bold text-dark-900">{review.author}</span>
                {review.verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 rounded-full">
                    <CheckCircle className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              {review.location && (
                <div className="flex items-center gap-1 text-dark-400">
                  <MapPin className="h-3 w-3" />
                  <span className="text-[11px]">{review.location}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
