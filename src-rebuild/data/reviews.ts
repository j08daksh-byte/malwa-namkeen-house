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
    text: 'The kachoris and jalebis are absolutely divine — just like the ones you find in the lanes of Banaras. The kulhad chai is a must-try. Feels like a warm, nostalgic embrace with every bite.',
    source: 'Google Review',
    date: 'June 2025',
  },
  {
    id: 2,
    name: 'Rajan M.',
    rating: 5,
    text: "Tamatar chaat is something I've never tasted anywhere else in Bengaluru. The flavours are bold, authentic and beautifully balanced. The ambience is warm and welcoming.",
    source: 'Google Review',
    date: 'May 2025',
  },
  {
    id: 3,
    name: 'Ananya K.',
    rating: 5,
    text: 'Perfect place for a family breakfast. The Banarasi spread is extensive and everything is freshly made. The staff are warm and attentive. We will definitely be coming back!',
    source: 'Google Review',
    date: 'May 2025',
  },
  {
    id: 4,
    name: 'Vikram T.',
    rating: 4,
    text: 'A delightful hidden gem on Sarjapur Road. The Raj Kachori was outstanding and the thandai had a lovely depth of flavour. Great for a leisurely weekend outing.',
    source: 'Google Review',
    date: 'April 2025',
  },
  {
    id: 5,
    name: 'Amit Sharma',
    rating: 5,
    text: 'Loved the authentic Banarasi flavours and the warm ambience. The chaat felt fresh, rich and different from the usual options in Bengaluru.',
    source: 'Guest Review',
    date: 'June 2025',
  },
  {
    id: 6,
    name: 'Priya Nair',
    rating: 5,
    text: 'The sweets and snacks were beautifully presented, and the service was very welcoming. A lovely place for family visits and gifting orders.',
    source: 'Guest Review',
    date: 'June 2025',
  },
];
