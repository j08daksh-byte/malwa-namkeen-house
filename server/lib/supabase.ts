import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/* ─── Singleton ───────────────────────────────────────────────────────────── */

let _client: SupabaseClient | null = null;

/**
 * Returns a server-side Supabase client initialised with the service role key.
 * Call this inside route handlers — never at module load time — so that a
 * missing env var returns a clear error rather than crashing the process.
 *
 * IMPORTANT: The service role key bypasses Row Level Security. Only use it on
 * the server. Never expose it to the browser or Vite's build.
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.',
    );
  }

  _client = createClient(url, key, {
    auth: {
      // Service role clients don't need session persistence.
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _client;
}

/** Narrow type for rows coming back from Supabase inserts. */
export type InsertResult = { id: string };
