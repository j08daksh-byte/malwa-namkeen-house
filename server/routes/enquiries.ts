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
} from '../lib/emailService.ts';

import { getWaUrlForCategory, WA_URLS } from '../lib/whatsapp.ts';
import { ENQUIRY_CATEGORIES } from '../config.ts';
import { connectMongoDB } from '../lib/mongodb.ts';

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

  // Ensure database is available before proceeding
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectMongoDB();
    } catch (dbErr) {
      console.warn('[Enquiries Contact] DB reconnect attempt failed:', dbErr instanceof Error ? dbErr.message : dbErr);
    }
  }

  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: 'Enquiry database temporarily unavailable. Please reach out to us on WhatsApp or try again shortly.',
      whatsappUrl: getWaUrlForCategory(parsed.category),
    });
    return;
  }

  const cleanEmail = parsed.email.trim().toLowerCase();
  const cleanMessage = parsed.message.trim();

  // Deduplication check: prevent duplicate submissions within 2 minutes
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  const existingRecent = await Inquiry.findOne({
    email: cleanEmail,
    message: cleanMessage,
    createdAt: { $gte: twoMinutesAgo },
  });

  if (existingRecent) {
    const refId = existingRecent.referenceId || `MN-ENQ-${existingRecent._id.toString().slice(-6).toUpperCase()}`;
    res.status(200).json({
      success: true,
      duplicate: true,
      message: 'Your enquiry has already been received. Our team will contact you shortly.',
      referenceId: refId,
      inquiryId: existingRecent._id,
      whatsappUrl: getWaUrlForCategory(parsed.category),
      emailDelivered: existingRecent.emailDeliveryStatus === 'sent' || existingRecent.emailDeliveryStatus === 'simulated',
      emailStatus: existingRecent.emailDeliveryStatus || 'pending',
    });
    return;
  }

  const newDocId = new mongoose.Types.ObjectId();
  const referenceId = `MN-ENQ-${newDocId.toString().slice(-6).toUpperCase()}`;

  let doc;
  try {
    doc = await Inquiry.create({
      _id: newDocId,
      name: parsed.name.trim(),
      email: cleanEmail,
      phone: parsed.phone ? parsed.phone.trim() : '',
      category: parsed.category,
      message: cleanMessage,
      status: 'new',
      referenceId,
      emailDeliveryStatus: 'pending',
    });
  } catch (saveErr) {
    console.error('[Contact] MongoDB save error:', saveErr instanceof Error ? saveErr.message : saveErr);
    res.status(503).json({
      success: false,
      message: 'Failed to record your enquiry. Please reach out on WhatsApp or try again shortly.',
      whatsappUrl: getWaUrlForCategory(parsed.category),
    });
    return;
  }

  // Send transactional email notifications with delivery tracking
  const emailData = {
    referenceId,
    customerName: parsed.name,
    customerEmail: cleanEmail,
    phone: parsed.phone ?? '',
    category: parsed.category,
    categoryLabel: categoryLabel(parsed.category),
    message: parsed.message,
    locationId: parsed.location_id,
    submittedAt: isoNow(),
  };

  let emailResult: any = { success: false, provider: 'none', delivered: false };
  try {
    const results = await Promise.allSettled([
      sendContactCustomerEmail(emailData),
      sendContactAdminEmail(emailData),
    ]);

    if (results[0].status === 'fulfilled') {
      emailResult = results[0].value;
    }
  } catch (emailErr) {
    console.warn('[Contact Email Warning] Failed to dispatch contact emails:', emailErr);
  }

  const deliveryStatus = emailResult.simulated
    ? 'simulated'
    : emailResult.delivered
    ? 'sent'
    : emailResult.provider === 'unconfigured'
    ? 'unconfigured'
    : 'failed';

  await Inquiry.findByIdAndUpdate(doc._id, {
    emailDeliveryStatus: deliveryStatus,
    emailError: emailResult.error || null,
    emailDeliveredAt: emailResult.delivered ? new Date() : null,
  });

  res.status(201).json({
    success: true,
    message: emailResult.delivered || emailResult.simulated
      ? 'Your enquiry has been received and confirmed. Our team will contact you shortly.'
      : 'Your enquiry has been safely received and registered. Connect with us on WhatsApp for immediate assistance.',
    referenceId,
    inquiryId: doc._id,
    whatsappUrl: getWaUrlForCategory(parsed.category),
    emailDelivered: Boolean(emailResult.delivered),
    emailStatus: deliveryStatus,
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

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectMongoDB();
    } catch {
      // Handled by readyState check below
    }
  }

  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: 'Enquiry database temporarily unavailable. Please contact us on WhatsApp.',
      whatsappUrl: WA_URLS.catering || 'https://wa.me/917987732765',
    });
    return;
  }

  const summaryMessage = [
    `Requirement: ${parsed.requirement_type}`,
    `Quantity: ${parsed.approx_quantity}`,
    parsed.company_name ? `Company: ${parsed.company_name}` : '',
    parsed.approx_budget ? `Budget: ${parsed.approx_budget}` : '',
    parsed.required_by_date ? `Required By: ${parsed.required_by_date}` : '',
    `Delivery To: ${parsed.delivery_city_pincode}`,
    parsed.message ? `Notes: ${parsed.message}` : '',
  ].filter(Boolean).join(' | ');

  const newDocId = new mongoose.Types.ObjectId();
  const referenceId = `MN-ENQ-${newDocId.toString().slice(-6).toUpperCase()}`;

  let doc;
  try {
    doc = await Inquiry.create({
      _id: newDocId,
      name: parsed.name.trim(),
      email: parsed.email.trim().toLowerCase(),
      phone: parsed.phone ? parsed.phone.trim() : '',
      category: 'bulk_gifting',
      message: summaryMessage,
      status: 'new',
      referenceId,
      emailDeliveryStatus: 'pending',
    });
  } catch (err) {
    console.error('[Bulk Enquiry] MongoDB save error:', err instanceof Error ? err.message : err);
    res.status(503).json({
      success: false,
      message: 'Failed to record your enquiry. Please reach out to us on WhatsApp.',
      whatsappUrl: WA_URLS.catering || 'https://wa.me/917987732765',
    });
    return;
  }

  const emailData = {
    referenceId,
    customerName: parsed.name,
    customerEmail: parsed.email,
    phone: parsed.phone,
    category: 'bulk_gifting',
    categoryLabel: `Bulk & Gifting (${parsed.requirement_type})`,
    message: summaryMessage,
    locationId: 'indore-headquarters',
    submittedAt: isoNow(),
  };

  try {
    await Promise.allSettled([
      sendContactCustomerEmail(emailData),
      sendContactAdminEmail(emailData),
    ]);
  } catch (emailErr) {
    console.warn('[Bulk Enquiry Email Warning]:', emailErr);
  }

  res.status(201).json({
    success: true,
    message: 'Your bulk & corporate gifting enquiry has been received. Our team will contact you with customized rates shortly.',
    referenceId,
    inquiryId: doc._id,
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

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectMongoDB();
    } catch {
      // Handled by readyState check below
    }
  }

  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: 'Reservation service temporarily unavailable. Please connect on WhatsApp.',
      whatsappUrl: WA_URLS.reservation,
    });
    return;
  }

  const newDocId = new mongoose.Types.ObjectId();
  const referenceId = `MN-ENQ-${newDocId.toString().slice(-6).toUpperCase()}`;

  let doc;
  try {
    doc = await Inquiry.create({
      _id: newDocId,
      name: parsed.customer_name.trim(),
      email: parsed.email.trim().toLowerCase(),
      phone: parsed.phone ? parsed.phone.trim() : '',
      category: 'reservation',
      message: parsed.special_request || `Reservation request for ${parsed.guest_count} guests on ${parsed.reservation_date} at ${parsed.preferred_time}`,
      status: 'new',
      referenceId,
      emailDeliveryStatus: 'pending',
    });
  } catch (err) {
    console.error('[Reservation] MongoDB save error:', err instanceof Error ? err.message : err);
    res.status(503).json({
      success: false,
      message: 'Failed to record reservation enquiry. Please WhatsApp us.',
      whatsappUrl: WA_URLS.reservation,
    });
    return;
  }

  const emailData = {
    referenceId,
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

  try {
    await Promise.allSettled([
      sendReservationCustomerEmail(emailData),
      sendReservationAdminEmail(emailData),
    ]);
  } catch (emailErr) {
    console.warn('[Reservation Email Warning]:', emailErr);
  }

  res.status(201).json({
    success: true,
    message: 'Reservation enquiry received. This is not a confirmed booking yet. Our team will contact you to confirm availability.',
    referenceId,
    inquiryId: doc._id,
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

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectMongoDB();
    } catch {
      // Handled by readyState check below
    }
  }

  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: 'Catering enquiry service temporarily unavailable. Please contact us on WhatsApp.',
      whatsappUrl: WA_URLS.catering,
    });
    return;
  }

  const newDocId = new mongoose.Types.ObjectId();
  const referenceId = `MN-ENQ-${newDocId.toString().slice(-6).toUpperCase()}`;

  let doc;
  try {
    doc = await Inquiry.create({
      _id: newDocId,
      name: parsed.name.trim(),
      email: (parsed.email || 'not-provided@customer.local').trim().toLowerCase(),
      phone: parsed.phone ? parsed.phone.trim() : '',
      category: 'catering',
      message: `Event: ${parsed.event_type}, Occasion: ${parsed.occasion || ''}, Guests: ${parsed.guest_count || ''}. Message: ${parsed.message || ''}`,
      status: 'new',
      referenceId,
      emailDeliveryStatus: 'pending',
    });
  } catch (err) {
    console.error('[Katering] MongoDB save error:', err instanceof Error ? err.message : err);
    res.status(503).json({
      success: false,
      message: 'Failed to record catering enquiry. Please WhatsApp us.',
      whatsappUrl: WA_URLS.catering,
    });
    return;
  }

  res.status(201).json({
    success: true,
    message: 'Catering enquiry received. Our events team will reach out within 24 hours.',
    referenceId,
    inquiryId: doc._id,
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

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectMongoDB();
    } catch {
      // Handled by readyState check below
    }
  }

  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: 'Gifting enquiry service temporarily unavailable. Please contact us on WhatsApp.',
      whatsappUrl: WA_URLS.gifting,
    });
    return;
  }

  const newDocId = new mongoose.Types.ObjectId();
  const referenceId = `MN-ENQ-${newDocId.toString().slice(-6).toUpperCase()}`;

  let doc;
  try {
    doc = await Inquiry.create({
      _id: newDocId,
      name: parsed.name.trim(),
      email: (parsed.email || 'not-provided@customer.local').trim().toLowerCase(),
      phone: parsed.phone ? parsed.phone.trim() : '',
      category: 'gifting',
      message: parsed.message || `Gifting inquiry for ${parsed.gift_type}, Quantity: ${parsed.quantity || ''}`,
      status: 'new',
      referenceId,
      emailDeliveryStatus: 'pending',
    });
  } catch (err) {
    console.error('[Gifting] MongoDB save error:', err instanceof Error ? err.message : err);
    res.status(503).json({
      success: false,
      message: 'Failed to record gift enquiry. Please WhatsApp us.',
      whatsappUrl: WA_URLS.gifting,
    });
    return;
  }

  res.status(201).json({
    success: true,
    message: 'Gift enquiry received. We will prepare options for you shortly.',
    referenceId,
    inquiryId: doc._id,
    whatsappUrl: WA_URLS.gifting,
  });
});

export default router;
