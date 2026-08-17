// ─── Common/Shared Types ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  spiceLevel?: string[];
  badges?: string[];
  inStock?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'bestseller';
  search?: string;
  page?: number;
  limit?: number;
}

export interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
}

export interface Review {
  id: string;
  productId?: string;
  userId?: string;
  author: string;
  avatar?: string;
  location?: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  expiresAt?: string;
  active: boolean;
}

export interface SocialLink {
  platform: string;
  href: string;
  icon: string;
}
