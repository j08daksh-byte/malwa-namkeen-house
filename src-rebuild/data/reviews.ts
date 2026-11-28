export interface Review {
  id: number;
  name: string;
  rating: number;   // 1–5
  text: string;
  source?: string;  // e.g. 'Google Review'
  date?: string;    // display string
}

export const REVIEWS: Review[] = [
  {
    id: 1,
    name: 'Priya S.',
    rating: 5,
    text: 'The Ratlami Laung Sev is exceptionally authentic — the sharp clove warmth and fresh crunch in cold-pressed groundnut oil is exactly like the traditional taste in Malwa.',
    source: 'Google Review',
    date: 'June 2025',
  },
  {
    id: 2,
    name: 'Rajesh M.',
    rating: 5,
    text: 'Ordered the Ujjaini Sev and Khatta Meetha mixture for Diwali gifting. The aroma-seal packaging kept everything super crisp and the flavour was adored by all our guests.',
    source: 'Google Review',
    date: 'May 2025',
  },
  {
    id: 3,
    name: 'Ananya K.',
    rating: 5,
    text: 'Authentic stone-ground spices and pure ingredients make a noticeable difference. The Khasta Heeng Mathri is flaky and aromatic. Highly recommended for authentic namkeen lovers!',
    source: 'Google Review',
    date: 'May 2025',
  },
  {
    id: 4,
    name: 'Vikram T.',
    rating: 5,
    text: 'Ordered bulk festive hampers for our office celebration. Prompt delivery, elegant boxes, and freshest namkeens. Outstanding service and quality from Malwa Namkeen House.',
    source: 'Google Review',
    date: 'April 2025',
  },
  {
    id: 5,
    name: 'Amit Sharma',
    rating: 5,
    text: 'Brought back memories of Ujjain street savouries. Zero artificial aftertaste, light on the palate, and crisp texture. Will be ordering regularly through their website.',
    source: 'Guest Review',
    date: 'June 2025',
  },
  {
    id: 6,
    name: 'Pooja Verma',
    rating: 5,
    text: 'The gift boxes were packaged with immense care and arrived fresh nationwide. The signature clove sev and poha chivda are pure perfection.',
    source: 'Guest Review',
    date: 'June 2025',
  },
];
