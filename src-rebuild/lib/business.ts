/**
 * Frontend business configuration — single source of truth for brand constants.
 * Mirrors server/config.ts but importable from React components.
 */

export const BUSINESS = {
  name:    'MALWA NAMKEEN HOUSE',
  tagline: 'THE NAMKEEN & SNACKS HUB',
  email:   'malwanamkeenhouse@gmail.com',
  phone:   '+91 79877 32765',
  whatsappNumber: '917987732765',
  gstNumber:   '29AQWPP5638F2ZO',
  fssaiNumber: '11225302002687',
  address: {
    line1:      'Malwa Namkeen House',
    line2:      'Maksi Rd, Freeganj',
    city:       'Ujjain',
    state:      'Madhya Pradesh',
    postalCode: '456010',
    country:    'India',
    full:       'Malwa Namkeen House, Maksi Rd, Freeganj, Ujjain – 456010, Madhya Pradesh, India',
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
