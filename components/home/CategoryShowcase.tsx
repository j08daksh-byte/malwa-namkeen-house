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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="section-heading">Curated Selection</span>
              <div className="h-px w-8 bg-saffron-500" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 leading-tight">
              Something for Every Craving
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-maroon-900 hover:text-saffron-600 transition-colors group whitespace-nowrap"
          >
            Explore Full Catalogue <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Asymmetric Editorial Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat, idx) => {
            const imgSrc = categoryImages[cat.slug] ?? categoryImages['mixture'];
            const isFeatured = idx === 0 || idx === 2; // Sev & Mixture featured emphasis

            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className={`group relative overflow-hidden rounded-2xl bg-dark-950 border border-cream-200/50 shadow-card hover:shadow-product transition-all duration-500 ${
                  isFeatured ? 'sm:col-span-2 lg:col-span-1 aspect-[16/11]' : 'aspect-[4/3] sm:aspect-[4/5]'
                }`}
              >
                {/* Image */}
                <Image
                  src={imgSrc}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-105 opacity-85"
                />

                {/* Dark Editorial Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/95 via-dark-950/40 to-transparent opacity-85 group-hover:opacity-90 transition-opacity duration-300" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="font-body text-[11px] font-semibold text-saffron-400 uppercase tracking-widest bg-dark-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-saffron-500/20">
                          {cat.productCount} Items
                        </span>
                      </div>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-cream-50 leading-snug group-hover:text-saffron-400 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="font-body text-xs text-cream-200/80 mt-1 line-clamp-1 font-light max-w-xs">
                        {cat.shortDescription}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shrink-0">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
