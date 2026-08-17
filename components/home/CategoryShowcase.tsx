import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getFeaturedCategories } from '@/data/categories';

const categoryImages: Record<string, string> = {
  sev:                  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  bhujia:               'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=80',
  mixture:              'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
  dalmoth:              'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80',
  'traditional-snacks': 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&q=80',
  combos:               'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
};

export function CategoryShowcase() {
  const categories = getFeaturedCategories();

  const sevCategory = categories.find((c) => c.slug === 'sev');
  const mixtureCategory = categories.find((c) => c.slug === 'mixture');
  const bhujiaCategory = categories.find((c) => c.slug === 'bhujia');
  const dalmothCategory = categories.find((c) => c.slug === 'dalmoth');
  const traditionalCategory = categories.find((c) => c.slug === 'traditional-snacks');
  const combosCategory = categories.find((c) => c.slug === 'combos');

  return (
    <section className="section-padding bg-cream-100/60" aria-label="Shop by category">
      <div className="container-brand">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8 bg-saffron-600" />
              <p className="font-body text-xs font-semibold text-saffron-700 uppercase tracking-[0.25em]">
                Curated Collections
              </p>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-dark-900 leading-tight">
              Something for Every Craving
            </h2>
          </div>
          <Link
            href="/categories"
            className="group inline-flex items-center gap-2 font-body text-xs font-semibold text-maroon-900 uppercase tracking-widest hover:text-saffron-600 transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Asymmetrical Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5">
          {/* 1. SEV — Primary Feature Showcase */}
          {sevCategory && (
            <Link
              href={`/categories/${sevCategory.slug}`}
              className="group relative md:col-span-12 lg:col-span-7 min-h-[340px] sm:min-h-[400px] lg:min-h-[440px] rounded-2xl overflow-hidden bg-dark-950 flex flex-col justify-end p-6 sm:p-8 lg:p-10 border border-dark-900/40 shadow-sm"
            >
              <Image
                src={categoryImages['sev']}
                alt={sevCategory.name}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 group-hover:brightness-105 opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-r from-dark-950/80 via-transparent to-transparent hidden sm:block" />

              <div className="relative z-10 max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-500/20 border border-saffron-400/30 backdrop-blur-sm mb-3.5">
                  <span className="text-xs">{sevCategory.icon}</span>
                  <span className="font-body text-[11px] font-semibold text-saffron-300 uppercase tracking-wider">
                    Signature Malwa Staple
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal text-white mb-2 leading-tight">
                  {sevCategory.name}
                </h3>
                <p className="font-body text-xs sm:text-sm text-cream-200/80 line-clamp-2 mb-4 font-light leading-relaxed">
                  {sevCategory.shortDescription}
                </p>
                <div className="inline-flex items-center gap-2 font-body text-xs font-semibold text-white uppercase tracking-wider group-hover:text-saffron-300 transition-colors">
                  <span>Explore {sevCategory.productCount} Varieties</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                </div>
              </div>
            </Link>
          )}

          {/* Top Right Column — Bhujia & Dalmoth */}
          <div className="md:col-span-12 lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5">
            {/* 2. BHUJIA */}
            {bhujiaCategory && (
              <Link
                href={`/categories/${bhujiaCategory.slug}`}
                className="group relative min-h-[200px] sm:min-h-[210px] rounded-2xl overflow-hidden bg-dark-950 flex flex-col justify-end p-6 border border-dark-900/40 shadow-sm"
              >
                <Image
                  src={categoryImages['bhujia']}
                  alt={bhujiaCategory.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                  className="object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:brightness-105 opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-80" />

                <div className="relative z-10">
                  <span className="text-base mb-1 block opacity-90">{bhujiaCategory.icon}</span>
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="font-display text-xl font-medium text-white leading-tight">
                        {bhujiaCategory.name}
                      </h3>
                      <p className="font-body text-xs text-cream-200/70 mt-1 font-light">
                        {bhujiaCategory.productCount} Products
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white group-hover:bg-saffron-500 group-hover:text-dark-950 transition-all duration-300">
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* 3. DALMOTH */}
            {dalmothCategory && (
              <Link
                href={`/categories/${dalmothCategory.slug}`}
                className="group relative min-h-[200px] sm:min-h-[210px] rounded-2xl overflow-hidden bg-dark-950 flex flex-col justify-end p-6 border border-dark-900/40 shadow-sm"
              >
                <Image
                  src={categoryImages['dalmoth']}
                  alt={dalmothCategory.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                  className="object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:brightness-105 opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-80" />

                <div className="relative z-10">
                  <span className="text-base mb-1 block opacity-90">{dalmothCategory.icon}</span>
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="font-display text-xl font-medium text-white leading-tight">
                        {dalmothCategory.name}
                      </h3>
                      <p className="font-body text-xs text-cream-200/70 mt-1 font-light">
                        {dalmothCategory.productCount} Products
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white group-hover:bg-saffron-500 group-hover:text-dark-950 transition-all duration-300">
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Bottom Row — Mixture, Traditional Snacks & Combos */}
          {/* 4. MIXTURE — Secondary Feature Showcase */}
          {mixtureCategory && (
            <Link
              href={`/categories/${mixtureCategory.slug}`}
              className="group relative md:col-span-12 lg:col-span-5 min-h-[260px] sm:min-h-[300px] rounded-2xl overflow-hidden bg-dark-950 flex flex-col justify-end p-6 sm:p-8 border border-dark-900/40 shadow-sm"
            >
              <Image
                src={categoryImages['mixture']}
                alt={mixtureCategory.name}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:brightness-105 opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-80" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-saffron-500/20 border border-saffron-400/30 backdrop-blur-sm mb-2.5">
                  <span className="text-xs">{mixtureCategory.icon}</span>
                  <span className="font-body text-[10px] font-semibold text-saffron-300 uppercase tracking-wider">
                    Festive Medley
                  </span>
                </div>
                <h3 className="font-display text-2xl font-normal text-white mb-1.5 leading-tight">
                  {mixtureCategory.name}
                </h3>
                <p className="font-body text-xs text-cream-200/80 line-clamp-1 mb-3 font-light">
                  {mixtureCategory.shortDescription}
                </p>
                <div className="inline-flex items-center gap-2 font-body text-xs font-semibold text-white uppercase tracking-wider group-hover:text-saffron-300 transition-colors">
                  <span>View {mixtureCategory.productCount} Blends</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          )}

          {/* 5. TRADITIONAL SNACKS */}
          {traditionalCategory && (
            <Link
              href={`/categories/${traditionalCategory.slug}`}
              className="group relative md:col-span-6 lg:col-span-4 min-h-[240px] sm:min-h-[300px] rounded-2xl overflow-hidden bg-dark-950 flex flex-col justify-end p-6 sm:p-7 border border-dark-900/40 shadow-sm"
            >
              <Image
                src={categoryImages['traditional-snacks']}
                alt={traditionalCategory.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:brightness-105 opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-80" />

              <div className="relative z-10">
                <span className="text-base mb-1.5 block opacity-90">{traditionalCategory.icon}</span>
                <h3 className="font-display text-xl font-medium text-white leading-tight">
                  {traditionalCategory.name}
                </h3>
                <p className="font-body text-xs text-cream-200/70 mt-1 font-light">
                  {traditionalCategory.productCount} Heritage Recipes
                </p>
                <div className="mt-3.5 inline-flex items-center gap-1.5 font-body text-xs font-semibold text-saffron-300 group-hover:text-white transition-colors">
                  <span>Shop Snacks</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          )}

          {/* 6. COMBOS */}
          {combosCategory && (
            <Link
              href={`/categories/${combosCategory.slug}`}
              className="group relative md:col-span-6 lg:col-span-3 min-h-[240px] sm:min-h-[300px] rounded-2xl overflow-hidden bg-dark-950 flex flex-col justify-end p-6 sm:p-7 border border-dark-900/40 shadow-sm"
            >
              <Image
                src={categoryImages['combos']}
                alt={combosCategory.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:brightness-105 opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-80" />

              <div className="relative z-10">
                <span className="text-base mb-1.5 block opacity-90">{combosCategory.icon}</span>
                <h3 className="font-display text-xl font-medium text-white leading-tight">
                  {combosCategory.name}
                </h3>
                <p className="font-body text-xs text-cream-200/70 mt-1 font-light">
                  {combosCategory.productCount} Curated Sets
                </p>
                <div className="mt-3.5 inline-flex items-center gap-1.5 font-body text-xs font-semibold text-saffron-300 group-hover:text-white transition-colors">
                  <span>Gift Packs</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
