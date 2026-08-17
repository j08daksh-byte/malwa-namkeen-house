'use client';

import { cn } from '@/lib/utils';

// ─── Badge ────────────────────────────────────────────────────────────────────

const variants = {
  bestseller: 'bg-maroon-900   text-cream-100   border-maroon-900',
  new:        'bg-saffron-500  text-white        border-saffron-500',
  sale:       'bg-red-600      text-white        border-red-600',
  limited:    'bg-gold-600     text-white        border-gold-600',
  spicy:      'bg-orange-600   text-white        border-orange-600',
  sweet:      'bg-pink-500     text-white        border-pink-500',
  gift:       'bg-purple-600   text-white        border-purple-600',
  combo:      'bg-dark-800     text-cream-100    border-dark-800',
  veg:        'bg-green-600    text-white        border-green-600',
  hot:        'bg-red-500      text-white        border-red-500',
  default:    'bg-cream-100    text-maroon-900   border-cream-300',
};

export type BadgeVariant = keyof typeof variants;

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ variant = 'default', children, className, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border font-body font-semibold tracking-wide uppercase',
        size === 'sm'
          ? 'text-[10px] px-2 py-0.5 rounded-full'
          : 'text-xs px-3 py-1 rounded-full',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── VegBadge ─────────────────────────────────────────────────────────────────

export function VegBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-5 h-5 border-2 border-green-600 rounded-sm',
        className
      )}
    >
      <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
    </span>
  );
}
