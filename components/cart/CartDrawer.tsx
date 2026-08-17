'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, itemCount, subtotal, shippingCharge, total, freeShippingRemaining, updateQuantity, removeItem } =
    useCart();

  const freeShippingProgress = Math.min(
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100,
    100
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-dark-950/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Shopping Cart"
        aria-modal="true"
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-float flex flex-col transition-transform duration-400 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cream-200">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-maroon-900" />
            <h2 className="font-display font-bold text-dark-900 text-lg">
              Your Cart
              {itemCount > 0 && (
                <span className="ml-2 text-sm font-normal text-dark-400">
                  ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-cream-100 transition-colors"
          >
            <X className="h-5 w-5 text-dark-700" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {items.length > 0 && (
          <div className="px-6 py-3 bg-cream-100 border-b border-cream-200">
            {freeShippingRemaining > 0 ? (
              <p className="font-body text-xs text-dark-600 mb-2">
                Add <span className="font-semibold text-maroon-900">{formatPrice(freeShippingRemaining)}</span> more for FREE shipping!
              </p>
            ) : (
              <p className="font-body text-xs font-semibold text-green-700 mb-2">
                🎉 You've unlocked FREE shipping!
              </p>
            )}
            <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-maroon-900 rounded-full transition-all duration-500"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <EmptyState
              emoji="🛒"
              title="Your cart is empty"
              description="Looks like you haven't added anything yet. Explore our fresh namkeen and snacks!"
              action={{ label: 'Shop Now', href: '/shop', onClick: onClose }}
            />
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const lineTotal = item.selectedWeight.price * item.quantity;
                return (
                  <div
                    key={`${item.productId}-${item.selectedWeight.value}`}
                    className="flex gap-4 pb-4 border-b border-cream-100 last:border-0"
                  >
                    {/* Image */}
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={onClose}
                      className="flex-shrink-0 h-20 w-20 rounded-xl overflow-hidden bg-cream-100 relative"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={onClose}
                        className="font-display font-semibold text-dark-900 text-sm hover:text-maroon-900 transition-colors line-clamp-2 leading-snug"
                      >
                        {item.name}
                      </Link>
                      <p className="font-body text-xs text-dark-400 mt-0.5">
                        {item.selectedWeight.label}
                      </p>

                      <div className="flex items-center justify-between mt-2.5">
                        {/* Quantity */}
                        <div className="flex items-center border border-cream-200 rounded-lg">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.selectedWeight.value, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="flex h-8 w-8 items-center justify-center hover:bg-cream-100 rounded-l-lg transition-colors"
                          >
                            {item.quantity === 1 ? (
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            ) : (
                              <Minus className="h-3.5 w-3.5 text-dark-600" />
                            )}
                          </button>
                          <span className="w-8 text-center font-body text-sm font-semibold text-dark-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.selectedWeight.value, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            disabled={item.quantity >= 10}
                            className="flex h-8 w-8 items-center justify-center hover:bg-cream-100 rounded-r-lg transition-colors disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5 text-dark-600" />
                          </button>
                        </div>

                        {/* Price */}
                        <span className="font-display font-bold text-maroon-900 text-sm">
                          {formatPrice(lineTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.productId, item.selectedWeight.value)}
                      aria-label="Remove item"
                      className="flex-shrink-0 self-start mt-1 h-7 w-7 flex items-center justify-center rounded-full hover:bg-red-50 text-dark-300 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        {items.length > 0 && (
          <div className="border-t border-cream-200 px-6 py-5 space-y-4 bg-cream-50">
            <div className="space-y-2">
              <div className="flex justify-between font-body text-sm text-dark-600">
                <span>Subtotal</span>
                <span className="font-semibold text-dark-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between font-body text-sm text-dark-600">
                <span>Shipping</span>
                <span className={cn('font-semibold', shippingCharge === 0 ? 'text-green-600' : 'text-dark-900')}>
                  {shippingCharge === 0 ? 'FREE' : formatPrice(shippingCharge)}
                </span>
              </div>
              <div className="flex justify-between font-display text-base font-bold text-dark-900 pt-2 border-t border-cream-200">
                <span>Total</span>
                <span className="text-maroon-900">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                asChild
              >
                <Link href="/checkout" onClick={onClose}>
                  Checkout <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                asChild
              >
                <Link href="/cart" onClick={onClose}>
                  View Full Cart
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
