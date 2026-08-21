/**
 * Express middleware: verifies the Supabase access token from the
 * Authorization header, then checks that the user has an active row in
 * admin_profiles. Sets res.locals.adminUser on success.
 *
 * Token format: "Bearer <supabase-access-token>"
 * The token is verified by calling Supabase's getUser() — no local JWT
 * secret needed, and the token cannot be forged or tampered with.
 */

import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase.ts';
import { verifyToken, extractToken } from './auth.ts';

export interface AdminUser {
  id:        string;
  email:     string;
  full_name: string;
  role:      'super_admin' | 'admin' | 'staff';
}

declare module 'express-serve-static-core' {
  interface Locals {
    adminUser?: AdminUser;
  }
}

// Lightweight anon client used only for token verification (getUser)
let _anonClient: ReturnType<typeof createClient> | null = null;
function getAnonClient() {
  if (_anonClient) return _anonClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _anonClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _anonClient;
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  // 1. Try MongoDB Admin Token
  const mongoPayload = verifyToken(token);
  if (mongoPayload) {
    if (mongoPayload.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
      return;
    }

    res.locals.adminUser = {
      id: mongoPayload.userId,
      email: mongoPayload.email,
      full_name: mongoPayload.email.split('@')[0],
      role: 'super_admin',
    };
    next();
    return;
  }

  // 2. Try Supabase Session Token
  const anonClient = getAnonClient();
  if (!anonClient) {
    res.status(401).json({ success: false, message: 'Invalid or expired session.' });
    return;
  }

  try {
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      res.status(401).json({ success: false, message: 'Invalid or expired session.' });
      return;
    }

    // 2. Check admin_profiles with service role (bypasses RLS)
    const db = getSupabase();
    const { data: profile, error: profileError } = await db
      .from('admin_profiles')
      .select('full_name, role, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      res.status(403).json({ success: false, message: 'Access denied. No admin profile found.' });
      return;
    }

    if (!profile.is_active) {
      res.status(403).json({ success: false, message: 'Admin account is inactive.' });
      return;
    }

    res.locals.adminUser = {
      id:        user.id,
      email:     user.email ?? '',
      full_name: profile.full_name,
      role:      profile.role as AdminUser['role'],
    };

    next();
  } catch (err) {
    console.error('[AdminAuth] Error:', err instanceof Error ? err.message : err);
    res.status(500).json({ success: false, message: 'Authentication service error.' });
  }
}

/** Additional guard: only super_admin or admin may call this route. */
export function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.adminUser;
  if (!user || user.role === 'staff') {
    res.status(403).json({ success: false, message: 'Insufficient permissions.' });
    return;
  }
  next();
}
