const V = '?v=4';

export interface CardData {
  image: string;
  subtitle: string;
  title: string;
  description: string;
  ariaLabel: string;
  menuCategory: string;
}

export const CARDS: CardData[] = [
  {
    image: `/mishtichaat/SUBHA-E-BANARAS.png${V}`,
    subtitle: 'SACRED MORNING RITUAL',
    title: 'SUBAH-E-BANARAS',
    description: 'Crisp golden kachoris and saffron syrup jalebis served as a comforting Banarasi morning ritual.',
    ariaLabel: 'Explore Signature Breakfast',
    menuCategory: 'breakfast',
  },
  {
    image: `/mishtichaat/CHAAT-BAZAAR.png${V}`,
    subtitle: 'AUTHENTIC STREET FLAVOURS',
    title: 'SHAM-E-AWADH',
    description: 'Tamatar chaat, pani poori and ghee-churned tikki inspired by the legendary lanes of Banaras.',
    ariaLabel: 'Explore Shaam-E-Awadh Chaat',
    menuCategory: 'chaat',
  },
  {
    image: `/mishtichaat/MEETHI%20GALI.png${V}`,
    subtitle: 'CELEBRATION SWEETS & GIFTING',
    title: 'BANARAS KI MUSKAN',
    description: 'Traditional mithai and pure-ghee delicacies crafted for festivals, gifting and celebrations.',
    ariaLabel: 'Explore Meethi Gali sweets',
    menuCategory: 'sweets',
  },
  {
    image: `/mishtichaat/SIP%20OF%20CHAI.png${V}`,
    subtitle: 'TRADITIONAL BEVERAGES',
    title: 'SIP THE CITY',
    description: 'Kulhad chai, thandai and lassi rooted in comfort, nostalgia and Banarasi hospitality.',
    ariaLabel: 'Explore Beverages & Fusions',
    menuCategory: 'beverages',
  },
  {
    image: `/mishtichaat/DELHI%20MEETS%20BANARAS.png${V}`,
    subtitle: 'SAVOURY FUSION',
    title: "DELHI'S PRIDE BANARAS TWIST",
    description: 'North Indian favourites elevated with the warmth and spices of Banaras.',
    ariaLabel: 'Explore Dilli Meets Banaras',
    menuCategory: 'dilli-banaras',
  },
  {
    image: `/mishtichaat/FAMILY%20FEAST%20THALI.png${V}`,
    subtitle: 'SHARED PLATTERS & BULK ORDERS',
    title: 'PURATAN PARAMPARA',
    description: 'Wholesome thalis and generous meals created for families, gatherings and celebrations.',
    ariaLabel: 'Explore Curated Combos — or enquire for bulk orders',
    menuCategory: 'combos',
  },
];
