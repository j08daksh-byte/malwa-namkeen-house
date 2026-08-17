'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { BadgeVariant } from '@/components/ui/Badge';

interface ProductGalleryProps {
  images: string[];
  name: string;
  badges?: BadgeVariant[];
  discount?: number | null;
}

export function ProductGallery({ images, name, badges = [], discount }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  const primaryBadge = badges[0];
  const activeImage = images[selectedIndex] || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=85';

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Viewport */}
      <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-square w-full rounded-3xl overflow-hidden bg-cream-100/70 border border-cream-200/80 shadow-card group">
        <Image
          src={imageError[selectedIndex] ? 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=85' : activeImage}
          alt={`${name} image ${selectedIndex + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          onError={() => setImageError((prev) => ({ ...prev, [selectedIndex]: true }))}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {primaryBadge && (
            <Badge variant={primaryBadge} className="shadow-md">
              {primaryBadge === 'bestseller' ? '★ Bestseller' : primaryBadge}
            </Badge>
          )}
        </div>

        {discount && (
          <div className="absolute top-4 right-4 z-10">
            <Badge variant="sale" className="shadow-md">{discount}% OFF</Badge>
          </div>
        )}
      </div>

      {/* Thumbnails Strip */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scroll-x-hidden">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              aria-label={`View image ${idx + 1}`}
              className={cn(
                'relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 bg-cream-100',
                selectedIndex === idx
                  ? 'border-maroon-900 ring-2 ring-saffron-500/30 scale-95'
                  : 'border-cream-200 opacity-70 hover:opacity-100 hover:border-maroon-700'
              )}
            >
              <Image
                src={imageError[idx] ? 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=85' : img}
                alt={`${name} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                onError={() => setImageError((prev) => ({ ...prev, [idx]: true }))}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
