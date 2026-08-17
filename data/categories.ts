import type { Category } from '@/types/category';

export const categories: Category[] = [
  {
    id: 'cat-01',
    name: 'Sev',
    slug: 'sev',
    shortDescription: 'Crispy chickpea flour noodles in classic & spiced varieties',
    description:
      'Our sev is made from the finest chickpea flour, seasoned with authentic Malwa spices and fried to a perfect golden crisp. From the iconic thin Ratlami Sev to the thicker, nuttier varieties — each bite carries the soul of Indore.',
    image: '/images/categories/sev.jpg',
    icon: '🥜',
    featured: true,
    productCount: 8,
    sortOrder: 1,
  },
  {
    id: 'cat-02',
    name: 'Bhujia',
    slug: 'bhujia',
    shortDescription: 'Thin, crunchy moth bean noodles with a savoury Malwa twist',
    description:
      'Fine moth bean flour blended with spices and fried into delicate, crispy strands. Our Bhujia has been a favourite tea-time companion for generations, with its unmistakable crunch and warm, earthy flavour.',
    image: '/images/categories/bhujia.jpg',
    icon: '🌿',
    featured: true,
    productCount: 5,
    sortOrder: 2,
  },
  {
    id: 'cat-03',
    name: 'Mixture',
    slug: 'mixture',
    shortDescription: 'A festive medley of sev, dal, nuts, and spiced bites',
    description:
      'A celebration in every handful — our Mixture blends sev, boondi, fried dal, peanuts, dry fruits and curry leaves into a perfectly balanced, addictive snack. Available in classic, masala and special Indori varieties.',
    image: '/images/categories/mixture.jpg',
    icon: '✨',
    featured: true,
    productCount: 6,
    sortOrder: 3,
  },
  {
    id: 'cat-04',
    name: 'Dalmoth',
    slug: 'dalmoth',
    shortDescription: 'Spiced lentil and nut mix — the pride of Malwa snacking',
    description:
      'Dalmoth is the quintessential Malwa snack — a hearty combination of fried lentils, cashews, almonds, raisins and aromatic spices. Rich, satisfying and impossible to stop eating.',
    image: '/images/categories/dalmoth.jpg',
    icon: '🫘',
    featured: true,
    productCount: 4,
    sortOrder: 4,
  },
  {
    id: 'cat-05',
    name: 'Peanuts',
    slug: 'peanuts',
    shortDescription: 'Roasted and masala peanuts with bold Malwa seasonings',
    description:
      'From simply roasted to heavily spiced — our peanuts are sourced from premium farms and coated or roasted with traditional Malwa spice blends. Perfect as a standalone snack or mixed into chaat.',
    image: '/images/categories/peanuts.jpg',
    icon: '🥜',
    featured: false,
    productCount: 5,
    sortOrder: 5,
  },
  {
    id: 'cat-06',
    name: 'Traditional Snacks',
    slug: 'traditional-snacks',
    shortDescription: 'Papdi, chakli, mathri, and other time-honoured Malwa classics',
    description:
      'A curated selection of traditional Indian snacks made using original family recipes — crisp mathri, flaky papdi, spiral chakli, and more. Each piece is a tribute to Malwa\'s rich snacking culture.',
    image: '/images/categories/traditional-snacks.jpg',
    icon: '🍪',
    featured: true,
    productCount: 7,
    sortOrder: 6,
  },
  {
    id: 'cat-07',
    name: 'Sweets',
    slug: 'sweets',
    shortDescription: 'Traditional Indian mithai made with pure ghee and love',
    description:
      'Balance your namkeen with our selection of traditional Indian sweets — rich Besan Ladoo, soft Gujiya, melt-in-mouth Barfi and festive Petha, all made using authentic recipes and quality ingredients.',
    image: '/images/categories/sweets.jpg',
    icon: '🍬',
    featured: false,
    productCount: 6,
    sortOrder: 7,
  },
  {
    id: 'cat-08',
    name: 'Combos',
    slug: 'combos',
    shortDescription: 'Curated gift packs and value combo sets',
    description:
      'Share the taste of Malwa with our specially curated combo packs — ideal for gifting, festive occasions, or simply stocking up on your favourites. Great value, beautifully packaged.',
    image: '/images/categories/combos.jpg',
    icon: '🎁',
    featured: true,
    productCount: 6,
    sortOrder: 8,
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getFeaturedCategories(): Category[] {
  return categories.filter((c) => c.featured).sort((a, b) => a.sortOrder - b.sortOrder);
}
