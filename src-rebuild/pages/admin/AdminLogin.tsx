import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.ts';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Already logged in → redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/admin/dashboard', { replace: true });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        setError('Invalid email or password. Please try again.');
        return;
      }
      // Verify admin profile exists on the server
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) { setError('Session error. Please try again.'); return; }

      const res = await fetch('/api/admin/me', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Access denied. Contact your administrator.');
        await supabase.auth.signOut();
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1A0A0F 0%, #2D0F1A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ color: '#F0C74E', fontSize: '22px', fontWeight: 800, letterSpacing: '0.04em' }}>MishtiChaat</div>
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
              placeholder="admin@mishtichaat.com"
              style={inputStyle}
            />

            <label style={{ ...labelStyle, marginTop: '14px' }}>Password</label>
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
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', letterSpacing: '0.03em' };
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit', color: '#111827', outline: 'none' };
