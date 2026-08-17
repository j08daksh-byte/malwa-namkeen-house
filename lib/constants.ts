import type { NavLink, SocialLink } from '@/types/common';

// ─── Site Identity ────────────────────────────────────────────────────────────

export const SITE_NAME = 'Malwa Namkeen House';
export const SITE_TAGLINE = 'The Namkeen & Snacks Hub';
export const SITE_DESCRIPTION =
  'Traditional namkeen and snacks from the heart of Malwa, freshly packed with authentic flavour, crunch and warmth.';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://malwanamkeenhouse.com';
export const SITE_EMAIL = 'hello@malwanamkeenhouse.com';
export const SITE_PHONE = '+91 98765 43210';
export const SITE_WHATSAPP = '919876543210';
export const SITE_ADDRESS = 'Malwa Namkeen House, Indore, Madhya Pradesh — 452001';

// ─── Social Links ─────────────────────────────────────────────────────────────

export const SOCIAL_LINKS: SocialLink[] = [
  { platform: 'Instagram', href: 'https://instagram.com/malwanamkeenhouse', icon: 'instagram' },
  { platform: 'Facebook',  href: 'https://facebook.com/malwanamkeenhouse',  icon: 'facebook' },
  { platform: 'YouTube',   href: 'https://youtube.com/@malwanamkeenhouse',  icon: 'youtube' },
  { platform: 'WhatsApp',  href: `https://wa.me/919876543210`,              icon: 'message-circle' },
];

// ─── Navigation ───────────────────────────────────────────────────────────────

export const MAIN_NAV: NavLink[] = [
  { label: 'Home',    href: '/' },
  { label: 'Shop',    href: '/shop' },
  {
    label: 'Categories',
    href: '/categories',
    children: [
      { label: 'Sev',               href: '/categories/sev' },
      { label: 'Bhujia',            href: '/categories/bhujia' },
      { label: 'Mixture',           href: '/categories/mixture' },
      { label: 'Dalmoth',           href: '/categories/dalmoth' },
      { label: 'Peanuts',           href: '/categories/peanuts' },
      { label: 'Traditional Snacks',href: '/categories/traditional-snacks' },
      { label: 'Sweets',            href: '/categories/sweets' },
      { label: 'Combos',            href: '/combos' },
    ],
  },
  { label: 'Offers',  href: '/offers' },
  { label: 'About',   href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER_LINKS = {
  shop: [
    { label: 'All Products',     href: '/shop' },
    { label: 'Bestsellers',      href: '/shop?filter=bestseller' },
    { label: 'New Arrivals',     href: '/shop?filter=new' },
    { label: 'Combo Packs',      href: '/combos' },
    { label: 'Offers & Deals',   href: '/offers' },
  ],
  categories: [
    { label: 'Sev',               href: '/categories/sev' },
    { label: 'Bhujia',            href: '/categories/bhujia' },
    { label: 'Mixture',           href: '/categories/mixture' },
    { label: 'Dalmoth',           href: '/categories/dalmoth' },
    { label: 'Peanuts',           href: '/categories/peanuts' },
    { label: 'Sweets',            href: '/categories/sweets' },
  ],
  support: [
    { label: 'My Account',       href: '/account' },
    { label: 'Track Order',      href: '/account?tab=orders' },
    { label: 'FAQ',              href: '/faq' },
    { label: 'Shipping & Returns', href: '/shipping-returns' },
    { label: 'Contact Us',       href: '/contact' },
    { label: 'WhatsApp Us',      href: `https://wa.me/919876543210` },
  ],
  company: [
    { label: 'About Us',         href: '/about' },
    { label: 'Our Story',        href: '/about#story' },
    { label: 'Privacy Policy',   href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy',    href: '/shipping-returns#refunds' },
  ],
};

// ─── Ecommerce Constants ──────────────────────────────────────────────────────

export const FREE_SHIPPING_THRESHOLD = 499;   // INR
export const SHIPPING_CHARGE = 49;            // INR flat rate below threshold
export const DEFAULT_PAGE_SIZE = 12;
export const CART_STORAGE_KEY  = 'mnh_cart';
export const WISHLIST_STORAGE_KEY = 'mnh_wishlist';

// ─── Announcement Bar Messages ────────────────────────────────────────────────

export const ANNOUNCEMENTS = [
  '🎉 Free shipping on orders above ₹499 | Use code MALWA10 for 10% off',
  '🌿 100% authentic Malwa recipes | Freshly packed daily',
  '📦 Same-day dispatch on orders before 3 PM | Pan-India delivery',
  '⭐ Trusted by 10,000+ happy customers across India',
];

// ─── Trust Strip Items ────────────────────────────────────────────────────────

export const TRUST_ITEMS = [
  { icon: 'package',      label: 'Freshly Packed',      sub: 'Daily fresh batches' },
  { icon: 'award',        label: 'Authentic Taste',      sub: 'Original Malwa recipes' },
  { icon: 'leaf',         label: 'Quality Ingredients',  sub: 'No artificial colours' },
  { icon: 'shield-check', label: 'Hygienically Packed',  sub: 'FSSAI certified' },
];

// ─── Indian States ────────────────────────────────────────────────────────────

export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Puducherry','J&K','Ladakh',
];

// ─── Spice Level Labels ───────────────────────────────────────────────────────

export const SPICE_LEVELS = {
  mild:       { label: 'Mild',       color: 'text-green-600',  emoji: '🌿' },
  medium:     { label: 'Medium',     color: 'text-yellow-600', emoji: '🌶️' },
  hot:        { label: 'Hot',        color: 'text-orange-600', emoji: '🌶️🌶️' },
  'extra-hot':{ label: 'Extra Hot',  color: 'text-red-600',    emoji: '🔥' },
} as const;

// ─── Order Status Labels ──────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS = {
  pending:            { label: 'Order Placed',       color: 'bg-yellow-100 text-yellow-800' },
  confirmed:          { label: 'Confirmed',          color: 'bg-blue-100 text-blue-800' },
  processing:         { label: 'Processing',         color: 'bg-indigo-100 text-indigo-800' },
  shipped:            { label: 'Shipped',            color: 'bg-purple-100 text-purple-800' },
  'out-for-delivery': { label: 'Out for Delivery',  color: 'bg-saffron-100 text-saffron-800' },
  delivered:          { label: 'Delivered',          color: 'bg-green-100 text-green-800' },
  cancelled:          { label: 'Cancelled',          color: 'bg-red-100 text-red-800' },
  refunded:           { label: 'Refunded',           color: 'bg-gray-100 text-gray-800' },
} as const;

// ─── Coupon Codes (dev/demo only) ─────────────────────────────────────────────

export const DEMO_COUPONS = [
  { code: 'MALWA10',  type: 'percentage' as const, value: 10, minOrder: 299  },
  { code: 'FIRST50',  type: 'fixed'      as const, value: 50, minOrder: 499  },
  { code: 'NAMKEEN',  type: 'percentage' as const, value: 15, minOrder: 599  },
];
