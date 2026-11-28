/**
 * Frontend WhatsApp deep-link utilities.
 * All URLs use wa.me/ click-to-chat — no Meta API credentials required.
 */

const WA_NUMBER = '917987732765';
const BASE      = `https://wa.me/${WA_NUMBER}`;

export function buildWaUrl(message: string): string {
  return `${BASE}?text=${encodeURIComponent(message)}`;
}

export const WA_URLS = {
  general:    buildWaUrl('Hello, I have a question about Malwa Namkeen House.'),
  reservation:buildWaUrl('Hello, I would like to follow up on my order enquiry at Malwa Namkeen House.'),
  catering:   buildWaUrl('Hello, I would like to enquire about bulk namkeen & catering services at Malwa Namkeen House.'),
  gifting:    buildWaUrl('Hello, I would like to enquire about festive gifting options at Malwa Namkeen House.'),
  birthday:   buildWaUrl('Hello, I would like to enquire about event savouries at Malwa Namkeen House.'),
  bulkOrders: buildWaUrl('Hello, I would like to place a bulk order with Malwa Namkeen House.'),
  corporate:  buildWaUrl('Hello, I would like to enquire about corporate gifting at Malwa Namkeen House.'),
} as const;

export const CATEGORY_WA_URLS: Record<string, string> = {
  general_enquiry:          WA_URLS.general,
  catering:                 WA_URLS.catering,
  bulk_orders:              WA_URLS.bulkOrders,
  corporate_gifting:        WA_URLS.corporate,
  birthday_parties_events:  WA_URLS.birthday,
};
