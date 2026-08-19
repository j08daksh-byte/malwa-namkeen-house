/**
 * Frontend Supabase client.
 *
 * Supabase is optional during frontend-only development.
 * Admin login will be unavailable until VITE_SUPABASE_URL
 * and VITE_SUPABASE_ANON_KEY are configured.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let supabase: SupabaseClient | null = null;

if (url && key) {
  supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
} else {
  console.warn(
    '[MishtiChaat] Supabase is not configured — admin login is disabled.'
  );
}

export { supabase };