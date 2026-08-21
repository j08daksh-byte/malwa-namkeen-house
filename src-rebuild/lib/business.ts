/**
 * Frontend business configuration — single source of truth for brand constants.
 * Mirrors server/config.ts but importable from React components.
 */

export const BUSINESS = {
  name:    'MALWA NAMKEEN HOUSE',
  tagline: 'THE NAMKEEN & SNACKS HUB',
  email:   'malwanamkeenhouse@gmail.com',
  phone:   '+91 7987732765',
  whatsappNumber: '917987732765',
  gstNumber:   '29AQWPP5638F2ZO',
  fssaiNumber: '11225302002687',
  address: {
    line1:      'No. 87/4-B, Sulikunte Village',
    line2:      'Sarjapur Main Road, Dommasandra Post',
    city:       'Bengaluru',
    state:      'Karnataka',
    postalCode: '562125',
    country:    'India',
    full:       'No. 87/4-B, Sulikunte Village, Sarjapur Main Road, Dommasandra Post, Bengaluru – 562125, Karnataka, India',
  },
  hours: [
    { days: 'Monday – Thursday', open: '9:00 AM', close: '10:30 PM' },
    { days: 'Friday',            open: '9:00 AM', close: '11:00 PM' },
    { days: 'Saturday – Sunday', open: '8:30 AM', close: '11:00 PM' },
  ],
  /**
   * Google Maps link — pending client verification.
   * Replace with the verified live URL when available.
   * The address is correct; only the map URL is unverified.
   */
  mapsUrl: null as string | null,
} as const;
