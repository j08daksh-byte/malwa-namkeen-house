'use client';

import { ShoppingCart } from 'lucide-react';
import type { WeightOption } from '@/types/product';
import { formatPrice, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface MobileStickyBarProps {
  name: string;
  selectedWeight: WeightOption;
  quantity: number;
  addedFeedback: boolean;
  inCart: boolean;
  onAddToCart: (e: React.MouseEvent) => void;
}

export function MobileStickyBar({
  name,
  selectedWeight,
  quantity,
  addedFeedback,
  inCart,
  onAddToCart,
}: MobileStickyBarProps) {
  const linePrice = selectedWeight.price * quantity;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-cream-300 p-3 shadow-float">
      <div className="container-brand flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="font-display font-bold text-dark-900 text-sm truncate">
            {name}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-extrabold text-maroon-900 text-base">
              {formatPrice(linePrice)}
            </span>
            <span className="font-body text-[11px] text-dark-500">
              ({selectedWeight.label} × {quantity})
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onAddToCart}
          className={cn(
            'px-5 shrink-0 shadow-md font-bold uppercase tracking-wider text-xs',
            addedFeedback && 'bg-green-600 border-green-600 text-white'
          )}
        >
          {addedFeedback ? (
            <>✓ Added</>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-1.5" />
              {inCart ? 'Add More' : 'Add to Bag'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
