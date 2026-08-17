'use client';

import type { WeightOption } from '@/types/product';
import { formatPrice, cn } from '@/lib/utils';

interface WeightSelectorProps {
  weights: WeightOption[];
  selectedWeight: WeightOption;
  onSelectWeight: (weight: WeightOption) => void;
}

export function WeightSelector({ weights, selectedWeight, onSelectWeight }: WeightSelectorProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="font-body text-xs font-bold uppercase tracking-wider text-dark-900">
          Select Pack Weight: <span className="text-maroon-900 font-extrabold">{selectedWeight.label}</span>
        </label>
        <span className="font-body text-[11px] text-dark-500">
          {selectedWeight.stock > 0 ? '✓ Fresh Stock In Store' : 'Out of stock'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {weights.map((option) => {
          const isSelected = option.value === selectedWeight.value;
          const isOut = option.stock <= 0;

          return (
            <button
              key={option.value}
              type="button"
              disabled={isOut}
              onClick={() => onSelectWeight(option)}
              className={cn(
                'flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 text-center relative select-none',
                isSelected
                  ? 'border-maroon-900 bg-maroon-50/60 shadow-sm text-maroon-900'
                  : 'border-cream-200/80 bg-white hover:border-cream-300 text-dark-800 hover:bg-cream-50',
                isOut && 'opacity-50 cursor-not-allowed border-dashed'
              )}
            >
              <span className="font-display font-bold text-base sm:text-lg">
                {option.label}
              </span>
              <span className={cn('font-body text-xs font-semibold mt-0.5', isSelected ? 'text-maroon-900' : 'text-dark-600')}>
                {formatPrice(option.price)}
              </span>

              {option.compareAtPrice && (
                <span className="font-body text-[10px] text-dark-400 line-through">
                  {formatPrice(option.compareAtPrice)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
