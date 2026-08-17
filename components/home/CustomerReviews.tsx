import { Star, MapPin, CheckCircle } from 'lucide-react';
import { getHomepageReviews, globalRating } from '@/data/reviews';
import { Rating } from '@/components/ui/Rating';

export function CustomerReviews() {
  const reviews = getHomepageReviews();

  return (
    <section className="section-padding bg-cream-50" aria-label="Customer reviews">
      <div className="container-brand">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-body text-xs font-semibold text-saffron-600 uppercase tracking-[0.2em] mb-3">
            What Customers Say
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-dark-900 leading-tight mb-6">
            The Taste Speaks
            <br />
            <span>for Itself.</span>
          </h2>

          {/* Global Rating */}
          <div className="flex items-center justify-center gap-4">
            <span className="font-display text-5xl font-bold text-dark-900">
              {globalRating.average}
            </span>
            <div className="text-left">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-6 w-6 fill-gold-500 text-gold-500" />
                ))}
              </div>
              <p className="font-body text-sm text-dark-500">
                Based on {globalRating.total.toLocaleString('en-IN')}+ reviews
              </p>
            </div>
          </div>
        </div>

        {/* Review Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-6 border border-cream-200 flex flex-col gap-4 hover:shadow-sm transition-shadow"
            >
              {/* Stars */}
              <Rating value={review.rating} size="sm" />

              {/* Title */}
              <h3 className="font-display italic text-base font-bold text-dark-900 leading-snug">
                &ldquo;{review.title}&rdquo;
              </h3>

              {/* Body */}
              <p className="font-body text-sm text-dark-600 leading-relaxed flex-1">
                {review.body}
              </p>

              {/* Author */}
              <div className="flex items-center justify-between pt-2 border-t border-cream-100">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-body text-sm font-semibold text-dark-900">
                      {review.author}
                    </p>
                    {review.verified && (
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    )}
                  </div>
                  {review.location && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-dark-400" />
                      <span className="font-body text-xs text-dark-400">
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
