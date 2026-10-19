/**
 * Centralized product image resolution & fallback utility for Malwa Namkeen House.
 * Ensures no product or category card ever shows wide hero banners or obsolete dummy paths.
 */

export const PRODUCT_AUTHENTIC_IMAGES: Record<string, string> = {
  'ratlami-sev-special': '/products/ratlami-sev.jpg',
  'ujjaini-sev-classic': '/products/ujjaini-sev.jpg',
  'laung-sev-teekha': '/products/laung-sev.jpg',
  'indori-khatta-meetha': '/products/khatta-meetha.jpg',
  'royal-kaju-dalmoth': '/products/kaju-dalmoth.jpg',
  'heeng-jeera-sev': '/products/hing-sev.jpg',
  'flaky-methi-mathri': '/products/methi-mathri.jpg',
  'chana-zor-garam-spiced': '/products/chana-zor-garam.jpg',
  'shahi-besan-ladoo': '/products/besan-ladoo.jpg',
  'saffron-rabdi-jalebi-pack': '/products/saffron-jalebi.jpg',
  'royal-malwa-hamper': '/products/gift-hamper.jpg',
  'chaat-lover-box': '/products/chaat-kit.jpg',
  'falahari-potato-mixture': '/products/falahari-chivda.jpg',
  'festive-mithai-box-trio': '/products/besan-ladoo.jpg',
};

export const CATEGORY_AUTHENTIC_IMAGES: Record<string, string> = {
  all: '/products/ratlami-sev.jpg',
  'sev-namkeen': '/products/ratlami-sev.jpg',
  'mixtures-chivda': '/products/khatta-meetha.jpg',
  'khasta-mathri': '/products/methi-mathri.jpg',
  'mithai-sweets': '/products/besan-ladoo.jpg',
  'gift-hampers': '/products/gift-hamper.jpg',
  'falahari-fasting': '/products/falahari-chivda.jpg',
};

export const DEFAULT_FALLBACK_IMAGE = '/products/ratlami-sev.jpg';

/**
 * Checks if a candidate image URL is valid and not a wide hero banner or broken dummy path.
 */
export function isValidProductImage(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.includes('/hero-banner-')) return false;
  if (trimmed.includes('/mishtichaat/')) return false;
  return true;
}

/**
 * Resolves the primary authentic square photograph for any product.
 */
export function resolveProductImage(product?: {
  id?: string;
  _id?: string;
  slug?: string;
  image?: string;
  images?: string[];
  category?: string;
} | null): string {
  if (!product) return DEFAULT_FALLBACK_IMAGE;

  // 1. Direct match by slug or ID in authentic image map
  const key = (product.slug || product.id || product._id || '').toLowerCase();
  if (PRODUCT_AUTHENTIC_IMAGES[key]) {
    return PRODUCT_AUTHENTIC_IMAGES[key];
  }

  // 2. If product has a valid non-banner image
  if (isValidProductImage(product.image)) {
    return product.image!.trim();
  }

  // 3. If product has valid images array
  if (Array.isArray(product.images)) {
    const valid = product.images.find(isValidProductImage);
    if (valid) return valid.trim();
  }

  // 4. Fallback by category
  if (product.category && CATEGORY_AUTHENTIC_IMAGES[product.category]) {
    return CATEGORY_AUTHENTIC_IMAGES[product.category];
  }

  return DEFAULT_FALLBACK_IMAGE;
}

/**
 * Resolves full gallery array for product detail pages, ensuring no banner images are included.
 */
export function resolveProductImages(product?: {
  id?: string;
  _id?: string;
  slug?: string;
  image?: string;
  images?: string[];
  category?: string;
} | null): string[] {
  if (!product) return [DEFAULT_FALLBACK_IMAGE];

  const primary = resolveProductImage(product);
  const list: string[] = [];

  if (Array.isArray(product.images) && product.images.length > 0) {
    for (const img of product.images) {
      if (isValidProductImage(img) && !list.includes(img)) {
        list.push(img);
      }
    }
  }

  if (list.length === 0) {
    list.push(primary);
  } else if (!list.includes(primary)) {
    list.unshift(primary);
  }

  return list;
}
