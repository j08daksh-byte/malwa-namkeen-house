import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setValid(false);
      setErrorMessage('Missing invitation token in URL.');
      return;
    }

    async function verifyInvite() {
      try {
        const res = await fetch(`/api/auth/verify-invite-token?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok && data.valid) {
          setValid(true);
          setAdminEmail(data.email || '');
          setName(data.name || '');
          setRole(data.role || 'admin');
        } else {
          setValid(false);
          setErrorMessage(data.message || 'This invitation link is invalid, expired, or has already been accepted.');
        }
      } catch {
        setValid(false);
        setErrorMessage('Unable to connect to verification server. Please check your connection.');
      } finally {
        setVerifying(false);
      }
    }

    verifyInvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem('malwa_admin_token', data.token);
        }
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 2000);
      } else {
        setErrorMessage(data.message || 'Failed to activate administrator account.');
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1A0A0F 0%, #3C0815 50%, #15050A 100%)',
      padding: '24px 16px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#FFF8EC',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: 'rgba(255, 248, 236, 0.04)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        borderRadius: '20px',
        padding: '36px 32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #D4AF37 0%, #AA8010 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1A0A0F',
            marginBottom: '16px',
            boxShadow: '0 8px 16px rgba(212, 175, 55, 0.3)',
          }}>
            <ShieldCheck size={28} strokeWidth={2.4} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D4AF37', margin: '0 0 6px' }}>
            Join Admin Team
          </h1>
          <p style={{ fontSize: '13px', color: '#D4AF37', opacity: 0.8, margin: 0 }}>
            Malwa Namkeen House Administration Portal
          </p>
        </div>

        {verifying ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{
              width: '36px',
              height: '36px',
              border: '3px solid rgba(212, 175, 55, 0.3)',
              borderTopColor: '#D4AF37',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ fontSize: '14px', color: '#D4AF37' }}>Validating administrator invitation...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : !valid ? (
          <div>
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              marginBottom: '24px',
            }}>
              <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '13px', color: '#FCA5A5' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 4px', color: '#EF4444' }}>Invalid Invitation Link</p>
                <p style={{ margin: 0 }}>{errorMessage}</p>
              </div>
            </div>
            <Link
              to="/admin"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                padding: '12px',
                background: 'rgba(212, 175, 55, 0.15)',
                color: '#D4AF37',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: '10px',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Go to Admin Sign In
            </Link>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22C55E',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFF8EC', margin: '0 0 8px' }}>
              Welcome to the Team!
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255, 248, 236, 0.7)', margin: '0 0 16px' }}>
              Your account has been activated. Redirecting you to the administrator control panel...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '20px',
              fontSize: '13px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'rgba(255, 248, 236, 0.6)' }}>Assigned Email:</span>
                <strong style={{ color: '#D4AF37' }}>{adminEmail}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255, 248, 236, 0.6)' }}>Assigned Role:</span>
                <span style={{
                  background: role === 'super_admin' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: role === 'super_admin' ? '#D4AF37' : '#93C5FD',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}>
                  {role === 'super_admin' ? 'Super Administrator' : 'Administrator'}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '12px',
                color: '#FCA5A5',
                marginBottom: '16px',
              }}>
                {errorMessage}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#D4AF37', marginBottom: '6px' }}>
                Your Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full Name"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#FFF8EC',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#D4AF37', marginBottom: '6px' }}>
                Choose Password (minimum 8 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: '#FFF8EC',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#D4AF37',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#D4AF37', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#FFF8EC',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '13px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA8010 100%)',
                color: '#1A0A0F',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={16} />
              <span>{submitting ? 'Activating Account...' : 'Activate & Enter Portal'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
