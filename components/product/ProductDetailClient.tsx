'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, ShoppingCart, Star, CheckCircle, ArrowRight } from 'lucide-react';
import type { Product, WeightOption } from '@/types/product';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { formatPrice, cn } from '@/lib/utils';
import { getDefaultWeight } from '@/data/products';
import { VegBadge, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

import { ProductGallery } from './ProductGallery';
import { WeightSelector } from './WeightSelector';
import { QuantitySelector } from './QuantitySelector';
import { PincodeChecker } from './PincodeChecker';
import { ProductHighlights } from './ProductHighlights';
import { ProductAccordionDetails } from './ProductAccordionDetails';
import { ProductReviewsSection } from './ProductReviewsSection';
import { RelatedProductsSection } from './RelatedProductsSection';
import { MobileStickyBar } from './MobileStickyBar';

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addItem, isInCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [selectedWeight, setSelectedWeight] = useState<WeightOption>(
    () => getDefaultWeight(product)
  );
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const price = selectedWeight.price * quantity;
  const unitPrice = selectedWeight.price;
  const compareAt = selectedWeight.compareAtPrice ? selectedWeight.compareAtPrice * quantity : null;
  const discount = selectedWeight.compareAtPrice
    ? Math.round(((selectedWeight.compareAtPrice - selectedWeight.price) / selectedWeight.compareAtPrice) * 100)
    : null;

  const inCart = isInCart(product.id, selectedWeight.value);
  const wishlisted = isWishlisted(product.id);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0],
      categorySlug: product.categorySlug,
      selectedWeight,
      quantity,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    toggleWishlist(product.id);
  }

  return (
    <div className="space-y-16 pb-20">
      {/* Upper Grid: Gallery + Product Purchase Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column: Product Gallery */}
        <div className="lg:col-span-6 sticky top-28">
          <ProductGallery
            images={product.images}
            name={product.name}
            badges={product.badges}
            discount={discount}
          />
        </div>

        {/* Right Column: Product Info & Purchase Options */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header Metadata */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-body text-xs font-bold text-saffron-600 uppercase tracking-widest">
                {product.categoryName}
              </span>
              <span className="text-dark-300">•</span>
              <span className="font-body text-xs text-dark-500 font-light">
                SKU: {selectedWeight.sku}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <VegBadge className="mt-2 shrink-0" />
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 bg-cream-100 px-3 py-1 rounded-full border border-cream-200">
                <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
                <span className="font-body text-xs font-extrabold text-dark-900">
                  {product.rating.toFixed(1)}
                </span>
              </div>
              <span className="font-body text-xs text-dark-500">
                Based on <strong className="text-dark-800 font-bold">{product.reviewCount}</strong> verified customer reviews
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-5 rounded-2xl bg-white border border-cream-200/80 shadow-sm space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="font-display font-extrabold text-3xl sm:text-4xl text-maroon-900">
                {formatPrice(price)}
              </span>
              {compareAt && (
                <span className="font-body text-sm sm:text-base text-dark-400 line-through">
                  {formatPrice(compareAt)}
                </span>
              )}
              {discount && (
                <span className="font-body text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                  Save {discount}%
                </span>
              )}
            </div>
            <p className="font-body text-xs text-dark-500">
              Unit price: {formatPrice(unitPrice)} per {selectedWeight.label} (Inclusive of all taxes)
            </p>
          </div>

          {/* Short Description */}
          <p className="font-body text-sm sm:text-base text-dark-700 leading-relaxed font-light">
            {product.shortDescription}
          </p>

          {/* Weight Option Selector */}
          <WeightSelector
            weights={product.weights}
            selectedWeight={selectedWeight}
            onSelectWeight={(w) => setSelectedWeight(w)}
          />

          {/* Quantity + Wishlist Controls */}
          <div className="flex items-center gap-4 pt-2">
            <div className="space-y-1">
              <label className="font-body text-xs font-bold uppercase tracking-wider text-dark-900 block">
                Quantity
              </label>
              <QuantitySelector
                quantity={quantity}
                onQuantityChange={(q) => setQuantity(q)}
                max={Math.min(selectedWeight.stock, 10)}
              />
            </div>

            <div className="flex-1 space-y-1">
              <label className="font-body text-xs font-bold uppercase tracking-wider text-dark-900 block">
                Wishlist
              </label>
              <button
                type="button"
                onClick={handleWishlist}
                className={cn(
                  'flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 font-body text-xs font-bold uppercase tracking-wider transition-all duration-200',
                  wishlisted
                    ? 'border-maroon-900 bg-maroon-900 text-white'
                    : 'border-cream-300 bg-white text-dark-800 hover:border-maroon-900 hover:text-maroon-900'
                )}
              >
                <Heart className="h-4 w-4" fill={wishlisted ? 'currentColor' : 'none'} />
                {wishlisted ? 'Wishlisted' : 'Save to Wishlist'}
              </button>
            </div>
          </div>

          {/* Primary Action CTAs */}
          <div className="space-y-3 pt-2">
            <Button
              variant="primary"
              size="xl"
              fullWidth
              onClick={handleAddToCart}
              className={cn(
                'text-base tracking-wide shadow-float py-4 font-bold uppercase',
                addedFeedback && 'bg-green-600 border-green-600 text-white'
              )}
            >
              {addedFeedback ? (
                <>✓ Added to Shopping Bag!</>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {inCart ? 'Add More to Bag' : 'Add to Bag'}
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              fullWidth
              asChild
              className="text-sm font-bold uppercase tracking-wider shadow-md"
            >
              <Link href="/shop" onClick={(e) => { handleAddToCart(e); }}>
                Buy Now — Fast Express Checkout
              </Link>
            </Button>
          </div>

          {/* Pincode Availability Checker */}
          <PincodeChecker />

          {/* Product Metadata Highlights */}
          <ProductHighlights highlights={product.highlights} />
        </div>
      </div>

      {/* Middle Section: Detailed Product Accordion Information */}
      <ProductAccordionDetails product={product} />

      {/* Reviews Section */}
      <ProductReviewsSection
        productRating={product.rating}
        productReviewCount={product.reviewCount}
      />

      {/* Related Products */}
      <RelatedProductsSection product={product} />

      {/* Mobile Sticky Action Bar */}
      <MobileStickyBar
        name={product.name}
        selectedWeight={selectedWeight}
        quantity={quantity}
        addedFeedback={addedFeedback}
        inCart={inCart}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
