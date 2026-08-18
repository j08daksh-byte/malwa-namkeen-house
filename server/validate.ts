/**
 * Server-side validation using Zod.
 * All schemas validate inbound request bodies.
 *
 * Rules enforced here:
 * - Status is NEVER accepted from the client — server always assigns it.
 * - Past reservation dates are rejected; same-day is allowed.
 * - Honeypot field must be empty (bots fill it; humans never see it).
 * - HTML is never trusted — input is treated as plain text only.
 */

import { z } from 'zod';
import { VALID_CATEGORIES, VALID_LOCATION_IDS } from './config.ts';
import type { FieldError } from './types.ts';

// ── Primitive schemas ───────────────────────────────────────────────────────

const name = z
  .string({ error: 'Name is required.' })
  .min(2, 'Name must be at least 2 characters.')
  .max(120, 'Name is too long.')
  .transform(s => s.trim().replace(/\s+/g, ' '));

const email = z
  .string({ error: 'Email address is required.' })
  .email('Please enter a valid email address.')
  .max(254)
  .transform(s => s.trim().toLowerCase());

const emailOptional = z
  .string()
  .email('Please enter a valid email address.')
  .max(254)
  .transform(s => s.trim().toLowerCase())
  .optional()
  .or(z.literal(''));

const phone = z
  .string({ error: 'Phone number is required.' })
  .min(7, 'Please enter a valid phone number.')
  .max(20, 'Phone number is too long.')
  .transform(s => s.trim().replace(/[^\d\s+\-()]/g, ''));

const phoneOptional = z
  .string()
  .max(20)
  .transform(s => s.trim().replace(/[^\d\s+\-()]/g, ''))
  .optional()
  .or(z.literal(''));

const message = z
  .string({ error: 'Message is required.' })
  .min(10, 'Please provide at least 10 characters so we can understand your enquiry.')
  .max(2000, 'Message is too long (max 2000 characters).')
  .transform(s => s.trim());

const messageOptional = z
  .string()
  .max(2000)
  .transform(s => s.trim())
  .optional()
  .or(z.literal(''));

const consent = z
  .boolean({ error: 'Please accept the terms to proceed.' })
  .refine(v => v === true, { message: 'Please accept the terms to proceed.' });

const locationId = z
  .string()
  .optional()
  .transform(v => v ?? 'bengaluru-sarjapur')
  .refine(v => VALID_LOCATION_IDS.includes(v), { message: 'Invalid location.' });

const honeypot = z
  .string()
  .optional()
  .refine(v => !v || v.trim() === '', { message: 'Submission rejected.' });

// ── Contact schema ──────────────────────────────────────────────────────────

export const contactSchema = z.object({
  name,
  email,
  phone:           phoneOptional,
  category: z
    .string({ error: 'Please select an enquiry category.' })
    .refine(v => VALID_CATEGORIES.includes(v), { message: 'Invalid category.' }),
  message,
  consent_accepted: consent,
  location_id:     locationId,
  _hp:             honeypot,  // honeypot — must be empty
});

export type ContactInput = z.output<typeof contactSchema>;

// ── Reservation schema ──────────────────────────────────────────────────────

export const reservationSchema = z.object({
  customer_name:   name,
  email,
  phone,
  reservation_date: z
    .string({ error: 'Please select a date.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format.')
    .refine(v => {
      // Allow same-day; reject past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(v) >= today;
    }, { message: 'Reservation date cannot be in the past.' }),
  preferred_time: z
    .string({ error: 'Please select a preferred time.' })
    .min(3, 'Please select a preferred time.')
    .max(50),
  guest_count: z
    .union([z.string(), z.number()])
    .transform(v => Number(v))
    .refine(v => Number.isInteger(v) && v >= 1, {
      message: 'Guest count must be at least 1.',
    }),
  special_request: messageOptional,
  consent_accepted: consent,
  location_id:     locationId,
  _hp:             honeypot,
});

export type ReservationInput = z.output<typeof reservationSchema>;

// ── Katering schema ─────────────────────────────────────────────────────────

export const kateringSchema = z.object({
  name,
  email:      emailOptional,
  phone,
  event_type: z
    .string({ error: 'Event type is required.' })
    .min(2)
    .max(120)
    .transform(s => s.trim()),
  occasion:   z.string().max(120).transform(s => s.trim()).optional().or(z.literal('')),
  guest_count: z
    .union([z.string(), z.number()])
    .optional()
    .transform(v => (v != null && v !== '' ? Number(v) : undefined))
    .refine(v => v === undefined || (Number.isInteger(v) && v > 0), {
      message: 'Guest count must be a positive number.',
    }),
  date:            z.string().max(50).optional().or(z.literal('')),
  message:         messageOptional,
  consent_accepted: consent,
  location_id:     locationId,
  _hp:             honeypot,
});

export type KateringInput = z.output<typeof kateringSchema>;

// ── Gifting schema ──────────────────────────────────────────────────────────

export const giftingSchema = z.object({
  name,
  email:     emailOptional,
  phone,
  gift_type: z
    .string({ error: 'Please specify the gift type.' })
    .min(2)
    .max(120)
    .transform(s => s.trim()),
  quantity: z
    .union([z.string(), z.number()])
    .optional()
    .transform(v => (v != null && v !== '' ? Number(v) : undefined))
    .refine(v => v === undefined || (Number.isInteger(v) && v > 0), {
      message: 'Quantity must be a positive number.',
    }),
  message:          messageOptional,
  consent_accepted: consent,
  location_id:      locationId,
  _hp:              honeypot,
});

export type GiftingInput = z.output<typeof giftingSchema>;

// ── Zod → FieldError converter ──────────────────────────────────────────────

export function zodToFieldErrors(err: z.ZodError): FieldError[] {
  return err.issues.map(e => ({
    field:   e.path.join('.') || 'form',
    message: e.message,
  }));
}

// ── Legacy sanitise helpers (kept for backward compat) ─────────────────────

export function sanitizeString(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/\s+/g, ' ').slice(0, 2000);
}

export function sanitizePhone(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[^\d\s+\-()]/g, '').trim().slice(0, 20);
}

export function sanitizeGuests(val: unknown): string {
  if (val === undefined || val === null) return '';
  return sanitizeString(String(val));
}

export function isNonEmpty(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

export function isPositiveNumber(val: unknown): boolean {
  const n = Number(val);
  return Number.isFinite(n) && n > 0;
}
