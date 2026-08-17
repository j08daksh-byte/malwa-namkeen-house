import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import { products } from '@/data/products';
import { categories } from '@/data/categories';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Shop All Namkeen & Snacks | ${SITE_NAME}`,
  description:
    'Browse our complete range of authentic Malwa namkeen — Ratlami Sev, Bhujia, Mixture, Dalmoth, Peanuts and more. Fresh, premium, delivered pan-India.',
};

const sortOptions = [
  { value: 'featured',    label: 'Featured' },
  { value: 'bestseller',  label: 'Bestsellers' },
  { value: 'price-asc',   label: 'Price: Low to High' },
  { value: 'price-desc',  label: 'Price: High to Low' },
  { value: 'rating',      label: 'Highest Rated' },
];

interface ShopPageProps {
  searchParams: Promise<{ category?: string; sort?: string; filter?: string; q?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const { category: categoryFilter, sort = 'featured', filter, q } = params;

  // Filter products
  let filtered = [...products];

  if (categoryFilter) {
    filtered = filtered.filter((p) => p.categorySlug === categoryFilter);
  }

  if (filter === 'bestseller') {
    filtered = filtered.filter((p) => p.bestseller);
  }

  if (filter === 'new') {
    filtered = filtered.filter((p) => p.badges.includes('new'));
  }

  if (q) {
    const query = q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query)) ||
        p.categoryName.toLowerCase().includes(query)
    );
  }

  // Sort
  if (sort === 'price-asc') {
    filtered.sort((a, b) => a.weights[0].price - b.weights[0].price);
  } else if (sort === 'price-desc') {
    filtered.sort((a, b) => b.weights[0].price - a.weights[0].price);
  } else if (sort === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'bestseller') {
    filtered.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
  }

  const activeCategory = categories.find((c) => c.slug === categoryFilter);

  return (
    <div className="bg-cream-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-cream-200">
        <div className="container-brand py-8">
          <Breadcrumbs
            items={[
              { label: 'Shop', href: '/shop' },
              ...(activeCategory ? [{ label: activeCategory.name }] : []),
            ]}
            className="mb-4"
          />
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-dark-900">
                {activeCategory ? activeCategory.name : q ? `Search: "${q}"` : 'All Products'}
              </h1>
              {activeCategory && (
                <p className="font-body text-dark-500 mt-2 max-w-xl">
                  {activeCategory.shortDescription}
                </p>
              )}
            </div>
            <p className="font-body text-sm text-dark-400 whitespace-nowrap">
              {filtered.length} products
            </p>
          </div>
        </div>
      </div>

      <div className="container-brand py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-cream-200 p-6 space-y-7 sticky top-24">
              {/* Categories */}
              <div>
                <h3 className="font-display text-sm font-bold text-dark-900 mb-3 uppercase tracking-wide">
                  Category
                </h3>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/shop"
                      className={`block px-3 py-2 rounded-lg font-body text-sm transition-colors ${
                        !categoryFilter
                          ? 'bg-maroon-50 text-maroon-900 font-semibold'
                          : 'text-dark-600 hover:bg-cream-100'
                      }`}
                    >
                      All Products
                    </Link>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/shop?category=${cat.slug}`}
                        className={`block px-3 py-2 rounded-lg font-body text-sm transition-colors ${
                          categoryFilter === cat.slug
                            ? 'bg-maroon-50 text-maroon-900 font-semibold'
                            : 'text-dark-600 hover:bg-cream-100'
                        }`}
                      >
                        {cat.name}
                        <span className="ml-auto text-xs text-dark-400 float-right">
                          {products.filter((p) => p.categorySlug === cat.slug).length}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Filters */}
              <div>
                <h3 className="font-display text-sm font-bold text-dark-900 mb-3 uppercase tracking-wide">
                  Filter
                </h3>
                <ul className="space-y-1">
                  {[
                    { label: 'Bestsellers', value: 'bestseller' },
                    { label: 'New Arrivals', value: 'new' },
                  ].map((f) => (
                    <li key={f.value}>
                      <Link
                        href={`/shop?filter=${f.value}`}
                        className={`block px-3 py-2 rounded-lg font-body text-sm transition-colors ${
                          filter === f.value
                            ? 'bg-maroon-50 text-maroon-900 font-semibold'
                            : 'text-dark-600 hover:bg-cream-100'
                        }`}
                      >
                        {f.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Sort + Mobile Filter */}
            <div className="flex items-center justify-between mb-6">
              {/* Mobile filter button */}
              <button
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cream-300 bg-white font-body text-sm text-dark-700 hover:border-maroon-900 transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>

              {/* Sort */}
              <select
                className="ml-auto px-4 py-2.5 rounded-xl border border-cream-300 bg-white font-body text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-maroon-900 cursor-pointer"
                defaultValue={sort}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <EmptyState
                emoji="🔍"
                title="No products found"
                description="Try adjusting your filters or search a different keyword."
                action={{ label: 'Clear filters', href: '/shop' }}
              />
            ) : (
              <Suspense fallback={<ProductGridSkeleton />}>
                <ProductGrid products={filtered} columns={3} />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
