import { Router } from 'express';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

import {
  contactSchema,
  bulkEnquirySchema,
  reservationSchema,
  kateringSchema,
  giftingSchema,
  zodToFieldErrors,
} from '../validate.ts';

import { Inquiry } from '../models/Inquiry.ts';
import {
  sendContactCustomerEmail,
  sendContactAdminEmail,
  sendReservationCustomerEmail,
  sendReservationAdminEmail,
} from '../lib/email.ts';

import { getWaUrlForCategory, WA_URLS } from '../lib/whatsapp.ts';
import { ENQUIRY_CATEGORIES } from '../config.ts';

const router = Router();

// ── Helpers ─────────────────────────────────────────────────────────────────

function categoryLabel(value: string): string {
  return ENQUIRY_CATEGORIES.find(c => c.value === value)?.label ?? value;
}

function isoNow(): string {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) + ' IST';
}

// ── POST /api/contact ────────────────────────────────────────────────────────

router.post('/contact', async (req: Request, res: Response) => {
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

  let id = new mongoose.Types.ObjectId().toString();
  try {
    const doc = await Inquiry.create({
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone ?? '',
      category: parsed.category,
      message: parsed.message,
      status: 'new',
    });
    id = String(doc._id);
  } catch (err) {
    console.error('[Contact] MongoDB save error:', err instanceof Error ? err.message : err);
  }

  // Send transactional email notifications
  const emailData = {
    referenceId: id,
    customerName: parsed.name,
    customerEmail: parsed.email,
    phone: parsed.phone ?? '',
    category: parsed.category,
    categoryLabel: categoryLabel(parsed.category),
    message: parsed.message,
    locationId: parsed.location_id,
    submittedAt: isoNow(),
  };

  Promise.allSettled([
    sendContactCustomerEmail(emailData),
    sendContactAdminEmail(emailData),
  ]).catch(() => {});

  res.json({
    success: true,
    message: 'Your enquiry has been received. Our team will contact you shortly.',
    referenceId: id,
    whatsappUrl: getWaUrlForCategory(parsed.category),
  });
});

// ── POST /api/enquiries/bulk ────────────────────────────────────────────────

router.post(['/enquiries/bulk', '/enquiry/bulk', '/bulk-enquiry'], async (req: Request, res: Response) => {
  if (req.body._hp) {
    res.json({ success: true, message: 'Bulk & gifting enquiry received. Our team will contact you shortly.' });
    return;
  }

  let parsed;
  try {
    parsed = bulkEnquirySchema.parse(req.body);
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

  let id = new mongoose.Types.ObjectId().toString();
  const summaryMessage = [
    `Requirement: ${parsed.requirement_type}`,
    `Quantity: ${parsed.approx_quantity}`,
    parsed.company_name ? `Company: ${parsed.company_name}` : '',
    parsed.approx_budget ? `Budget: ${parsed.approx_budget}` : '',
    parsed.required_by_date ? `Required By: ${parsed.required_by_date}` : '',
    `Delivery To: ${parsed.delivery_city_pincode}`,
    parsed.message ? `Notes: ${parsed.message}` : '',
  ].filter(Boolean).join(' | ');

  try {
    const doc = await Inquiry.create({
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      category: 'bulk_gifting',
      message: summaryMessage,
      status: 'new',
    });
    if (doc) id = String(doc._id);
  } catch (err) {
    console.error('[Bulk Enquiry] MongoDB save error:', err instanceof Error ? err.message : err);
  }

  const emailData = {
    referenceId: id,
    customerName: parsed.name,
    customerEmail: parsed.email,
    phone: parsed.phone,
    category: 'bulk_gifting',
    categoryLabel: `Bulk & Gifting (${parsed.requirement_type})`,
    message: summaryMessage,
    locationId: 'indore-headquarters',
    submittedAt: isoNow(),
  };

  Promise.allSettled([
    sendContactCustomerEmail(emailData),
    sendContactAdminEmail(emailData),
  ]).catch(() => {});

  res.json({
    success: true,
    message: 'Your bulk & corporate gifting enquiry has been received. Our team will contact you with customized rates shortly.',
    referenceId: id,
    whatsappUrl: WA_URLS.catering || 'https://wa.me/917987732765',
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

  let id = new mongoose.Types.ObjectId().toString();
  try {
    const doc = await Inquiry.create({
      name: parsed.customer_name,
      email: parsed.email,
      phone: parsed.phone,
      category: 'reservation',
      message: parsed.special_request || `Reservation request for ${parsed.guest_count} guests on ${parsed.reservation_date} at ${parsed.preferred_time}`,
      status: 'new',
    });
    if (doc) id = String(doc._id);
  } catch (err) {
    console.error('[Reservation] MongoDB save error:', err instanceof Error ? err.message : err);
  }

  const emailData = {
    referenceId: id,
    customerName: parsed.customer_name,
    customerEmail: parsed.email,
    phone: parsed.phone,
    reservationDate: parsed.reservation_date,
    preferredTime: parsed.preferred_time,
    guestCount: parsed.guest_count,
    specialRequest: parsed.special_request ?? '',
    locationId: parsed.location_id,
    submittedAt: isoNow(),
  };

  Promise.allSettled([
    sendReservationCustomerEmail(emailData),
    sendReservationAdminEmail(emailData),
  ]).catch(() => {});

  res.json({
    success: true,
    message: 'Reservation enquiry received. This is not a confirmed booking yet. Our team will contact you to confirm availability.',
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

  let id = new mongoose.Types.ObjectId().toString();
  try {
    const doc = await Inquiry.create({
      name: parsed.name,
      email: parsed.email || 'not-provided@customer.local',
      phone: parsed.phone,
      category: 'catering',
      message: `Event: ${parsed.event_type}, Occasion: ${parsed.occasion || ''}, Guests: ${parsed.guest_count || ''}. Message: ${parsed.message || ''}`,
      status: 'new',
    });
    if (doc) id = String(doc._id);
  } catch (err) {
    console.error('[Katering] MongoDB save error:', err instanceof Error ? err.message : err);
  }

  res.json({
    success: true,
    message: 'Catering enquiry received. Our events team will reach out within 24 hours.',
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

  let id = new mongoose.Types.ObjectId().toString();
  try {
    const doc = await Inquiry.create({
      name: parsed.name,
      email: parsed.email || 'not-provided@customer.local',
      phone: parsed.phone,
      category: 'gifting',
      message: parsed.message || `Gifting inquiry for ${parsed.gift_type}, Quantity: ${parsed.quantity || ''}`,
      status: 'new',
    });
    if (doc) id = String(doc._id);
  } catch (err) {
    console.error('[Gifting] MongoDB save error:', err instanceof Error ? err.message : err);
  }

  res.json({
    success: true,
    message: 'Gift enquiry received. We will prepare options for you shortly.',
    referenceId: id,
    whatsappUrl: WA_URLS.gifting,
  });
});

export default router;
