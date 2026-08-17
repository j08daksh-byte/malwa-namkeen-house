import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getBestsellerProducts } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';

export function Bestsellers() {
  const products = getBestsellerProducts().slice(0, 8);

  return (
    <section className="section-padding bg-cream-100" aria-label="Bestselling products">
      <div className="container-brand">
        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="font-body text-xs font-semibold text-saffron-600 uppercase tracking-[0.2em] mb-3">
              Customer Favourites
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-dark-900 leading-tight">
              Loved by Our Customers
            </h2>
          </div>
          <Link
            href="/shop?filter=bestseller"
            className="flex items-center gap-2 font-body text-sm font-semibold text-maroon-900 hover:text-saffron-600 transition-colors whitespace-nowrap"
          >
            View all bestsellers <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
