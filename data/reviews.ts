import type { Review } from '@/types/common';

export const reviews: Review[] = [
  {
    id: 'rev-01',
    productId: 'prod-01',
    author: 'Priya Sharma',
    avatar: undefined,
    location: 'Bhopal, MP',
    rating: 5,
    title: 'Tastes exactly like the Indore market sev!',
    body: 'I grew up in Indore and have been searching for authentic Ratlami Sev for years. This is it. The spice level, the texture, the deep flavour — all perfect. My husband and kids finished the 500g bag in two days. Already ordered again.',
    verified: true,
    helpful: 34,
    createdAt: '2024-11-12T00:00:00Z',
  },
  {
    id: 'rev-02',
    productId: 'prod-04',
    author: 'Rahul Verma',
    avatar: undefined,
    location: 'Mumbai, MH',
    rating: 5,
    title: 'The ONLY bhujia I\'ll ever eat again',
    body: 'Tried so many bhujia brands in Mumbai — nothing came close. One bite of this and I was transported back to my dadi\'s kitchen in Ujjain. The freshness is unreal. Packaging is also excellent, arrived perfectly crisp.',
    verified: true,
    helpful: 51,
    createdAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'rev-03',
    productId: 'prod-06',
    author: 'Kavita Joshi',
    avatar: undefined,
    location: 'Delhi, NCR',
    rating: 5,
    title: 'Gifted this to my whole office — everyone loved it',
    body: 'Ordered the Indori Mixture as a Diwali gift for my team. Everyone asked where I got it from. The freshness, the balance of flavours, the beautiful packaging — it felt like a premium gift. Will definitely order again for Holi.',
    verified: true,
    helpful: 28,
    createdAt: '2025-01-03T00:00:00Z',
  },
  {
    id: 'rev-04',
    productId: 'prod-11',
    author: 'Arjun Mehta',
    avatar: undefined,
    location: 'Bangalore, KA',
    rating: 5,
    title: 'Perfect starter pack — tried all 4, loved all 4',
    body: 'Ordered the Malwa Starter Pack as my first order. Incredible value. All four products were fresh, well-spiced and exactly as described. The Ratlami Sev and Dalmoth were my favourites. Subscription ordered!',
    verified: true,
    helpful: 43,
    createdAt: '2025-01-18T00:00:00Z',
  },
  {
    id: 'rev-05',
    productId: 'prod-08',
    author: 'Meera Patel',
    avatar: undefined,
    location: 'Ahmedabad, GJ',
    rating: 4,
    title: 'Authentic Dalmoth — just like home',
    body: 'The Classic Dalmoth reminds me of my maasi\'s house in Indore. Fresh, perfectly spiced, generous portion of cashews. My only wish was that it had slightly more black pepper, but that is a personal preference. Would still give 5 stars for authenticity.',
    verified: true,
    helpful: 19,
    createdAt: '2025-02-05T00:00:00Z',
  },
  {
    id: 'rev-06',
    productId: 'prod-09',
    author: 'Vikram Nair',
    avatar: undefined,
    location: 'Pune, MH',
    rating: 5,
    title: 'Best masala peanuts I have ever had. Period.',
    body: 'The coating is thick and crunchy, the spice blend is brilliant — amchur gives it a beautiful tang and the chaat masala is not overdone. Ate the entire 500g bag while watching cricket. No regrets. Ordering more.',
    verified: true,
    helpful: 37,
    createdAt: '2025-02-12T00:00:00Z',
  },
];

// Global review summary
export const globalRating = {
  average: 4.9,
  total: 10000,
  distribution: {
    5: 87,  // percent
    4: 10,
    3: 2,
    2: 0.5,
    1: 0.5,
  },
};

export function getProductReviews(productId: string): Review[] {
  return reviews.filter((r) => r.productId === productId);
}

export function getHomepageReviews(): Review[] {
  return reviews.slice(0, 4);
}
