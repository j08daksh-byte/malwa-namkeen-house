// ─── Category Types ───────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  image: string;
  icon: string;        // emoji or icon name
  featured: boolean;
  productCount: number;
  sortOrder: number;
}
