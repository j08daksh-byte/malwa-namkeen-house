/**
 * Wraps admin pages. Checks for a valid Supabase session AND a confirmed
 * admin profile on the server before rendering children.
 * Redirects to /admin (login) if either check fails.
 */
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.ts';
import { adminApi } from '../../lib/adminApi.ts';
import type { AdminUser } from '../../lib/adminApi.ts';
import AdminLayout from '../../components/admin/AdminLayout.tsx';
import { Spinner } from '../../components/admin/ui.tsx';

interface Props { children: React.ReactNode; }

type State = { status: 'loading' } | { status: 'ok'; admin: AdminUser } | { status: 'denied' };

export default function ProtectedRoute({ children }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // 1. Try MongoDB admin session
      try {
        const token = localStorage.getItem('malwa_admin_token');
        const res = await fetch('/api/auth/admin/verify', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.admin) {
            if (!cancelled) {
              setState({
                status: 'ok',
                admin: {
                  id: data.admin.userId || data.admin.id,
                  email: data.admin.email,
                  full_name: data.admin.name || data.admin.email.split('@')[0],
                  role: 'super_admin',
                },
              });
            }
            return;
          }
        }
      } catch {
        // Fallback to Supabase
      }

      // 2. Try Supabase session
      const { data } = await supabase.auth.getSession();
      if (!data.session) { if (!cancelled) setState({ status: 'denied' }); return; }

      try {
        const me = await adminApi.me();
        if (!cancelled) setState({ status: 'ok', admin: me.admin });
      } catch {
        if (!cancelled) setState({ status: 'denied' });
      }
    }

    check();

    // Re-check on auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setState({ status: 'denied' });
      else check();
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'denied') return <Navigate to="/admin" replace />;

  return <AdminLayout admin={state.admin}>{children}</AdminLayout>;
}
