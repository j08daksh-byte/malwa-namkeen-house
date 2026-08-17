import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, products } from '@/data/products';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SITE_NAME } from '@/lib/constants';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: `Product Not Found | ${SITE_NAME}`,
    };
  }

  return {
    title: `${product.name} — Authentic Malwa Namkeen | ${SITE_NAME}`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} | ${SITE_NAME}`,
      description: product.description,
      images: [
        {
          url: product.images[0],
          alt: product.name,
        },
      ],
    },
  };
}

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-cream-100/60 min-h-screen">
      {/* Top Header / Breadcrumbs Bar */}
      <div className="bg-white border-b border-cream-200/80">
        <div className="container-brand py-4">
          <Breadcrumbs
            items={[
              { label: 'Shop', href: '/shop' },
              { label: product.categoryName, href: `/shop?category=${product.categorySlug}` },
              { label: product.name },
            ]}
          />
        </div>
      </div>

      {/* Main Container */}
      <div className="container-brand py-8 lg:py-12">
        <ProductDetailClient product={product} />
      </div>
    </div>
  );
}
