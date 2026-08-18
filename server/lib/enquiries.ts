import { getSupabase } from './supabase.ts';

/* ─── Shared insert helper ────────────────────────────────────────────────── */

/**
 * Inserts one row into `table` and returns the new record's id.
 * Throws on Supabase error so callers can translate to a JSON response.
 */
async function insert(
  table: string,
  row: Record<string, unknown>,
): Promise<string> {
  const db = getSupabase();

  const { data, error } = await db
    .from(table)
    .insert({ ...row, source: 'website' })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  return (data as { id: string }).id;
}

/* ─── Per-table helpers ───────────────────────────────────────────────────── */

export async function insertContact(row: {
  name: string;
  phone: string;
  email: string;
  occasion: string;
  message: string;
}): Promise<string> {
  return insert('contact_enquiries', row);
}

export async function insertReservation(row: {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: string;
  notes: string;
}): Promise<string> {
  return insert('reservation_enquiries', row);
}

export async function insertKatering(row: {
  name: string;
  phone: string;
  event_type: string;
  occasion: string;
  guests: string;
  date: string;
  message: string;
}): Promise<string> {
  return insert('katering_enquiries', row);
}

export async function insertGifting(row: {
  name: string;
  phone: string;
  gift_type: string;
  quantity: string;
  message: string;
}): Promise<string> {
  return insert('gifting_enquiries', row);
}
