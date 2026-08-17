'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Heart, ShoppingCart, Star, Check } from 'lucide-react';
import type { Product } from '@/types/product';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { formatPrice, cn } from '@/lib/utils';
import { getDefaultWeight } from '@/data/products';
import { Badge, VegBadge } from '@/components/ui/Badge';
import type { BadgeVariant } from '@/components/ui/Badge';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem, isInCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [addedFeedback, setAddedFeedback] = useState(false);

  const defaultWeight = getDefaultWeight(product);
  const price = defaultWeight.price;
  const compareAt = defaultWeight.compareAtPrice;
  const discount = compareAt ? Math.round(((compareAt - price) / compareAt) * 100) : null;
  const primaryBadge = product.badges[0] as BadgeVariant | undefined;
  const inCart = isInCart(product.id, defaultWeight.value);
  const wishlisted = isWishlisted(product.id);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0],
      categorySlug: product.categorySlug,
      selectedWeight: defaultWeight,
      quantity: 1,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1600);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    toggleWishlist(product.id);
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        'group relative flex flex-col rounded-2xl bg-white border border-cream-200/80 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-maroon-900/5 hover:border-cream-300',
        className
      )}
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-cream-100/70">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <div>
            {primaryBadge ? (
              <Badge variant={primaryBadge} className="shadow-xs backdrop-blur-md">
                {primaryBadge === 'bestseller' ? '★ Bestseller' : primaryBadge}
              </Badge>
            ) : (
              <span />
            )}
          </div>
          {discount && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-maroon-900 text-cream-50 font-body text-[10px] font-bold tracking-tight shadow-xs">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn(
            'absolute bottom-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-xs transition-all duration-300',
            wishlisted
              ? 'bg-maroon-900 text-white shadow-sm'
              : 'bg-white/85 text-dark-500 hover:bg-white hover:text-maroon-900 opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
          )}
        >
          <Heart
            className="h-4 w-4"
            fill={wishlisted ? 'currentColor' : 'none'}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Product Information */}
      <div className="flex flex-col flex-1 p-4 sm:p-4.5 gap-2">
        {/* Rating & Veg indicator */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <VegBadge className="flex-shrink-0" />
            <span className="font-body text-[11px] text-dark-400 capitalize tracking-wide">
              {product.categorySlug.replace(/-/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
            <span className="font-body text-[11px] font-bold text-dark-800">
              {product.rating.toFixed(1)}
            </span>
            <span className="font-body text-[10px] text-dark-400">
              ({product.reviewCount})
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display font-medium text-dark-900 text-sm sm:text-[15px] leading-snug line-clamp-2 group-hover:text-maroon-900 transition-colors">
          {product.name}
        </h3>

        {/* Price & Weight */}
        <div className="flex items-baseline gap-2 mt-auto pt-1">
          <span className="font-display font-bold text-maroon-900 text-base sm:text-lg">
            {formatPrice(price)}
          </span>
          {compareAt && (
            <span className="font-body text-xs text-dark-400 line-through">
              {formatPrice(compareAt)}
            </span>
          )}
          <span className="font-body text-xs text-dark-400 ml-auto">
            {defaultWeight.label}
          </span>
        </div>

        {/* Add to Cart Action */}
        <button
          onClick={handleAddToCart}
          aria-label={`Add ${product.name} to cart`}
          className={cn(
            'mt-2 flex h-9.5 w-full items-center justify-center gap-2 rounded-xl font-body text-xs font-semibold uppercase tracking-wider transition-all duration-300',
            addedFeedback
              ? 'bg-green-700 text-white shadow-sm'
              : inCart
              ? 'bg-cream-200/90 text-maroon-900 hover:bg-maroon-900 hover:text-cream-100'
              : 'bg-maroon-900/5 text-maroon-900 hover:bg-maroon-900 hover:text-cream-100'
          )}
        >
          {addedFeedback ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Added to Cart</span>
            </>
          ) : inCart ? (
            <>
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>In Cart (Add +)</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </Link>
  );
}
