import React, { useState, useEffect, useRef, memo } from 'react';
import ProductCard from './ProductCard';
import { type Product } from '../../data/products';

interface VirtualProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

const VirtualProductCardComponent: React.FC<VirtualProductCardProps> = ({ product, onQuickView }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Default to true so SSR or initial render displays immediately
  const [isVisible, setIsVisible] = useState(true);
  const [cardHeight, setCardHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    // Observe with a generous 600px top & bottom overscan buffer for smooth 60fps scrolling
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (entry.boundingClientRect.height > 0) {
              setCardHeight(entry.boundingClientRect.height);
            }
          } else {
            // Save measured height before unmounting inner card DOM to prevent any layout shift
            if (el.offsetHeight > 0) {
              setCardHeight(el.offsetHeight);
            }
            setIsVisible(false);
          }
        }
      },
      {
        root: null,
        rootMargin: '600px 0px 600px 0px',
        threshold: 0,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="virtual-product-wrapper"
      style={{
        minHeight: cardHeight ? `${cardHeight}px` : undefined,
        width: '100%',
      }}
    >
      {isVisible ? (
        <ProductCard product={product} onQuickView={onQuickView} />
      ) : (
        <div
          className="virtual-card-placeholder"
          style={{
            minHeight: cardHeight ? `${cardHeight}px` : '320px',
            width: '100%',
            background: 'transparent',
            borderRadius: '18px',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export const VirtualProductCard = memo(VirtualProductCardComponent);
export default VirtualProductCard;
