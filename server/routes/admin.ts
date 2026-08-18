/**
 * Admin API routes — all protected by requireAdmin middleware.
 * All data access uses the service role key (server-only).
 * No customer data is ever exposed without a valid admin session.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAdmin, requireAdminRole } from '../lib/adminAuth.ts';
import { getSupabase } from '../lib/supabase.ts';
import { sendReservationConfirmationEmail } from '../lib/email.ts';
import { BUSINESS } from '../config.ts';

const router = Router();

// All admin routes require a valid admin session
router.use(requireAdmin);

// ─── GET /api/admin/me ────────────────────────────────────────────────────────

router.get('/me', (req: Request, res: Response) => {
  res.json({ success: true, admin: res.locals.adminUser });
});

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────

router.get('/dashboard', async (req: Request, res: Response) => {
  const { range = '30d' } = req.query as { range?: string };
  const db = getSupabase();

  const since = rangeToDate(range);

  try {
    const [contacts, reservations, recentContacts, recentReservations] = await Promise.all([
      // Contact enquiry stats
      db.from('contact_enquiries').select('status, category, created_at').gte('created_at', since),
      // Reservation stats
      db.from('reservation_enquiries').select('status, created_at').gte('created_at', since),
      // Recent contact enquiries (last 10)
      db.from('contact_enquiries')
        .select('id, name, customer_name, category, status, created_at, message')
        .order('created_at', { ascending: false }).limit(10),
      // Recent reservations (last 10)
      db.from('reservation_enquiries')
        .select('id, customer_name, name, email, phone, reservation_date, preferred_time, guest_count, status, created_at')
        .order('created_at', { ascending: false }).limit(10),
    ]);

    if (contacts.error) throw contacts.error;
    if (reservations.error) throw reservations.error;

    const contactRows = contacts.data ?? [];
    const reservationRows = reservations.data ?? [];

    // Category breakdown
    const byCategory: Record<string, number> = {};
    for (const row of contactRows) {
      const cat = row.category ?? 'unknown';
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    }

    res.json({
      success: true,
      range,
      contacts: {
        total:       contactRows.length,
        new:         contactRows.filter(r => r.status === 'new').length,
        in_progress: contactRows.filter(r => r.status === 'in_progress').length,
        resolved:    contactRows.filter(r => r.status === 'resolved').length,
        byCategory,
      },
      reservations: {
        total:     reservationRows.length,
        new:       reservationRows.filter(r => r.status === 'new').length,
        confirmed: reservationRows.filter(r => r.status === 'confirmed').length,
        declined:  reservationRows.filter(r => r.status === 'declined').length,
      },
      recent: {
        contacts:     recentContacts.data ?? [],
        reservations: recentReservations.data ?? [],
      },
    });
  } catch (err) {
    console.error('[Admin/Dashboard]', err);
    res.status(500).json({ success: false, message: 'Could not load dashboard data.' });
  }
});

// ─── GET /api/admin/reservations ──────────────────────────────────────────────

router.get('/reservations', async (req: Request, res: Response) => {
  const { status, search, from, to, page = '1', limit = '25' } = req.query as Record<string, string>;
  const db = getSupabase();
  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * pageSize;

  try {
    let query = db.from('reservation_enquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);
    if (from)   query = query.gte('created_at', from);
    if (to)     query = query.lte('created_at', to + 'T23:59:59Z');
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: data ?? [],
      pagination: { page: pageNum, limit: pageSize, total: count ?? 0, pages: Math.ceil((count ?? 0) / pageSize) },
    });
  } catch (err) {
    console.error('[Admin/Reservations]', err);
    res.status(500).json({ success: false, message: 'Could not load reservations.' });
  }
});

// ─── GET /api/admin/reservations/:id ─────────────────────────────────────────

router.get('/reservations/:id', async (req: Request, res: Response) => {
  const db = getSupabase();
  const { data, error } = await db.from('reservation_enquiries').select('*').eq('id', req.params.id).single();
  if (error) { res.status(404).json({ success: false, message: 'Reservation not found.' }); return; }
  res.json({ success: true, data });
});

// ─── PATCH /api/admin/reservations/:id ───────────────────────────────────────

const VALID_RESERVATION_STATUSES = ['new','contacted','confirmed','declined','cancelled','completed','no_show'];

router.patch('/reservations/:id', async (req: Request, res: Response) => {
  const { status, admin_notes } = req.body as { status?: string; admin_notes?: string };
  const db = getSupabase();
  const id = req.params.id;

  if (status && !VALID_RESERVATION_STATUSES.includes(status)) {
    res.status(400).json({ success: false, message: 'Invalid status value.' });
    return;
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined)      updates.status = status;
  if (admin_notes !== undefined) updates.admin_notes = admin_notes.slice(0, 2000);

  try {
    const { data, error } = await db
      .from('reservation_enquiries').update(updates).eq('id', id).select('*').single();
    if (error) throw error;

    // Send confirmation email only when explicitly set to 'confirmed'
    let emailResult: { sent: boolean; reason?: string } = { sent: false, reason: 'status_not_confirmed' };
    if (status === 'confirmed') {
      emailResult = await sendReservationConfirmationEmail({
        referenceId:   id,
        customerName:  data.customer_name ?? data.name ?? '',
        customerEmail: data.email ?? '',
        phone:         data.phone ?? '',
        reservationDate: data.reservation_date ?? '',
        preferredTime:   data.preferred_time ?? '',
        guestCount:      data.guest_count ?? 0,
        specialRequest:  data.special_request ?? '',
        locationId:      data.location_id ?? BUSINESS.defaultLocationId,
        adminUser:       res.locals.adminUser!.full_name,
      }).catch((err) => {
        console.error('[Admin] Confirmation email error:', err.message);
        return { sent: false, reason: 'send_error' };
      });
    }

    res.json({ success: true, data, emailSent: emailResult.sent });
  } catch (err) {
    console.error('[Admin/Reservations PATCH]', err);
    res.status(500).json({ success: false, message: 'Could not update reservation.' });
  }
});

// ─── GET /api/admin/enquiries ─────────────────────────────────────────────────

router.get('/enquiries', async (req: Request, res: Response) => {
  const { status, category, search, from, to, page = '1', limit = '25' } = req.query as Record<string, string>;
  const db = getSupabase();
  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * pageSize;

  try {
    let query = db.from('contact_enquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status   && status !== 'all')   query = query.eq('status', status);
    if (category && category !== 'all') query = query.eq('category', category);
    if (from) query = query.gte('created_at', from);
    if (to)   query = query.lte('created_at', to + 'T23:59:59Z');
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,customer_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,message.ilike.%${search}%`
      );
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: data ?? [],
      pagination: { page: pageNum, limit: pageSize, total: count ?? 0, pages: Math.ceil((count ?? 0) / pageSize) },
    });
  } catch (err) {
    console.error('[Admin/Enquiries]', err);
    res.status(500).json({ success: false, message: 'Could not load enquiries.' });
  }
});

// ─── GET /api/admin/enquiries/:id ────────────────────────────────────────────

router.get('/enquiries/:id', async (req: Request, res: Response) => {
  const db = getSupabase();
  const { data, error } = await db.from('contact_enquiries').select('*').eq('id', req.params.id).single();
  if (error) { res.status(404).json({ success: false, message: 'Enquiry not found.' }); return; }
  res.json({ success: true, data });
});

// ─── PATCH /api/admin/enquiries/:id ──────────────────────────────────────────

const VALID_ENQUIRY_STATUSES = ['new','in_progress','resolved','closed','spam'];

router.patch('/enquiries/:id', async (req: Request, res: Response) => {
  const { status, admin_notes } = req.body as { status?: string; admin_notes?: string };
  const db = getSupabase();

  if (status && !VALID_ENQUIRY_STATUSES.includes(status)) {
    res.status(400).json({ success: false, message: 'Invalid status value.' });
    return;
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined)      updates.status = status;
  if (admin_notes !== undefined) updates.admin_notes = admin_notes.slice(0, 2000);

  try {
    const { data, error } = await db
      .from('contact_enquiries').update(updates).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('[Admin/Enquiries PATCH]', err);
    res.status(500).json({ success: false, message: 'Could not update enquiry.' });
  }
});

// ─── GET /api/admin/settings ──────────────────────────────────────────────────

router.get('/settings', async (req: Request, res: Response) => {
  const db = getSupabase();
  const { data, error } = await db
    .from('business_settings')
    .select('*')
    .eq('location_id', 'bengaluru-sarjapur')
    .order('key');
  if (error) { res.status(500).json({ success: false, message: 'Could not load settings.' }); return; }
  res.json({ success: true, data: data ?? [] });
});

// ─── PATCH /api/admin/settings/:key ──────────────────────────────────────────
// Only admin+ can update settings (not staff)

router.patch('/settings/:key', requireAdminRole, async (req: Request, res: Response) => {
  const { value } = req.body as { value: string };
  const db = getSupabase();

  // Blocked keys — never allow editing API keys or service credentials via this endpoint
  const BLOCKED = ['service_role_key', 'anon_key', 'resend_api_key', 'gemini_api_key'];
  if (BLOCKED.includes(req.params.key)) {
    res.status(403).json({ success: false, message: 'This setting cannot be edited here.' });
    return;
  }

  const { data, error } = await db
    .from('business_settings')
    .update({ value: String(value ?? '').slice(0, 2000), updated_at: new Date().toISOString(), updated_by: res.locals.adminUser!.id })
    .eq('location_id', 'bengaluru-sarjapur')
    .eq('key', req.params.key)
    .select('*')
    .single();

  if (error) { res.status(500).json({ success: false, message: 'Could not update setting.' }); return; }
  res.json({ success: true, data });
});

// ─── GET /api/admin/settings/public ──────────────────────────────────────────
// Unauthenticated route for frontend to read public settings (menu_pdf_url, maps_url, etc.)
// Registered BEFORE requireAdmin so it bypasses auth

export function publicSettingsRoute(app: import('express').Express) {
  app.get('/api/settings/public', async (_req: Request, res: Response) => {
    try {
      const db = getSupabase();
      const { data, error } = await db
        .from('business_settings')
        .select('key, value')
        .eq('is_public', true)
        .eq('location_id', 'bengaluru-sarjapur');
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[row.key] = row.value ?? '';
      res.json({ success: true, data: map });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Could not load settings.' });
    }
  });
}

export default router;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rangeToDate(range: string): string {
  const now = new Date();
  switch (range) {
    case 'today': {
      const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString();
    }
    case '7d': {
      const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString();
    }
    case '30d':
    default: {
      const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString();
    }
  }
}
