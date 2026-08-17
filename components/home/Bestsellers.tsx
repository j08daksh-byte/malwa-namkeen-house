import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getBestsellerProducts } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';

export function Bestsellers() {
  const products = getBestsellerProducts().slice(0, 8);

  return (
    <section className="section-padding bg-cream-50/80 border-t border-cream-200/60" aria-label="Bestselling products">
      <div className="container-brand">
        {/* Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="section-heading">Customer Favourites</span>
              <div className="h-px w-8 bg-saffron-500" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 leading-tight">
              Loved by Our Customers
            </h2>
          </div>
          <Link
            href="/shop?filter=bestseller"
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-maroon-900 hover:text-saffron-600 transition-colors group whitespace-nowrap"
          >
            View All Bestsellers <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
