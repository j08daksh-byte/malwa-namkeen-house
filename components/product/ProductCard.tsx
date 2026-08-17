'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';
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
    setTimeout(() => setAddedFeedback(false), 1500);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    toggleWishlist(product.id);
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        'group relative flex flex-col rounded-2xl bg-white border border-cream-200/80 overflow-hidden shadow-card hover:shadow-float transition-all duration-300 hover:-translate-y-1',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-cream-100/60">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {primaryBadge && (
            <Badge variant={primaryBadge}>
              {primaryBadge === 'bestseller' ? '★ Bestseller' : primaryBadge}
            </Badge>
          )}
        </div>

        {discount && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="sale">{discount}% OFF</Badge>
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn(
            'absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all duration-300',
            wishlisted
              ? 'bg-maroon-900 text-white'
              : 'bg-white/90 text-dark-400 opacity-90 sm:opacity-0 group-hover:opacity-100 hover:text-maroon-900 hover:scale-110'
          )}
        >
          <Heart
            className="h-4 w-4"
            fill={wishlisted ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* Info Container */}
      <div className="flex flex-col flex-1 p-5 gap-2">
        {/* Category tag & Rating */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-body text-[11px] font-semibold text-saffron-600 uppercase tracking-wider">
            {product.categoryName}
          </span>
          <div className="flex items-center gap-1 bg-cream-100 px-2 py-0.5 rounded-full border border-cream-200">
            <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
            <span className="font-body text-[11px] font-bold text-dark-900">
              {product.rating.toFixed(1)}
            </span>
            <span className="font-body text-[10px] text-dark-400">
              ({product.reviewCount})
            </span>
          </div>
        </div>

        {/* Veg + Name */}
        <div className="flex items-start gap-2">
          <VegBadge className="mt-1 flex-shrink-0" />
          <h3 className="font-display font-bold text-dark-900 text-base leading-snug line-clamp-2 group-hover:text-maroon-900 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Short Description */}
        <p className="font-body text-xs text-dark-500 line-clamp-1 font-light">
          {product.shortDescription}
        </p>

        {/* Price & Weight */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-display font-extrabold text-maroon-900 text-lg sm:text-xl">
            {formatPrice(price)}
          </span>
          {compareAt && (
            <span className="font-body text-xs text-dark-400 line-through">
              {formatPrice(compareAt)}
            </span>
          )}
          <span className="font-body text-xs font-medium text-dark-500 ml-auto">
            / {defaultWeight.label}
          </span>
        </div>

        {/* Add to Cart CTA */}
        <button
          onClick={handleAddToCart}
          aria-label={`Add ${product.name} to cart`}
          className={cn(
            'mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl font-body text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm',
            addedFeedback
              ? 'border border-green-600 bg-green-600 text-white'
              : inCart
              ? 'border border-maroon-900 bg-maroon-50 text-maroon-900 hover:bg-maroon-900 hover:text-white'
              : 'border border-maroon-900 bg-maroon-900 text-white hover:bg-maroon-800 hover:shadow-md'
          )}
        >
          {addedFeedback ? (
            <>✓ Added to Bag</>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              {inCart ? 'In Bag (Add More)' : 'Add to Bag'}
            </>
          )}
        </button>
      </div>
    </Link>
  );
}
