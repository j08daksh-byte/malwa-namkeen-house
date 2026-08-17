import type { FAQ } from '@/types/common';

export const faqs: FAQ[] = [
  // ── Orders & Delivery ──────────────────────────────────────────────────────
  {
    id: 'faq-01',
    category: 'Orders & Delivery',
    question: 'When will my order be delivered?',
    answer:
      'Orders placed before 3 PM on weekdays are dispatched the same day. Delivery typically takes 3–6 business days depending on your location. You will receive a tracking link via SMS and email once your order is shipped.',
    sortOrder: 1,
  },
  {
    id: 'faq-02',
    category: 'Orders & Delivery',
    question: 'Do you offer free shipping?',
    answer:
      'Yes! We offer free shipping on all orders above ₹499. Orders below ₹499 have a flat shipping charge of ₹49.',
    sortOrder: 2,
  },
  {
    id: 'faq-03',
    category: 'Orders & Delivery',
    question: 'Do you deliver across India?',
    answer:
      'Yes, we deliver to all pin codes across India. Some remote areas may require additional 1–2 days. International shipping is currently not available but coming soon.',
    sortOrder: 3,
  },
  // ── Products & Freshness ──────────────────────────────────────────────────
  {
    id: 'faq-04',
    category: 'Products & Freshness',
    question: 'How fresh is the namkeen when it arrives?',
    answer:
      'We pack to order in most cases. Products are freshly fried and packed within 24–48 hours of your order. Each product clearly mentions its shelf life on the packaging.',
    sortOrder: 4,
  },
  {
    id: 'faq-05',
    category: 'Products & Freshness',
    question: 'What is the shelf life of your products?',
    answer:
      'Shelf life varies by product — typically 30–60 days from the date of manufacture. The exact date is printed on each pack. Store in a cool, dry place and reseal after opening to maintain freshness.',
    sortOrder: 5,
  },
  {
    id: 'faq-06',
    category: 'Products & Freshness',
    question: 'Are your products vegetarian?',
    answer:
      'Yes, all our products are 100% vegetarian. We do not use any meat, egg or animal-derived ingredients. Our sweets are made with pure ghee.',
    sortOrder: 6,
  },
  {
    id: 'faq-07',
    category: 'Products & Freshness',
    question: 'Do you use artificial colours or preservatives?',
    answer:
      'No. We take great pride in using only natural spices, quality oils and no artificial colours or preservatives. Our products carry the FSSAI certification.',
    sortOrder: 7,
  },
  // ── Payments & Offers ──────────────────────────────────────────────────────
  {
    id: 'faq-08',
    category: 'Payments & Offers',
    question: 'What payment methods do you accept?',
    answer:
      'We accept UPI, credit/debit cards, net banking, popular wallets (PhonePe, Paytm, Google Pay), and Cash on Delivery (COD) for orders up to ₹2,000.',
    sortOrder: 8,
  },
  {
    id: 'faq-09',
    category: 'Payments & Offers',
    question: 'How do I apply a coupon code?',
    answer:
      'Enter your coupon code in the "Apply Coupon" field at the cart or checkout step. The discount will be applied automatically if the code is valid for your order.',
    sortOrder: 9,
  },
  // ── Returns & Refunds ──────────────────────────────────────────────────────
  {
    id: 'faq-10',
    category: 'Returns & Refunds',
    question: 'What is your return policy?',
    answer:
      'We accept returns only if the product is damaged, defective or incorrect. Raise a return request within 48 hours of delivery with a photo. Once verified, we will either replace the product or issue a full refund within 5–7 business days.',
    sortOrder: 10,
  },
  {
    id: 'faq-11',
    category: 'Returns & Refunds',
    question: 'Can I cancel my order?',
    answer:
      'Orders can be cancelled within 1 hour of placement. After that, the order may already be in packing. Contact us on WhatsApp immediately and we will do our best to help.',
    sortOrder: 11,
  },
  // ── Gifting ────────────────────────────────────────────────────────────────
  {
    id: 'faq-12',
    category: 'Gifting',
    question: 'Do you offer gift packaging?',
    answer:
      'Yes! Our Combo and Festive Gift Box products come in premium decorative packaging. For custom gift orders (bulk, corporate, or personalised), please contact us on WhatsApp or email.',
    sortOrder: 12,
  },
];

export function getFAQsByCategory(): Record<string, FAQ[]> {
  return faqs.reduce<Record<string, FAQ[]>>((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});
}

export function getHomepageFAQs(): FAQ[] {
  return faqs.slice(0, 6);
}
