/**
 * Wraps admin pages. Checks for a valid MongoDB admin session on the server
 * before rendering children.
 * Redirects to /admin (login) if unauthenticated/unauthorized; shows retry state on network/server outage.
 */
import { useEffect, useState, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { AdminUser } from '../../lib/adminApi.ts';
import AdminLayout from '../../components/admin/AdminLayout.tsx';
import { Spinner } from '../../components/admin/ui.tsx';

interface Props {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

type State =
  | { status: 'loading' }
  | { status: 'ok'; admin: AdminUser }
  | { status: 'denied' }
  | { status: 'error'; message: string };

export default function ProtectedRoute({ children, requireSuperAdmin }: Props) {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: 'loading' });

  const checkSession = useCallback(async (isCancelled?: () => boolean) => {
    setState({ status: 'loading' });
    try {
      const token = localStorage.getItem('malwa_admin_token');
      if (!token) {
        if (!isCancelled?.()) {
          setState({ status: 'denied' });
        }
        return;
      }

      const res = await fetch('/api/auth/admin/verify', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success && data.admin) {
          if (!isCancelled?.()) {
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

      // Only clear stored token when server explicitly denies authentication (401/403)
      if (res.status === 401 || res.status === 403) {
        if (!isCancelled?.()) {
          localStorage.removeItem('malwa_admin_token');
          setState({ status: 'denied' });
        }
        return;
      }

      if (!isCancelled?.()) {
        setState({
          status: 'error',
          message: `Session verification returned HTTP ${res.status}. Please retry.`,
        });
      }
    } catch {
      if (!isCancelled?.()) {
        setState({
          status: 'error',
          message: 'Unable to reach the authentication server. Check your connection and retry.',
        });
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    checkSession(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [checkSession]);

  if (state.status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#FAF6F0' }}>
        <Spinner />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#FAF6F0', padding: '24px' }}>
        <div style={{ maxWidth: '420px', width: '100%', background: '#FFFFFF', borderRadius: '16px', padding: '28px', textAlign: 'center', border: '1px solid rgba(200, 154, 61, 0.35)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#3C0815', margin: '0 0 8px' }}>
            Unable to Verify Admin Session
          </h2>
          <p style={{ fontSize: '13.5px', color: '#6B7280', margin: '0 0 20px', lineHeight: 1.55 }}>
            {state.message}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => checkSession()}
              style={{ background: '#3C0815', color: '#FFF8EC', border: 'none', borderRadius: '999px', padding: '10px 20px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('malwa_admin_token');
                navigate('/admin', { replace: true });
              }}
              style={{ background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '999px', padding: '10px 18px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'denied') return <Navigate to="/admin" replace />;

  if (requireSuperAdmin && state.admin.role !== 'super_admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <AdminLayout admin={state.admin}>{children}</AdminLayout>;
}
