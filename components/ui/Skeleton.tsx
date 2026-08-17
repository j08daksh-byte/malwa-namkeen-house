'use client';

import { cn } from '@/lib/utils';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  const roundedMap = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn('skeleton', roundedMap[rounded], className)}
      aria-hidden="true"
    />
  );
}

// ─── Product Card Skeleton ─────────────────────────────────────────────────────

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white overflow-hidden border border-cream-200">
      <Skeleton className="aspect-square w-full" rounded="lg" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-full" rounded="xl" />
      </div>
    </div>
  );
}

// ─── Product Grid Skeleton ────────────────────────────────────────────────────

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
