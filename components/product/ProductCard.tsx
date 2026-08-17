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
        'group relative flex flex-col rounded-xl bg-white border border-cream-200 overflow-hidden transition-transform duration-300 hover:-translate-y-0.5',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-cream-100">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />

        {/* Badges */}
        {primaryBadge && (
          <div className="absolute top-2.5 left-2.5">
            <Badge variant={primaryBadge}>
              {primaryBadge === 'bestseller' ? 'Best Seller' : primaryBadge}
            </Badge>
          </div>
        )}

        {discount && (
          <div className="absolute top-2.5 right-2.5">
            <Badge variant="sale">{discount}% off</Badge>
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn(
            'absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-all duration-300',
            wishlisted
              ? 'bg-maroon-900 text-white'
              : 'bg-white text-dark-400 opacity-0 group-hover:opacity-100 hover:text-maroon-900'
          )}
        >
          <Heart
            className="h-4 w-4"
            fill={wishlisted ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-1.5">
        {/* Veg + name */}
        <div className="flex items-start gap-1.5">
          <VegBadge className="mt-0.5 flex-shrink-0" />
          <h3 className="font-display font-semibold text-dark-900 text-[13px] leading-snug line-clamp-2 group-hover:text-maroon-900 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
          <span className="font-body text-[11px] font-semibold text-dark-800">
            {product.rating.toFixed(1)}
          </span>
          <span className="font-body text-[11px] text-dark-400">
            ({product.reviewCount.toLocaleString('en-IN')})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          <span className="font-display font-bold text-maroon-900 text-base">
            {formatPrice(price)}
          </span>
          {compareAt && (
            <span className="font-body text-xs text-dark-400 line-through">
              {formatPrice(compareAt)}
            </span>
          )}
          <span className="font-body text-xs text-dark-400">/ {defaultWeight.label}</span>
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          aria-label={`Add ${product.name} to cart`}
          className={cn(
            'mt-auto flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border font-body text-xs font-semibold uppercase tracking-wider transition-all duration-300',
            addedFeedback
              ? 'border-green-500 bg-green-50 text-green-700'
              : inCart
              ? 'border-maroon-200 bg-maroon-50 text-maroon-700 hover:border-maroon-900 hover:bg-maroon-900 hover:text-white'
              : 'border-maroon-900 bg-transparent text-maroon-900 hover:bg-maroon-900 hover:text-white'
          )}
        >
          {addedFeedback ? (
            <>✓ Added</>
          ) : (
            <>
              <ShoppingCart className="h-3.5 w-3.5" />
              {inCart ? 'In Cart' : 'Add to Cart'}
            </>
          )}
        </button>
      </div>
    </Link>
  );
}
