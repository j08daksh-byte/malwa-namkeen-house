import type { Product } from '@/types/product';

// ─── Helper to build weight options ──────────────────────────────────────────

function w(grams: number, price: number, compareAt?: number, stock = 50) {
  const label = grams >= 1000 ? `${grams / 1000} kg` : `${grams}g`;
  return {
    value: grams,
    label,
    price,
    compareAtPrice: compareAt,
    stock,
    sku: `SKU-${grams}`,
  };
}

// ─── Products ─────────────────────────────────────────────────────────────────

export const products: Product[] = [
  // ── SEV ──────────────────────────────────────────────────────────────────────
  {
    id: 'prod-01',
    name: 'Ratlami Sev',
    slug: 'ratlami-sev',
    shortDescription: 'The iconic thick sev from Ratlam — bold, spicy, irresistibly crunchy',
    description:
      'Ratlami Sev is the jewel in the crown of Malwa snacking. Made from premium chickpea flour, generously spiced with black pepper, cloves and asafoetida, then fried to a deep golden crunch. This is the sev that started it all — the one Malwais take as a gift when they travel. Thick, robust, bold in flavour and impossible to eat just one handful.',
    categoryId: 'cat-01',
    categoryName: 'Sev',
    categorySlug: 'sev',
    images: [
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=85',
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=85',
    ],
    weights: [w(200, 99), w(500, 219, 249), w(1000, 399, 449)],
    defaultWeight: 500,
    badges: ['bestseller'],
    rating: 4.9,
    reviewCount: 847,
    highlights: [
      { icon: 'flame',   label: 'Extra Bold Spice' },
      { icon: 'leaf',    label: 'No Artificial Colour' },
      { icon: 'clock',   label: '45-Day Shelf Life' },
      { icon: 'award',   label: 'Ratlam Original Recipe' },
    ],
    ingredients:
      'Chickpea flour (besan), refined groundnut oil, salt, black pepper, cloves, asafoetida, red chilli powder, carom seeds (ajwain).',
    nutrition: {
      servingSize: '30g',
      calories: 165,
      totalFat: '9g',
      saturatedFat: '1.5g',
      carbohydrates: '18g',
      sugar: '0.5g',
      protein: '5g',
      sodium: '220mg',
      fiber: '2g',
    },
    storage: 'Store in a cool, dry place. Keep away from sunlight and moisture.',
    shelfLife: '45 days from date of manufacture',
    featured: true,
    bestseller: true,
    isVeg: true,
    spiceLevel: 'hot',
    tags: ['sev', 'ratlami', 'spicy', 'bestseller', 'classic'],
    relatedProductIds: ['prod-02', 'prod-03', 'prod-07'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prod-02',
    name: 'Thin Sev (Patli Sev)',
    slug: 'thin-sev-patli-sev',
    shortDescription: 'Delicately thin, airy sev — perfect for chaat and daily snacking',
    description:
      'Our Patli Sev (thin sev) is the versatile everyday companion of the Malwa kitchen. Fried to an airy lightness, it carries just the right amount of seasoning. Eat it by the handful, crumble it on bhel puri, or top your poha with it — it elevates every dish it touches.',
    categoryId: 'cat-01',
    categoryName: 'Sev',
    categorySlug: 'sev',
    images: [
      'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=85',
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=85',
    ],
    weights: [w(200, 79), w(500, 179, 199), w(1000, 329, 369)],
    defaultWeight: 500,
    badges: ['bestseller'],
    rating: 4.8,
    reviewCount: 612,
    highlights: [
      { icon: 'wind',   label: 'Light & Airy Crunch' },
      { icon: 'utensils', label: 'Perfect for Chaat' },
      { icon: 'leaf',   label: 'Pure Groundnut Oil' },
    ],
    ingredients: 'Chickpea flour (besan), refined groundnut oil, salt, turmeric, cumin, red chilli powder.',
    storage: 'Store in a cool, dry place.',
    shelfLife: '45 days',
    featured: false,
    bestseller: true,
    isVeg: true,
    spiceLevel: 'medium',
    tags: ['sev', 'thin', 'patli', 'chaat', 'light'],
    relatedProductIds: ['prod-01', 'prod-03'],
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'prod-03',
    name: 'Garlic Sev (Lehsuni Sev)',
    slug: 'garlic-sev-lehsuni',
    shortDescription: 'Punchy garlic-infused sev for the bold palate',
    description:
      'For those who love a stronger, more aromatic snack — our Lehsuni Sev (Garlic Sev) is fried with real garlic paste worked into the dough itself, not just a sprinkle on top. The result is a deeply savoury, aromatic crunch that garlic lovers will obsess over.',
    categoryId: 'cat-01',
    categoryName: 'Sev',
    categorySlug: 'sev',
    images: ['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=85'],
    weights: [w(200, 89), w(500, 199)],
    defaultWeight: 500,
    badges: ['new'],
    rating: 4.7,
    reviewCount: 234,
    highlights: [
      { icon: 'zap',  label: 'Real Garlic Paste' },
      { icon: 'leaf', label: 'No Artificial Flavour' },
    ],
    ingredients: 'Chickpea flour, refined groundnut oil, garlic paste, salt, red chilli, coriander powder, carom seeds.',
    storage: 'Store in a cool, dry place.',
    shelfLife: '40 days',
    featured: false,
    bestseller: false,
    isVeg: true,
    spiceLevel: 'hot',
    tags: ['sev', 'garlic', 'lehsuni', 'bold'],
    relatedProductIds: ['prod-01', 'prod-02'],
    createdAt: '2024-03-01T00:00:00Z',
  },
  // ── BHUJIA ───────────────────────────────────────────────────────────────────
  {
    id: 'prod-04',
    name: 'Classic Bhujia',
    slug: 'classic-bhujia',
    shortDescription: 'Fine moth bean noodles fried to an impossibly light golden crunch',
    description:
      'Bhujia is perhaps the most well-known of all Malwa snacks, and our Classic Bhujia stays true to the original. Fine moth bean flour is blended with spices, extruded into hair-thin noodles and fried to a golden perfection. It melts on the tongue and lingers as warmth.',
    categoryId: 'cat-02',
    categoryName: 'Bhujia',
    categorySlug: 'bhujia',
    images: [
      'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=85',
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=85',
    ],
    weights: [w(200, 89), w(500, 199, 219), w(1000, 369, 419)],
    defaultWeight: 500,
    badges: ['bestseller'],
    rating: 4.9,
    reviewCount: 1023,
    highlights: [
      { icon: 'star',  label: 'Our #1 Bestseller' },
      { icon: 'leaf',  label: 'Moth Bean Based' },
      { icon: 'clock', label: '50-Day Shelf Life' },
    ],
    ingredients: 'Moth bean flour (moath), refined groundnut oil, salt, red chilli, black pepper, cumin, coriander.',
    nutrition: {
      servingSize: '30g',
      calories: 155,
      totalFat: '8g',
      saturatedFat: '1g',
      carbohydrates: '17g',
      sugar: '0.5g',
      protein: '6g',
      sodium: '190mg',
      fiber: '3g',
    },
    storage: 'Store in a cool, dry place away from moisture.',
    shelfLife: '50 days',
    featured: true,
    bestseller: true,
    isVeg: true,
    spiceLevel: 'medium',
    tags: ['bhujia', 'classic', 'moth bean', 'bestseller'],
    relatedProductIds: ['prod-01', 'prod-05', 'prod-06'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prod-05',
    name: 'Masala Bhujia',
    slug: 'masala-bhujia',
    shortDescription: 'Bhujia elevated with a bold Malwa masala coating',
    description:
      'All the lightness of our Classic Bhujia, now with an extra kick of Malwa masala. This one is for spice lovers — the masala coating packs extra heat, tanginess from amchur and warmth from garam masala. Addictive from the first bite.',
    categoryId: 'cat-02',
    categoryName: 'Bhujia',
    categorySlug: 'bhujia',
    images: ['https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=85'],
    weights: [w(200, 99), w(500, 219, 249)],
    defaultWeight: 500,
    badges: [],
    rating: 4.7,
    reviewCount: 389,
    highlights: [
      { icon: 'flame', label: 'Extra Masala Coating' },
      { icon: 'leaf',  label: 'Real Spice Blend' },
    ],
    ingredients: 'Moth bean flour, refined groundnut oil, salt, red chilli, garam masala, amchur, cumin, coriander.',
    storage: 'Store in a cool, dry place.',
    shelfLife: '45 days',
    featured: false,
    bestseller: false,
    isVeg: true,
    spiceLevel: 'hot',
    tags: ['bhujia', 'masala', 'spicy'],
    relatedProductIds: ['prod-04', 'prod-01'],
    createdAt: '2024-01-15T00:00:00Z',
  },
  // ── MIXTURE ──────────────────────────────────────────────────────────────────
  {
    id: 'prod-06',
    name: 'Indori Mixture',
    slug: 'indori-mixture',
    shortDescription: 'The legendary Indore mixture — a balanced riot of flavours and textures',
    description:
      'Indori Mixture is a Malwa institution. Our version combines sev, boondi, fried chana dal, peanuts, curry leaves and a house-blend masala into a deeply satisfying, crunchy medley. This is the snack you reach for during chai time, cricket matches, and every hour in between.',
    categoryId: 'cat-03',
    categoryName: 'Mixture',
    categorySlug: 'mixture',
    images: [
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=85',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=85',
    ],
    weights: [w(250, 129), w(500, 229, 259), w(1000, 419, 469)],
    defaultWeight: 500,
    badges: ['bestseller'],
    rating: 4.9,
    reviewCount: 934,
    highlights: [
      { icon: 'layers', label: '8 Ingredients Blend' },
      { icon: 'award',  label: 'Indore Original Recipe' },
      { icon: 'leaf',   label: 'No Preservatives' },
    ],
    ingredients:
      'Chickpea flour sev, boondi, chana dal, peanuts, curry leaves, refined groundnut oil, salt, red chilli, turmeric, mustard seeds.',
    nutrition: {
      servingSize: '40g',
      calories: 210,
      totalFat: '12g',
      saturatedFat: '2g',
      carbohydrates: '22g',
      sugar: '1g',
      protein: '6g',
      sodium: '280mg',
      fiber: '3g',
    },
    storage: 'Store in a cool, dry, airtight container.',
    shelfLife: '60 days',
    featured: true,
    bestseller: true,
    isVeg: true,
    spiceLevel: 'medium',
    tags: ['mixture', 'indori', 'bestseller', 'mixed', 'festive'],
    relatedProductIds: ['prod-07', 'prod-04', 'prod-01'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prod-07',
    name: 'Special Namkeen Mix',
    slug: 'special-namkeen-mix',
    shortDescription: 'Our premium mixture with added cashews, almonds and raisins',
    description:
      'We took our classic Indori Mixture and elevated it. Added premium cashews, roasted almonds, golden raisins and a pinch of saffron-spiced coating. This is the mixture you bring as a gift — and never want to share.',
    categoryId: 'cat-03',
    categoryName: 'Mixture',
    categorySlug: 'mixture',
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=85'],
    weights: [w(250, 179, 199), w(500, 329, 369)],
    defaultWeight: 500,
    badges: ['new', 'gift'],
    rating: 4.8,
    reviewCount: 267,
    highlights: [
      { icon: 'gift',  label: 'Premium Gift Option' },
      { icon: 'star',  label: 'Cashews & Almonds' },
      { icon: 'leaf',  label: 'Pure Ingredients' },
    ],
    ingredients: 'Chickpea flour sev, cashews, almonds, raisins, peanuts, boondi, refined groundnut oil, salt, spices.',
    storage: 'Store in a cool, dry place.',
    shelfLife: '45 days',
    featured: true,
    bestseller: false,
    isVeg: true,
    spiceLevel: 'mild',
    tags: ['mixture', 'premium', 'gift', 'dry fruit', 'special'],
    relatedProductIds: ['prod-06', 'prod-08'],
    createdAt: '2024-02-15T00:00:00Z',
  },
  // ── DALMOTH ──────────────────────────────────────────────────────────────────
  {
    id: 'prod-08',
    name: 'Classic Dalmoth',
    slug: 'classic-dalmoth',
    shortDescription: 'Hearty spiced lentils with nuts — Malwa\'s most satisfying snack',
    description:
      'Classic Dalmoth is the king of Malwa snacks. Whole masoor dal and urad dal are fried to a satisfying crunch, then tossed with cashews, peanuts and a blend of cumin, pepper and amchur. Each mouthful is deeply nourishing, flavourful and completely addictive.',
    categoryId: 'cat-04',
    categoryName: 'Dalmoth',
    categorySlug: 'dalmoth',
    images: [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=85',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=85',
    ],
    weights: [w(250, 149), w(500, 269, 299), w(1000, 499, 549)],
    defaultWeight: 500,
    badges: ['bestseller'],
    rating: 4.8,
    reviewCount: 723,
    highlights: [
      { icon: 'zap',   label: 'Protein Rich' },
      { icon: 'star',  label: 'Cashews & Peanuts' },
      { icon: 'clock', label: '60-Day Shelf Life' },
    ],
    ingredients: 'Masoor dal, urad dal, cashews, peanuts, refined groundnut oil, salt, cumin, red chilli, amchur, black pepper.',
    nutrition: {
      servingSize: '40g',
      calories: 190,
      totalFat: '9g',
      saturatedFat: '1g',
      carbohydrates: '20g',
      sugar: '1g',
      protein: '8g',
      sodium: '250mg',
      fiber: '4g',
    },
    storage: 'Store in a cool, dry, airtight container.',
    shelfLife: '60 days',
    featured: true,
    bestseller: true,
    isVeg: true,
    spiceLevel: 'medium',
    tags: ['dalmoth', 'dal', 'lentil', 'bestseller', 'protein'],
    relatedProductIds: ['prod-06', 'prod-09', 'prod-07'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  // ── PEANUTS ──────────────────────────────────────────────────────────────────
  {
    id: 'prod-09',
    name: 'Masala Peanuts',
    slug: 'masala-peanuts',
    shortDescription: 'Bold masala-coated peanuts — the perfect beer snack and chai companion',
    description:
      'Premium bold peanuts coated in a thick, crunchy masala shell seasoned with red chilli, amchur and chaat masala. These are the peanuts people fight over at the snack bowl. Roasted twice for extra crunch.',
    categoryId: 'cat-05',
    categoryName: 'Peanuts',
    categorySlug: 'peanuts',
    images: ['https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=85'],
    weights: [w(200, 89), w(500, 199, 219)],
    defaultWeight: 500,
    badges: ['bestseller'],
    rating: 4.8,
    reviewCount: 589,
    highlights: [
      { icon: 'zap',   label: 'Double Roasted' },
      { icon: 'flame', label: 'Chaat Masala Coated' },
      { icon: 'leaf',  label: 'No Artificial Coating' },
    ],
    ingredients: 'Peanuts, chickpea flour, refined groundnut oil, salt, red chilli, amchur, chaat masala, cumin.',
    storage: 'Store in a cool, dry place.',
    shelfLife: '60 days',
    featured: false,
    bestseller: true,
    isVeg: true,
    spiceLevel: 'hot',
    tags: ['peanuts', 'masala', 'roasted', 'protein', 'spicy'],
    relatedProductIds: ['prod-08', 'prod-06'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  // ── TRADITIONAL SNACKS ────────────────────────────────────────────────────────
  {
    id: 'prod-10',
    name: 'Mathri',
    slug: 'mathri',
    shortDescription: 'Flaky, crispy wheat crackers — the timeless tea-time companion',
    description:
      'Our Mathri is made the old way — wheat flour kneaded with pure ghee, lightly seasoned and baked until flaky and golden. With a cup of masala chai, it becomes one of life\'s simple joys. A snack that feels like home.',
    categoryId: 'cat-06',
    categoryName: 'Traditional Snacks',
    categorySlug: 'traditional-snacks',
    images: ['https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&q=85'],
    weights: [w(200, 109, 129), w(500, 249, 279)],
    defaultWeight: 200,
    badges: ['new'],
    rating: 4.7,
    reviewCount: 312,
    highlights: [
      { icon: 'heart',  label: 'Made with Pure Ghee' },
      { icon: 'coffee', label: 'Perfect with Chai' },
      { icon: 'leaf',   label: 'No Preservatives' },
    ],
    ingredients: 'Wheat flour, pure ghee, refined groundnut oil, salt, carom seeds (ajwain), black pepper.',
    storage: 'Store in a cool, dry place.',
    shelfLife: '30 days',
    featured: false,
    bestseller: false,
    isVeg: true,
    spiceLevel: 'mild',
    tags: ['mathri', 'traditional', 'wheat', 'ghee', 'baked', 'chai'],
    relatedProductIds: ['prod-06', 'prod-01'],
    createdAt: '2024-04-01T00:00:00Z',
  },
  // ── COMBOS ───────────────────────────────────────────────────────────────────
  {
    id: 'prod-11',
    name: 'Malwa Starter Pack',
    slug: 'malwa-starter-pack',
    shortDescription: 'Try our 4 bestsellers in one curated box — perfect first order',
    description:
      'New to Malwa Namkeen House? Start here. The Malwa Starter Pack contains our four most-loved snacks — Ratlami Sev (200g), Classic Bhujia (200g), Indori Mixture (200g), and Classic Dalmoth (200g) — all beautifully packed in a branded gift box. The perfect introduction to authentic Malwa flavour.',
    categoryId: 'cat-08',
    categoryName: 'Combos',
    categorySlug: 'combos',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85',
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=85',
    ],
    weights: [w(800, 349, 399)],
    defaultWeight: 800,
    badges: ['bestseller', 'gift', 'sale'],
    rating: 4.9,
    reviewCount: 445,
    highlights: [
      { icon: 'gift',   label: '4 Bestsellers' },
      { icon: 'box',    label: 'Branded Gift Box' },
      { icon: 'tag',    label: 'Save ₹50' },
    ],
    ingredients: 'Contains: Ratlami Sev, Classic Bhujia, Indori Mixture, Classic Dalmoth.',
    storage: 'Store in a cool, dry place.',
    shelfLife: '45 days',
    featured: true,
    bestseller: true,
    isVeg: true,
    tags: ['combo', 'gift', 'starter', 'bestseller', 'value'],
    relatedProductIds: ['prod-01', 'prod-04', 'prod-06', 'prod-08'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prod-12',
    name: 'Festive Gift Box (Large)',
    slug: 'festive-gift-box-large',
    shortDescription: 'A premium assortment of 6 namkeen varieties in a decorative box',
    description:
      'Send the taste of Malwa as a gift this festive season. Our Festive Gift Box contains six 200g packs of our most-loved namkeen and sweets, arranged in a premium decorative box with a handwritten gift card. Available personalisation on request.',
    categoryId: 'cat-08',
    categoryName: 'Combos',
    categorySlug: 'combos',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85'],
    weights: [w(1200, 699, 799)],
    defaultWeight: 1200,
    badges: ['gift', 'limited'],
    rating: 4.9,
    reviewCount: 178,
    highlights: [
      { icon: 'gift',   label: '6 Varieties' },
      { icon: 'star',   label: 'Premium Decorative Box' },
      { icon: 'heart',  label: 'Personalised Gift Card' },
    ],
    ingredients: 'Contains: Ratlami Sev, Classic Bhujia, Indori Mixture, Classic Dalmoth, Masala Peanuts, Besan Ladoo.',
    storage: 'Store in a cool, dry place.',
    shelfLife: '40 days',
    featured: true,
    bestseller: false,
    isVeg: true,
    tags: ['combo', 'festive', 'gift', 'diwali', 'holi', 'premium'],
    relatedProductIds: ['prod-11'],
    createdAt: '2024-09-01T00:00:00Z',
  },
];

// ─── Utility Functions ─────────────────────────────────────────────────────────

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function getBestsellerProducts(): Product[] {
  return products.filter((p) => p.bestseller);
}

export function getRelatedProducts(product: Product): Product[] {
  return product.relatedProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.categoryName.toLowerCase().includes(q)
  );
}

export function getDefaultPrice(product: Product): number {
  const weight = product.weights.find((w) => w.value === product.defaultWeight);
  return weight?.price ?? product.weights[0].price;
}

export function getDefaultWeight(product: Product) {
  return (
    product.weights.find((w) => w.value === product.defaultWeight) ?? product.weights[0]
  );
}
