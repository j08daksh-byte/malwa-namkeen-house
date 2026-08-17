'use client';

import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (qty: number) => void;
  max?: number;
  min?: number;
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
  max = 10,
  min = 1,
}: QuantitySelectorProps) {
  function handleDecrease() {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  }

  function handleIncrease() {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  }

  return (
    <div className="flex items-center justify-between border-2 border-cream-200 rounded-xl bg-white p-1 h-12 w-36">
      <button
        type="button"
        onClick={handleDecrease}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
        className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-cream-100 text-dark-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Minus className="h-4 w-4" />
      </button>

      <span className="font-display font-extrabold text-dark-900 text-base text-center w-8 select-none">
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleIncrease}
        disabled={quantity >= max}
        aria-label="Increase quantity"
        className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-cream-100 text-dark-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
