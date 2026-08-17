import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getBestsellerProducts } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';

export function Bestsellers() {
  const products = getBestsellerProducts().slice(0, 8);

  return (
    <section className="section-padding bg-cream-50/50" aria-label="Bestselling products">
      <div className="container-brand">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8 bg-saffron-600" />
              <p className="font-body text-xs font-semibold text-saffron-700 uppercase tracking-[0.25em]">
                Customer Favourites
              </p>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-dark-900 leading-tight">
              Signature Bestsellers
            </h2>
            <p className="font-body text-sm text-dark-500 font-light mt-3 leading-relaxed">
              Handcrafted daily using heritage recipes from Ratlam and Indore. Seasoned with freshly ground whole spices and fried to crisp perfection.
            </p>
          </div>
          <Link
            href="/shop?filter=bestseller"
            className="group inline-flex items-center gap-2 font-body text-xs font-semibold text-maroon-900 uppercase tracking-widest hover:text-saffron-600 transition-colors whitespace-nowrap"
          >
            <span>Explore All Bestsellers</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

