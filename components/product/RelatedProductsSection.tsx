import type { Product } from '@/types/product';
import { getRelatedProducts } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';

interface RelatedProductsSectionProps {
  product: Product;
}

export function RelatedProductsSection({ product }: RelatedProductsSectionProps) {
  const related = getRelatedProducts(product).slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className="space-y-8" aria-label="You may also like">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cream-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-body text-xs font-bold text-saffron-600 uppercase tracking-widest">
              Pairing Suggestions
            </span>
            <div className="h-px w-6 bg-saffron-500" />
          </div>
          <h2 className="font-display text-3xl font-bold text-dark-900">
            You May Also Like
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
        {related.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
}
