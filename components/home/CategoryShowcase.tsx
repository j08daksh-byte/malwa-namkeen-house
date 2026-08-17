import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getFeaturedCategories } from '@/data/categories';

const categoryImages: Record<string, string> = {
  sev:                'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  bhujia:             'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=80',
  mixture:            'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
  dalmoth:            'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80',
  'traditional-snacks': 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&q=80',
  combos:             'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
};

export function CategoryShowcase() {
  const categories = getFeaturedCategories();

  return (
    <section className="section-padding bg-cream-100" aria-label="Shop by category">
      <div className="container-brand">
        {/* Heading */}
        <div className="text-center mb-10">
          <p className="font-body text-xs font-semibold text-dark-600 uppercase tracking-[0.2em] mb-3">
            Shop by Category
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 leading-tight">
            Something for Every Craving
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
          {categories.map((cat) => {
            const imgSrc = categoryImages[cat.slug] ?? categoryImages['mixture'];

            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group relative overflow-hidden rounded-xl bg-dark-900 aspect-[4/5]"
              >
                {/* Image */}
                <Image
                  src={imgSrc}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110 opacity-80"
                />

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-xl mb-1.5 block opacity-90">{cat.icon}</span>
                      <h3 className="font-display text-base sm:text-lg font-bold text-cream-50 leading-tight">
                        {cat.name}
                      </h3>
                      <p className="font-body text-[11px] text-cream-200 mt-1 opacity-80">
                        {cat.productCount} products
                      </p>
                    </div>
                    <div className="opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <ArrowRight className="h-4 w-4 text-cream-50" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All */}
        <div className="text-center mt-10">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 font-body text-[13px] font-medium text-dark-900 hover:text-maroon-900 transition-colors uppercase tracking-wider"
          >
            View all products <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
