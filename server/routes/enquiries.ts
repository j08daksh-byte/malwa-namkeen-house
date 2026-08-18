import { Router } from 'express';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

import {
  contactSchema,
  reservationSchema,
  kateringSchema,
  giftingSchema,
  zodToFieldErrors,
  sanitizeString,
  sanitizePhone,
} from '../validate.ts';

import {
  insertContact,
  insertReservation,
  insertKatering,
  insertGifting,
} from '../lib/enquiries.ts';

import {
  sendContactCustomerEmail,
  sendContactAdminEmail,
  sendReservationCustomerEmail,
  sendReservationAdminEmail,
} from '../lib/email.ts';

import { getWaUrlForCategory, WA_URLS } from '../lib/whatsapp.ts';
import { ENQUIRY_CATEGORIES, BUSINESS } from '../config.ts';

const router = Router();

// ── Helpers ─────────────────────────────────────────────────────────────────

function dbConfigError(res: Response) {
  console.error('[MishtiChaat] Supabase env vars not set — check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  res.status(503).json({
    success: false,
    message: 'Service temporarily unavailable. Please contact us via WhatsApp.',
    whatsappUrl: WA_URLS.general,
  });
}

function categoryLabel(value: string): string {
  return ENQUIRY_CATEGORIES.find(c => c.value === value)?.label ?? value;
}

function maskedEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 3)}***@${domain}`;
}

function isoNow(): string {
  return new Date().toLocaleString('en-IN', {
    timeZone:    'Asia/Kolkata',
    day:         '2-digit',
    month:       'short',
    year:        'numeric',
    hour:        '2-digit',
    minute:      '2-digit',
    hour12:      true,
  }) + ' IST';
}

// ── POST /api/contact ────────────────────────────────────────────────────────

router.post('/contact', async (req: Request, res: Response) => {
  // Honeypot: bots fill hidden fields — silently succeed so they don't retry
  if (req.body._hp) {
    res.json({ success: true, message: 'Your enquiry has been received. Our team will contact you shortly.' });
    return;
  }

  let parsed;
  try {
    parsed = contactSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Please check the form and try again.',
        fieldErrors: Object.fromEntries(
          zodToFieldErrors(err).map(e => [e.field, e.message])
        ),
      });
      return;
    }
    throw err;
  }

  const row = {
    name:             parsed.name,
    customer_name:    parsed.name,
    email:            parsed.email,
    phone:            parsed.phone ?? '',
    category:         parsed.category,
    message:          parsed.message,
    occasion:         categoryLabel(parsed.category),
    consent_accepted: parsed.consent_accepted,
    location_id:      parsed.location_id,
    source:           'website',
    status:           'new',
  };

  let id: string;
  try {
    id = await insertContact(row);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('SUPABASE_')) {
      dbConfigError(res); return;
    }
    console.error('[Contact] insert failed:', err instanceof Error ? err.message : err);
    res.status(500).json({
      success: false,
      message: 'Could not save your enquiry. Please try again or reach us via WhatsApp.',
      whatsappUrl: WA_URLS.general,
    });
    return;
  }

  // Send emails — failures do NOT block the success response
  const emailData = {
    referenceId:   id,
    customerName:  parsed.name,
    customerEmail: parsed.email,
    phone:         parsed.phone ?? '',
    category:      parsed.category,
    categoryLabel: categoryLabel(parsed.category),
    message:       parsed.message,
    locationId:    parsed.location_id,
    submittedAt:   isoNow(),
  };

  const [custResult, adminResult] = await Promise.allSettled([
    sendContactCustomerEmail(emailData),
    sendContactAdminEmail(emailData),
  ]);

  if (custResult.status === 'rejected') {
    console.error('[Contact] Customer email error:', custResult.reason);
  }
  if (adminResult.status === 'rejected') {
    console.error('[Contact] Admin email error:', adminResult.reason);
  }

  res.json({
    success:      true,
    message:      'Your enquiry has been received. Our team will contact you shortly.',
    referenceId:  id,
    whatsappUrl:  getWaUrlForCategory(parsed.category),
  });
});

// ── POST /api/reservation ────────────────────────────────────────────────────

router.post('/reservation', async (req: Request, res: Response) => {
  if (req.body._hp) {
    res.json({ success: true, message: 'Reservation enquiry received.' });
    return;
  }

  let parsed;
  try {
    parsed = reservationSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Please check the form and try again.',
        fieldErrors: Object.fromEntries(
          zodToFieldErrors(err).map(e => [e.field, e.message])
        ),
      });
      return;
    }
    throw err;
  }

  const row = {
    name:             parsed.customer_name,
    customer_name:    parsed.customer_name,
    email:            parsed.email,
    phone:            parsed.phone,
    date:             parsed.reservation_date,
    reservation_date: parsed.reservation_date,
    time:             parsed.preferred_time,
    preferred_time:   parsed.preferred_time,
    guests:           String(parsed.guest_count),
    guest_count:      parsed.guest_count,
    notes:            parsed.special_request ?? '',
    special_request:  parsed.special_request ?? '',
    consent_accepted: parsed.consent_accepted,
    location_id:      parsed.location_id,
    source:           'website',
    status:           'new',
  };

  let id: string;
  try {
    id = await insertReservation(row);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('SUPABASE_')) {
      dbConfigError(res); return;
    }
    console.error('[Reservation] insert failed:', err instanceof Error ? err.message : err);
    res.status(500).json({
      success: false,
      message: 'Could not save your reservation. Please try again or WhatsApp us.',
      whatsappUrl: WA_URLS.reservation,
    });
    return;
  }

  const emailData = {
    referenceId:     id,
    customerName:    parsed.customer_name,
    customerEmail:   parsed.email,
    phone:           parsed.phone,
    reservationDate: parsed.reservation_date,
    preferredTime:   parsed.preferred_time,
    guestCount:      parsed.guest_count,
    specialRequest:  parsed.special_request ?? '',
    locationId:      parsed.location_id,
    submittedAt:     isoNow(),
  };

  const [custResult, adminResult] = await Promise.allSettled([
    sendReservationCustomerEmail(emailData),
    sendReservationAdminEmail(emailData),
  ]);

  if (custResult.status === 'rejected') console.error('[Reservation] Customer email error:', custResult.reason);
  if (adminResult.status === 'rejected') console.error('[Reservation] Admin email error:', adminResult.reason);

  res.json({
    success:     true,
    message:     'Reservation enquiry received. This is not a confirmed booking yet. Our team will contact you to confirm availability.',
    referenceId: id,
    whatsappUrl: WA_URLS.reservation,
  });
});

// ── POST /api/katering ───────────────────────────────────────────────────────

router.post('/katering', async (req: Request, res: Response) => {
  if (req.body._hp) {
    res.json({ success: true, message: 'Enquiry received.' });
    return;
  }

  let parsed;
  try {
    parsed = kateringSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Please check the form and try again.',
        fieldErrors: Object.fromEntries(
          zodToFieldErrors(err).map(e => [e.field, e.message])
        ),
      });
      return;
    }
    throw err;
  }

  if (parsed._hp) {
    res.json({ success: true, message: 'Enquiry received.' });
    return;
  }

  const row = {
    name:             parsed.name,
    customer_name:    parsed.name,
    email:            parsed.email ?? '',
    phone:            parsed.phone,
    event_type:       parsed.event_type,
    occasion:         parsed.occasion ?? parsed.event_type,
    guests:           parsed.guest_count != null ? String(parsed.guest_count) : '',
    date:             parsed.date ?? '',
    message:          parsed.message ?? '',
    consent_accepted: parsed.consent_accepted,
    location_id:      parsed.location_id,
    source:           'website',
    status:           'new',
  };

  let id: string;
  try {
    id = await insertKatering(row);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('SUPABASE_')) {
      dbConfigError(res); return;
    }
    console.error('[Katering] insert failed:', err instanceof Error ? err.message : err);
    res.status(500).json({
      success: false,
      message: 'Could not save your enquiry. Please try again.',
      whatsappUrl: WA_URLS.catering,
    });
    return;
  }

  res.json({
    success:     true,
    message:     'Catering enquiry received. Our events team will reach out within 24 hours.',
    referenceId: id,
    whatsappUrl: WA_URLS.catering,
  });
});

// ── POST /api/gifting ────────────────────────────────────────────────────────

router.post('/gifting', async (req: Request, res: Response) => {
  if (req.body._hp) {
    res.json({ success: true, message: 'Enquiry received.' });
    return;
  }

  let parsed;
  try {
    parsed = giftingSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Please check the form and try again.',
        fieldErrors: Object.fromEntries(
          zodToFieldErrors(err).map(e => [e.field, e.message])
        ),
      });
      return;
    }
    throw err;
  }

  if (parsed._hp) {
    res.json({ success: true, message: 'Enquiry received.' });
    return;
  }

  const row = {
    name:             parsed.name,
    customer_name:    parsed.name,
    email:            parsed.email ?? '',
    phone:            parsed.phone,
    gift_type:        parsed.gift_type,
    quantity:         parsed.quantity != null ? String(parsed.quantity) : '',
    message:          parsed.message ?? '',
    consent_accepted: parsed.consent_accepted,
    location_id:      parsed.location_id,
    source:           'website',
    status:           'new',
  };

  let id: string;
  try {
    id = await insertGifting(row);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('SUPABASE_')) {
      dbConfigError(res); return;
    }
    console.error('[Gifting] insert failed:', err instanceof Error ? err.message : err);
    res.status(500).json({
      success: false,
      message: 'Could not save your gifting enquiry. Please try again.',
      whatsappUrl: WA_URLS.gifting,
    });
    return;
  }

  res.json({
    success:     true,
    message:     'Gift enquiry received. We will prepare options for you shortly.',
    referenceId: id,
    whatsappUrl: WA_URLS.gifting,
  });
});

export default router;
