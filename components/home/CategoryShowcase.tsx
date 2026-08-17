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
        <div className="text-center mb-12">
          <p className="font-body text-xs font-semibold text-saffron-600 uppercase tracking-[0.2em] mb-3">
            Shop by Category
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-dark-900 leading-tight">
            Something for<br className="hidden sm:block" />{' '}
            <span className="gradient-text">Every Craving</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
          {categories.map((cat, index) => {
            const imgSrc = categoryImages[cat.slug] ?? categoryImages['mixture'];
            const isLarge = index === 0 || index === 5; // Make first and sixth items large

            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className={`group relative overflow-hidden rounded-2xl bg-dark-900 card-lift ${
                  isLarge ? 'sm:col-span-2 sm:row-span-1' : ''
                }`}
                style={{ aspectRatio: isLarge ? '2/1' : '1/1' }}
              >
                {/* Image */}
                <Image
                  src={imgSrc}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover opacity-75 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
                />

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-dark-950/20 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-2xl mb-1 block">{cat.icon}</span>
                      <h3 className="font-display text-lg font-bold text-white leading-tight">
                        {cat.name}
                      </h3>
                      <p className="font-body text-xs text-cream-300 mt-0.5 line-clamp-1">
                        {cat.productCount} products
                      </p>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm group-hover:bg-saffron-500 transition-colors duration-200">
                      <ArrowRight className="h-3.5 w-3.5 text-white" />
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
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-maroon-900 hover:text-saffron-600 transition-colors"
          >
            View all products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
