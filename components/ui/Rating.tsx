'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
  className?: string;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

const starSizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4.5 w-4.5',
  lg: 'h-6 w-6',
};

export function Rating({
  value,
  max = 5,
  size = 'md',
  showCount = false,
  count,
  className,
  interactive = false,
  onChange,
}: RatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5">
        {stars.map((star) => {
          const filled = star <= Math.floor(value);
          const partial = !filled && star - 1 < value && value < star;
          const fillPercent = partial ? Math.round((value - Math.floor(value)) * 100) : 0;

          return (
            <button
              key={star}
              type="button"
              onClick={() => interactive && onChange?.(star)}
              disabled={!interactive}
              className={cn(
                'relative',
                interactive && 'cursor-pointer hover:scale-110 transition-transform'
              )}
              aria-label={interactive ? `Rate ${star} of ${max}` : undefined}
            >
              {/* Background star */}
              <Star
                className={cn(starSizes[size], 'text-cream-300 fill-cream-300')}
                strokeWidth={0}
              />
              {/* Filled star (full or partial) */}
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : `${fillPercent}%` }}
              >
                <Star
                  className={cn(starSizes[size], 'text-gold-500 fill-gold-500')}
                  strokeWidth={0}
                />
              </span>
            </button>
          );
        })}
      </div>

      {(showCount || count !== undefined) && (
        <span className="font-body text-sm text-dark-500">
          <span className="font-semibold text-dark-800">{value.toFixed(1)}</span>
          {count !== undefined && (
            <span className="ml-1">({count.toLocaleString('en-IN')})</span>
          )}
        </span>
      )}
    </div>
  );
}
