// ─── Product Types ────────────────────────────────────────────────────────────

export interface WeightOption {
  value: number;   // grams
  label: string;   // e.g. "250g", "500g", "1 kg"
  price: number;   // INR
  compareAtPrice?: number;
  stock: number;
  sku: string;
}

export type ProductBadge =
  | 'bestseller'
  | 'new'
  | 'sale'
  | 'limited'
  | 'spicy'
  | 'sweet'
  | 'gift'
  | 'combo';

export interface NutritionInfo {
  servingSize: string;
  calories: number;
  totalFat: string;
  saturatedFat?: string;
  carbohydrates: string;
  sugar?: string;
  protein: string;
  sodium: string;
  fiber?: string;
}

export interface ProductHighlight {
  icon: string;
  label: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  images: string[];            // primary image first
  weights: WeightOption[];
  defaultWeight: number;       // grams — the pre-selected weight
  badges: ProductBadge[];
  rating: number;              // 1–5
  reviewCount: number;
  highlights: ProductHighlight[];
  ingredients: string;
  nutrition?: NutritionInfo;
  storage: string;
  shelfLife: string;
  featured: boolean;
  bestseller: boolean;
  isVeg: boolean;
  spiceLevel?: 'mild' | 'medium' | 'hot' | 'extra-hot';
  tags: string[];
  relatedProductIds: string[];
  createdAt: string;
}

// Cart item extends product with selected quantity and weight
export interface CartProduct {
  productId: string;
  name: string;
  slug: string;
  image: string;
  categorySlug: string;
  selectedWeight: WeightOption;
  quantity: number;
}
