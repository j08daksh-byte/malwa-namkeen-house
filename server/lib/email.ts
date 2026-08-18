/**
 * Email service — Resend.
 *
 * Rules:
 * 1. Always save to DB first, then attempt email.
 * 2. Email failure NEVER fails the API response — log and continue.
 * 3. All customer-supplied content is HTML-escaped before rendering.
 * 4. No secrets, stack traces, or provider details reach the customer.
 */

import { Resend } from 'resend';
import { BUSINESS } from '../config.ts';

// ── Client (lazy init) ──────────────────────────────────────────────────────

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

const FROM_EMAIL  = process.env.RESEND_FROM_EMAIL       ?? `no-reply@mishtichaat.com`;
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? BUSINESS.email;

// ── HTML safety ─────────────────────────────────────────────────────────────

function esc(s: unknown): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Shared email chrome ─────────────────────────────────────────────────────

function wrap(title: string, body: string, isDark = false): string {
  const bg   = isDark ? '#3C0815' : '#F6EFE3';
  const card = isDark ? '#4F0A18' : '#FFFDF8';
  const text = isDark ? '#FFF8EC' : '#34211D';
  const muted= isDark ? 'rgba(255,248,236,0.70)' : '#75645C';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${bg};font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:${isDark ? '#3C0815' : '#3C0815'};border-radius:16px 16px 0 0;padding:28px 36px;text-align:center;">
          <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#FFF8EC;letter-spacing:-0.01em;">
            ${esc(BUSINESS.name)}
          </p>
          <p style="margin:4px 0 0;font-size:11px;color:rgba(255,248,236,0.60);letter-spacing:0.18em;text-transform:uppercase;">
            With Love From Banaras
          </p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:${card};border-radius:0 0 16px 16px;padding:36px;color:${text};">
          ${body}
          <!-- Footer -->
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(200,154,61,0.24);">
            <p style="margin:0;font-size:12px;color:${muted};line-height:1.6;">
              ${esc(BUSINESS.name)} · ${esc(BUSINESS.address.full)}<br/>
              <a href="mailto:${esc(BUSINESS.email)}" style="color:#C89A3D;">${esc(BUSINESS.email)}</a> ·
              ${esc(BUSINESS.phone)}
            </p>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#C89A3D;width:140px;vertical-align:top;">${esc(label)}</td>
    <td style="padding:6px 0;font-size:14px;color:#34211D;line-height:1.55;">${esc(value)}</td>
  </tr>`;
}

function dataTable(rows: [string, string][]): string {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;border-collapse:collapse;">
    ${rows.map(([l, v]) => row(l, v)).join('')}
  </table>`;
}

// ── Send helper ─────────────────────────────────────────────────────────────

export type EmailResult =
  | { sent: true;  messageId: string }
  | { sent: false; reason: 'not_configured' | 'send_failed' | 'no_email'; error?: string };

