import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../../components/seo/SEOHead.tsx';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // If already logged in with valid admin session → redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem('malwa_admin_token');
    if (token) {
      fetch('/api/auth/admin/verify', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data?.success && data?.admin) {
            navigate('/admin/dashboard', { replace: true });
          } else {
            localStorage.removeItem('malwa_admin_token');
          }
        })
        .catch(() => {});
    }
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem('malwa_admin_token', data.token);
        }
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      if (res.status === 403) {
        setError(data.message || 'Access denied. You do not have administrator permissions.');
      } else {
        setError(data.message || 'Email or password is incorrect.');
      }
    } catch {
      setError('Unable to connect to authentication server. Please check your network.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await fetch('/api/auth/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      setForgotSubmitted(true);
    } catch {
      setForgotSubmitted(true); // Maintain generic response on network error
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1A0A0F 0%, #2D0F1A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <SEOHead title="Admin Portal Sign In" noIndex={true} />
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ color: '#F0C74E', fontSize: '22px', fontWeight: 800, letterSpacing: '0.04em' }}>Malwa Namkeen House</div>
          <div style={{ color: 'rgba(255,248,236,0.45)', fontSize: '12px', marginTop: '4px', letterSpacing: '0.10em', textTransform: 'uppercase' }}>Admin Portal</div>
        </div>

        <div style={{ background: '#fff', borderRadius: '18px', padding: '36px', boxShadow: '0 24px 60px rgba(0,0,0,0.30)' }}>
          <h1 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 700, color: '#1A0A0F', textAlign: 'center' }}>Sign In</h1>

          {error && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '13.5px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <label style={labelStyle}>Email</label>
            <input
              type="email" required autoFocus
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@malwanamkeen.com"
              style={inputStyle}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', marginBottom: '6px' }}>
              <label style={{ ...labelStyle, margin: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => { setShowForgotModal(true); setForgotSubmitted(false); setForgotEmail(email); }}
                style={{ background: 'transparent', border: 'none', color: '#8B5E3C', fontSize: '12px', cursor: 'pointer', padding: 0, fontWeight: 600 }}
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginTop: '22px', background: '#3C0815', color: '#FFF8EC', border: 'none', borderRadius: '10px', height: '46px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ margin: '20px 0 0', fontSize: '12px', color: '#9CA3AF', textAlign: 'center' }}>
            Admin accounts are created by a super admin.<br />Contact your administrator if you need access.
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href="/" style={{ color: 'rgba(255,248,236,0.45)', fontSize: '12px', textDecoration: 'none' }}>← Back to website</a>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            maxWidth: '420px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A0A0F', margin: '0 0 8px' }}>
              Reset Administrator Password
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px' }}>
              Enter your registered staff email address to receive password recovery instructions.
            </p>

            {forgotSubmitted ? (
              <div>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '14px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px' }}>
                  If an administrative account exists for <strong>{forgotEmail}</strong>, password reset instructions have been dispatched.
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{
                    width: '100%',
                    padding: '11px',
                    background: '#3C0815',
                    color: '#FFF8EC',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                  }}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <label style={labelStyle}>Staff Email</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="admin@malwanamkeen.com"
                  style={inputStyle}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    style={{
                      flex: 1,
                      padding: '11px',
                      background: '#F3F4F6',
                      color: '#4B5563',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{
                      flex: 2,
                      padding: '11px',
                      background: '#3C0815',
                      color: '#FFF8EC',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      cursor: forgotLoading ? 'not-allowed' : 'pointer',
                      opacity: forgotLoading ? 0.7 : 1,
                    }}
                  >
                    {forgotLoading ? 'Sending…' : 'Send Recovery Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', letterSpacing: '0.03em' };
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit', color: '#111827', outline: 'none' };
