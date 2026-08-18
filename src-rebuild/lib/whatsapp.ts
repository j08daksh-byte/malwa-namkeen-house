/**
 * Frontend WhatsApp deep-link utilities.
 * All URLs use wa.me/ click-to-chat — no Meta API credentials required.
 */

const WA_NUMBER = '919035056691';
const BASE      = `https://wa.me/${WA_NUMBER}`;

export function buildWaUrl(message: string): string {
  return `${BASE}?text=${encodeURIComponent(message)}`;
}

export const WA_URLS = {
  general:    buildWaUrl('Hello, I have a question about MishtiChaat.'),
  reservation:buildWaUrl('Hello, I would like to follow up on my reservation enquiry at MishtiChaat.'),
  catering:   buildWaUrl('Hello, I would like to enquire about catering services at MishtiChaat.'),
  gifting:    buildWaUrl('Hello, I would like to enquire about gifting options at MishtiChaat.'),
  birthday:   buildWaUrl('Hello, I would like to enquire about a birthday party at MishtiChaat.'),
  bulkOrders: buildWaUrl('Hello, I would like to place a bulk order with MishtiChaat.'),
  corporate:  buildWaUrl('Hello, I would like to enquire about corporate gifting at MishtiChaat.'),
} as const;

export const CATEGORY_WA_URLS: Record<string, string> = {
  general_enquiry:          WA_URLS.general,
  catering:                 WA_URLS.catering,
  bulk_orders:              WA_URLS.bulkOrders,
  corporate_gifting:        WA_URLS.corporate,
  birthday_parties_events:  WA_URLS.birthday,
};
