/**
 * Wraps admin pages. Checks for a valid MongoDB admin session on the server
 * before rendering children.
 * Redirects to /admin (login) if check fails or role is unauthorized.
 */
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { AdminUser } from '../../lib/adminApi.ts';
import AdminLayout from '../../components/admin/AdminLayout.tsx';
import { Spinner } from '../../components/admin/ui.tsx';

interface Props {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

type State = { status: 'loading' } | { status: 'ok'; admin: AdminUser } | { status: 'denied' };

export default function ProtectedRoute({ children, requireSuperAdmin }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function check() {
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
                  id: data.admin.userId || data.admin.id || data.admin._id,
                  email: data.admin.email,
                  full_name: data.admin.name || data.admin.email.split('@')[0],
                  role: (data.admin.role === 'super_admin' ? 'super_admin' : 'admin') as any,
                },
              });
            }
            return;
          }
        }
      } catch {
        // Network or server error
      }

      if (!cancelled) {
        localStorage.removeItem('malwa_admin_token');
        setState({ status: 'denied' });
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'denied') return <Navigate to="/admin" replace />;

  if (requireSuperAdmin && state.admin.role !== 'super_admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <AdminLayout admin={state.admin}>{children}</AdminLayout>;
}

