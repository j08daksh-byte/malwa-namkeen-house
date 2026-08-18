/**
 * Frontend Supabase client — uses the public anon key only.
 * This is safe to ship in the browser. Never use the service role key here.
 *
 * Used exclusively by the admin login page for Supabase Auth.
 * All other DB operations go through Express (server-side with service role).
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  console.warn('[MishtiChaat] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set — admin login will not work.');
}

export const supabase = createClient(url ?? '', key ?? '', {
  auth: { persistSession: true, autoRefreshToken: true },
});
