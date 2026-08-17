'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ─── Variants ─────────────────────────────────────────────────────────────────

const base =
  'inline-flex items-center justify-center gap-2 font-body font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap';

const variants = {
  primary:
    'bg-maroon-900 text-cream-100 hover:bg-maroon-800 active:bg-maroon-950 shadow-md hover:shadow-float',
  secondary:
    'bg-saffron-500 text-white hover:bg-saffron-600 active:bg-saffron-700 shadow-md',
  outline:
    'border-2 border-maroon-900 text-maroon-900 bg-transparent hover:bg-maroon-900 hover:text-cream-100',
  ghost:
    'bg-transparent text-maroon-900 hover:bg-maroon-50',
  cream:
    'bg-cream-100 text-maroon-900 hover:bg-white border border-cream-300',
  white:
    'bg-white text-maroon-900 hover:bg-cream-100 shadow-card',
  danger:
    'bg-red-600 text-white hover:bg-red-700',
};

const sizes = {
  xs:  'h-7  px-3  text-xs  rounded-md',
  sm:  'h-9  px-4  text-sm  rounded-lg',
  md:  'h-11 px-6  text-sm  rounded-xl',
  lg:  'h-13 px-8  text-base rounded-xl',
  xl:  'h-15 px-10 text-lg  rounded-2xl',
  icon:'h-10 w-10  rounded-full',
};

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  fullWidth?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled ?? loading}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            <span>Loading…</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
