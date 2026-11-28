/**
 * WhatsApp utilities.
 *
 * Phase 1 — click-to-chat deep links only.
 * Phase 2 — Meta WhatsApp Business API (stub below; activates when env vars are set).
 */

import { BUSINESS } from '../config.ts';

const BASE = `https://wa.me/${BUSINESS.whatsappNumber}`;

export function buildWhatsAppUrl(message: string): string {
  return `${BASE}?text=${encodeURIComponent(message)}`;
}

/** Pre-built deep-link URLs for each enquiry context. */
export const WA_URLS = {
  general:    buildWhatsAppUrl('Hello, I have a question about Malwa Namkeen House.'),
  reservation:buildWhatsAppUrl('Hello, I would like to follow up on my enquiry at Malwa Namkeen House.'),
  catering:   buildWhatsAppUrl('Hello, I would like to enquire about bulk namkeen & catering services at Malwa Namkeen House.'),
  gifting:    buildWhatsAppUrl('Hello, I would like to enquire about festive gifting options at Malwa Namkeen House.'),
  birthday:   buildWhatsAppUrl('Hello, I would like to enquire about event savouries at Malwa Namkeen House.'),
  bulkOrders: buildWhatsAppUrl('Hello, I would like to place a bulk order with Malwa Namkeen House.'),
  corporate:  buildWhatsAppUrl('Hello, I would like to enquire about corporate gifting at Malwa Namkeen House.'),
} as const;

/** Returns the appropriate WhatsApp URL for a given enquiry category. */
export function getWaUrlForCategory(category: string): string {
  const map: Record<string, string> = {
    general_enquiry:         WA_URLS.general,
    catering:                WA_URLS.catering,
    bulk_orders:             WA_URLS.bulkOrders,
    corporate_gifting:       WA_URLS.corporate,
    birthday_parties_events: WA_URLS.birthday,
  };
  return map[category] ?? WA_URLS.general;
}

// ── Future: Meta WhatsApp Business API stub ─────────────────────────────────

export type WaNotificationResult =
  | { sent: true;  messageId: string }
  | { sent: false; reason: 'not_configured' | 'send_failed'; error?: string };

/**
 * Sends a WhatsApp notification via the Meta Cloud API.
 * If credentials are not configured, returns `not_configured` gracefully —
 * it never throws and never claims success without valid credentials.
 */
export async function sendWhatsAppNotification(
  _toPhone: string,
  _templateName: string,
  _params: Record<string, string>,
): Promise<WaNotificationResult> {
  const phoneId   = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token     = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) {
    return { sent: false, reason: 'not_configured' };
  }

  // TODO: implement Meta Cloud API call when credentials are provided.
  return { sent: false, reason: 'not_configured' };
}