async function send(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const client = getResend();
  if (!client) {
    console.warn('[Email] RESEND_API_KEY not set — email skipped.');
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const { data, error } = await client.emails.send({
      from:    FROM_EMAIL,
      to:      [opts.to],
      subject: opts.subject,
      html:    opts.html,
    });

    if (error || !data?.id) {
      console.error('[Email] Resend error:', error?.message ?? 'no data');
      return { sent: false, reason: 'send_failed', error: error?.message };
    }

    return { sent: true, messageId: data.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[Email] send threw:', msg);
    return { sent: false, reason: 'send_failed', error: msg };
  }
}

// ── Contact emails ──────────────────────────────────────────────────────────

export interface ContactEmailData {
  referenceId:  string;
  customerName: string;
  customerEmail:string;
  phone:        string;
  category:     string;
  categoryLabel:string;
  message:      string;
  locationId:   string;
  submittedAt:  string;
}

export async function sendContactCustomerEmail(d: ContactEmailData): Promise<EmailResult> {
  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;color:#3C0815;">
      Thank you, ${esc(d.customerName)}!
    </h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#5E4940;">
      We have received your enquiry and our team will get back to you shortly.
    </p>
    ${dataTable([
      ['Reference',  d.referenceId],
      ['Category',   d.categoryLabel],
      ['Your Name',  d.customerName],
      ['Your Email', d.customerEmail],
      ['Phone',      d.phone || '—'],
    ])}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#5E4940;">
      <strong>Your message:</strong><br/>
      <span style="color:#75645C;">${esc(d.message)}</span>
    </p>
    <p style="margin:24px 0 0;font-size:14px;line-height:1.65;color:#5E4940;">
      <strong>What happens next?</strong><br/>
      Our team typically responds within one business day. For urgent matters,
      reach us directly at
      <a href="mailto:${esc(BUSINESS.email)}" style="color:#C89A3D;">${esc(BUSINESS.email)}</a>
      or WhatsApp <a href="https://wa.me/${esc(BUSINESS.whatsappNumber)}" style="color:#C89A3D;">${esc(BUSINESS.phone)}</a>.
    </p>`;

  return send({
    to:      d.customerEmail,
    subject: `We received your enquiry — ${BUSINESS.name}`,
    html:    wrap(`Enquiry Received — ${BUSINESS.name}`, body),
  });
}

export async function sendContactAdminEmail(d: ContactEmailData): Promise<EmailResult> {
  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:22px;color:#FFF8EC;">
      New ${esc(d.categoryLabel)} Enquiry
    </h2>
    <p style="margin:0 0 20px;font-size:13px;color:rgba(255,248,236,0.70);">
      Ref: <strong style="color:#F0C74E;">${esc(d.referenceId)}</strong> ·
      ${esc(d.submittedAt)}
    </p>
    ${dataTable([
      ['Reference', d.referenceId],
      ['Category',  d.categoryLabel],
      ['Name',      d.customerName],
      ['Email',     d.customerEmail],
      ['Phone',     d.phone || '—'],
      ['Location',  d.locationId],
    ])}
    <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:rgba(255,248,236,0.85);">
      <strong style="color:#F0C74E;">Message:</strong><br/>
      ${esc(d.message)}
    </p>
    <p style="margin:24px 0 0;">
      <a href="https://wa.me/${esc(BUSINESS.whatsappNumber)}?text=${encodeURIComponent(`Hello ${d.customerName}, thank you for reaching out to MishtiChaat (Ref: ${d.referenceId}). We are happy to assist you!`)}"
         style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;
                padding:10px 22px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        Reply via WhatsApp
      </a>
    </p>`;

  return send({
    to:      ADMIN_EMAIL,
    subject: `[${d.categoryLabel}] ${d.customerName} — ${BUSINESS.name}`,
    html:    wrap(`New Enquiry — ${BUSINESS.name}`, body, true),
  });
}

// ── Reservation emails ──────────────────────────────────────────────────────

export interface ReservationEmailData {
  referenceId:      string;
  customerName:     string;
  customerEmail:    string;
  phone:            string;
  reservationDate:  string;
  preferredTime:    string;
  guestCount:       string | number;
  specialRequest:   string;
  locationId:       string;
  submittedAt:      string;
}

export async function sendReservationCustomerEmail(d: ReservationEmailData): Promise<EmailResult> {
  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;color:#3C0815;">
      Reservation Enquiry Received
    </h2>
    <p style="margin:0 0 6px;font-size:15px;line-height:1.65;color:#5E4940;">
      Thank you, <strong>${esc(d.customerName)}</strong>. We have received your reservation enquiry.
    </p>
    <div style="background:#FFF3CD;border:1px solid #C89A3D;border-radius:10px;padding:14px 18px;margin:18px 0;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#856404;line-height:1.6;">
        ⚠ This is a reservation <em>enquiry</em> — not a confirmed booking.
        Our team will contact you to confirm availability.
      </p>
    </div>
    ${dataTable([
      ['Reference',       d.referenceId],
      ['Name',            d.customerName],
      ['Date Requested',  d.reservationDate],
      ['Preferred Time',  d.preferredTime],
      ['Guests',          String(d.guestCount)],
      ['Special Request', d.specialRequest || '—'],
    ])}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.65;color:#5E4940;">
      <strong>What happens next?</strong><br/>
      Our team will call or message you to confirm your table.
      For same-day enquiries, please also WhatsApp us at
      <a href="https://wa.me/${esc(BUSINESS.whatsappNumber)}" style="color:#C89A3D;">${esc(BUSINESS.phone)}</a>.
    </p>`;

  return send({
    to:      d.customerEmail,
    subject: `Reservation enquiry received — ${BUSINESS.name}`,
    html:    wrap(`Reservation Enquiry — ${BUSINESS.name}`, body),
  });
}

export async function sendReservationAdminEmail(d: ReservationEmailData): Promise<EmailResult> {
  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:22px;color:#FFF8EC;">
      New Reservation Enquiry
    </h2>
    <p style="margin:0 0 20px;font-size:13px;color:rgba(255,248,236,0.70);">
      Ref: <strong style="color:#F0C74E;">${esc(d.referenceId)}</strong> ·
      ${esc(d.submittedAt)}
    </p>
    ${dataTable([
      ['Reference',      d.referenceId],
      ['Name',           d.customerName],
      ['Email',          d.customerEmail],
      ['Phone',          d.phone],
      ['Date',           d.reservationDate],
      ['Time',           d.preferredTime],
      ['Guests',         String(d.guestCount)],
      ['Special Req.',   d.specialRequest || '—'],
      ['Location',       d.locationId],
    ])}
    <p style="margin:24px 0 0;">
      <a href="https://wa.me/${esc(BUSINESS.whatsappNumber.replace(d.phone, ''))}${encodeURIComponent(d.phone.replace(/\D/g, ''))}?text=${encodeURIComponent(`Hello ${d.customerName}, this is MishtiChaat confirming your reservation enquiry (Ref: ${d.referenceId}) for ${d.reservationDate} at ${d.preferredTime}.`)}"
         style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;
                padding:10px 22px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        Reply via WhatsApp
      </a>
    </p>`;

  return send({
    to:      ADMIN_EMAIL,
    subject: `[Reservation] ${d.customerName} · ${d.reservationDate} · ${d.guestCount} guests`,
    html:    wrap(`New Reservation — ${BUSINESS.name}`, body, true),
  });
}

// ── Admin-triggered: reservation confirmed ──────────────────────────────────

interface ReservationConfirmationData {
  referenceId:     string;
  customerName:    string;
  customerEmail:   string;
  phone:           string;
  reservationDate: string;
  preferredTime:   string;
  guestCount:      number;
  specialRequest:  string;
  locationId:      string;
  adminUser:       string;
}

export async function sendReservationConfirmationEmail(d: ReservationConfirmationData): Promise<EmailResult> {
  if (!d.customerEmail) return { sent: false, reason: 'no_email' };

  const body = `
    <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;color:#3A211D;">
      Your Table is Confirmed
    </h2>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#5E4940;">
      Dear ${esc(d.customerName)}, your reservation at <strong>${esc(BUSINESS.name)}</strong> has been confirmed.
    </p>
    ${dataTable([
      ['Reference',      d.referenceId],
      ['Date',           d.reservationDate],
      ['Time',           d.preferredTime],
      ['Guests',         String(d.guestCount)],
      ['Special Request', d.specialRequest || '—'],
      ['Location',       'Sarjapur Road, Bengaluru'],
    ])}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.65;color:#5E4940;">
      We look forward to welcoming you. If you need to cancel or make changes,
      please WhatsApp us at <a href="https://wa.me/${esc(BUSINESS.whatsappNumber)}" style="color:#C89A3D;">${esc(BUSINESS.phone)}</a>
      at least 2 hours in advance.
    </p>`;

  return send({
    to:      d.customerEmail,
    subject: `Reservation Confirmed — ${d.reservationDate} at ${d.preferredTime} · ${BUSINESS.name}`,
    html:    wrap(`Reservation Confirmed — ${BUSINESS.name}`, body),
  });
}
