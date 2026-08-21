/**
 * Centralized business configuration for Malwa Namkeen House.
 * All brand constants live here — never scatter them across components or routes.
 */

export const BUSINESS = {
  name:        'MALWA NAMKEEN HOUSE',
  tagline:     'THE NAMKEEN & SNACKS HUB',
  email:       'contact@malwanamkeen.com',
  phone:       '+91 7987732765',
  whatsappNumber: '917987732765',
  address: {
    line1:      'No. 87/4-B, Sulikunte Village',
    line2:      'Sarjapur Main Road, Dommasandra Post',
    city:       'Bengaluru',
    state:      'Karnataka',
    postalCode: '562125',
    country:    'India',
    full:       'No. 87/4-B, Sulikunte Village, Sarjapur Main Road, Dommasandra Post, Bengaluru – 562125',
  },
  gstNumber:   '29AQWPP5638F2ZO',
  fssaiNumber: '11225302002687',
  businessHours: [
    { days: 'Monday – Thursday', open: '9:00 AM', close: '10:30 PM' },
    { days: 'Friday',            open: '9:00 AM', close: '11:00 PM' },
    { days: 'Saturday – Sunday', open: '8:30 AM', close: '11:00 PM' },
  ],
  defaultLocationId: 'bengaluru-sarjapur',
} as const;

/** Google Maps URL — set via env var; falls back to '#' until client provides the live link. */
export const GOOGLE_MAPS_URL = process.env.GOOGLE_MAPS_URL ?? '#';

// ── Enquiry categories ──────────────────────────────────────────────────────

export const ENQUIRY_CATEGORIES = [
  { value: 'general_enquiry',          label: 'General Enquiries'         },
  { value: 'catering',                 label: 'Catering'                   },
  { value: 'bulk_orders',              label: 'Bulk Orders'                },
  { value: 'corporate_gifting',        label: 'Corporate Gifting'          },
  { value: 'birthday_parties_events',  label: 'Birthday Parties & Events'  },
] as const;

export type EnquiryCategory = typeof ENQUIRY_CATEGORIES[number]['value'];

export const VALID_CATEGORIES: string[] = ENQUIRY_CATEGORIES.map(c => c.value);

// ── Location IDs ────────────────────────────────────────────────────────────

export const VALID_LOCATION_IDS: string[] = ['bengaluru-sarjapur'];

// ── Reservation statuses (server-assigned, never trusted from client) ───────

export const RESERVATION_STATUSES = [
  'new', 'contacted', 'confirmed', 'declined',
  'cancelled', 'completed', 'no_show',
] as const;

export type ReservationStatus = typeof RESERVATION_STATUSES[number];

// ── Contact statuses ────────────────────────────────────────────────────────

export const CONTACT_STATUSES = ['new', 'in_progress', 'resolved', 'closed', 'spam'] as const;
export type ContactStatus = typeof CONTACT_STATUSES[number];
