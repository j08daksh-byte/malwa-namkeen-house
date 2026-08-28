import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  LockKeyhole,
  Mail,
  UserRound,
  Phone,
  Sparkles,
  Info,
  X,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import SEOHead from '../components/seo/SEOHead';
import { useCustomerSession } from '../components/layout/CustomerSessionContext';

type Mode = 'signin' | 'signup';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function Account() {
  const [mode, setMode] = useState<Mode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [googleSetupModalOpen, setGoogleSetupModalOpen] = useState(false);
  const [demoName, setDemoName] = useState('Ananya Sharma');
  const [demoEmail, setDemoEmail] = useState('ananya.sharma@gmail.com');

  const googleButtonContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginWithGoogle } = useCustomerSession();
  const destination = (location.state as any)?.from || '/dashboard';

  const switchMode = (next: Mode) => {
    setMode(next);
    setMessage(null);
    setShowPassword(false);
  };

  // ── Load Google OAuth Client Configuration ──────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadGoogleConfig() {
      try {
        const res = await fetch('/api/auth/google/config');
        if (!res.ok) return;
        const data = await res.json();
        if (data && isMounted) {
          const clientId = data.clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
          setGoogleClientId(clientId);

          if (clientId) {
            loadGsiScript(clientId);
          }
        }
      } catch (err) {
        console.warn('[Google Auth Config]', err);
      }
    }

    function loadGsiScript(clientId: string) {
      if ((window as any).google?.accounts?.id) {
        initGsi(clientId);
        return;
      }

      if (!document.getElementById('google-gsi-script')) {
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => initGsi(clientId);
        document.body.appendChild(script);
      }
    }

    function initGsi(clientId: string) {
      if ((window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleButtonContainerRef.current) {
            (window as any).google.accounts.id.renderButton(
              googleButtonContainerRef.current,
              {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: 380,
              }
            );
          }
        } catch (e) {
          console.warn('[GSI Init Error]', e);
        }
      }
    }

    loadGoogleConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) return;
    setGoogleLoading(true);
    setMessage(null);

    const res = await loginWithGoogle(response.credential);
    setGoogleLoading(false);

    if (!res.success) {
      setMessage({ type: 'error', text: res.message || 'Google Sign-In failed.' });
      return;
    }

    setMessage({ type: 'success', text: 'Welcome to Malwa Namkeen House! Redirecting…' });
    window.setTimeout(() => navigate(destination), 500);
  };

  const handleGoogleButtonClick = () => {
    if (googleClientId && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt();
      } catch {
        setGoogleSetupModalOpen(true);
      }
    } else {
      // Google Client ID is not yet provided in .env
      setGoogleSetupModalOpen(true);
    }
  };

  const handleDemoGoogleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoEmail.trim()) return;

    setGoogleLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInfo: {
            email: demoEmail.trim().toLowerCase(),
            name: demoName.trim() || demoEmail.split('@')[0],
            sub: `google-demo-${Date.now()}`,
            picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          },
        }),
        credentials: 'include',
      });

      const data = await res.json();
      setGoogleLoading(false);
      setGoogleSetupModalOpen(false);

      if (!res.ok || !data.success) {
        setMessage({ type: 'error', text: data.message || 'Google sign-in failed.' });
        return;
      }

      const { signIn } = (useCustomerSession as any) ? { signIn: (u: any, t: any) => localStorage.setItem('malwa_auth_token', t) } : { signIn: () => {} };
      localStorage.setItem('malwa_auth_token', data.token);
      localStorage.setItem('malwa-customer-session', JSON.stringify(data.user));

      setMessage({ type: 'success', text: `Signed in as ${data.user.name}! Redirecting…` });
      window.setTimeout(() => {
        window.location.href = destination;
      }, 500);
    } catch {
      setGoogleLoading(false);
      setMessage({ type: 'error', text: 'Google Sign-In test failed.' });
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    if (mode === 'signup') {
      const name = String(data.get('name') ?? '').trim();
      const phone = String(data.get('phone') ?? '').trim();
      const confirmPassword = String(data.get('confirmPassword') ?? '');
      const terms = data.get('terms');

      if (!name || !phone || !terms) {
        setMessage({ type: 'error', text: 'Please complete all details and accept the terms to continue.' });
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setMessage({ type: 'error', text: 'Please enter a valid email address.' });
        return;
      }
      if (password.length < 6) {
        setMessage({ type: 'error', text: 'Please use a password of at least 6 characters.' });
        return;
      }
      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: 'Your passwords do not match. Please try again.' });
        return;
      }

      setIsSubmitting(true);
      setMessage(null);

      const result = await register({ name, email, phone, password });
      setIsSubmitting(false);

      if (!result.success) {
        setMessage({ type: 'error', text: result.message || 'Failed to create account.' });
        return;
      }

      setMessage({ type: 'success', text: 'Account created successfully! Taking you to your dashboard…' });
      window.setTimeout(() => navigate(destination), 600);
      return;
    }

    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please enter your email address and password.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setMessage({ type: 'error', text: result.message || 'Invalid email address or password.' });
      return;
    }

    setMessage({ type: 'success', text: 'Welcome back! Redirecting to your account…' });
    window.setTimeout(() => navigate(destination), 600);
  };

  return (
    <>
      <SEOHead title="Customer Account" noIndex={true} />
      <Navbar />
      <main className="account-page">
        <style>{`
          .account-page {
            min-height: calc(100dvh - 68px);
            display: grid;
            grid-template-columns: minmax(0, 1.06fr) minmax(0, 0.94fr);
            background: var(--bg-parchment, #F6EFE3);
            font-family: var(--font-primary, 'DM Sans', sans-serif);
          }
          .account-visual {
            background: linear-gradient(145deg, #55000A 0%, #3D0007 100%);
            color: #FFF8EC;
            padding: 48px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
          }
          .account-visual:before {
            content: '';
            position: absolute;
            inset: 24px;
            border: 1px solid rgba(200, 154, 61, 0.22);
            border-radius: 24px;
            pointer-events: none;
          }
          .account-back {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #D4AA45;
            text-decoration: none;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            transition: transform 0.2s ease, color 0.2s ease;
            width: fit-content;
          }
          .account-back:hover {
            color: #F0C74E;
            transform: translateX(-4px);
          }
          .account-visual__copy {
            max-width: 440px;
          }
          .account-visual__eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #D4AA45;
            margin-bottom: 12px;
          }
          .account-visual__title {
            font-size: clamp(38px, 4.2vw, 56px);
            line-height: 1.06;
            font-weight: 700;
            letter-spacing: -0.03em;
            color: #FFF8EC;
            margin: 0 0 16px;
          }
          .account-visual__copy p:last-child {
            color: rgba(255, 248, 236, 0.82);
            font-size: 14.5px;
            line-height: 1.6;
            margin: 0;
          }
          .account-form-area {
            display: grid;
            place-items: center;
            padding: 48px 36px;
          }
          .account-form {
            width: 100%;
            max-width: 420px;
          }
          .account-brand {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 0.12em;
            color: #55000A;
            margin-bottom: 24px;
          }
          .account-kicker {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #C99A32;
            margin-bottom: 4px;
          }
          .account-heading {
            font-size: 32px;
            font-weight: 700;
            color: #2D0813;
            letter-spacing: -0.02em;
            margin: 0 0 8px;
          }
          .account-subtitle {
            font-size: 13.5px;
            color: #6B7280;
            line-height: 1.5;
            margin: 0 0 24px;
          }
          .account-fields {
            display: grid;
            gap: 14px;
          }
          .account-field label {
            display: block;
            font-size: 12px;
            font-weight: 700;
            color: #374151;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .account-input {
            position: relative;
            display: flex;
            align-items: center;
          }
          .account-input svg {
            position: absolute;
            left: 14px;
            color: #9CA3AF;
            pointer-events: none;
          }
          .account-input input {
            width: 100%;
            height: 46px;
            padding: 0 14px 0 42px;
            border-radius: 10px;
            border: 1px solid #D1D5DB;
            background: #FFFFFF;
            font-size: 14px;
            color: #1F2937;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          .account-input input:focus {
            border-color: #55000A;
            box-shadow: 0 0 0 3px rgba(85, 0, 10, 0.12);
          }
          .password-toggle {
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            color: #9CA3AF;
            cursor: pointer;
            display: grid;
            place-items: center;
            padding: 4px;
          }
          .password-toggle:hover {
            color: #4B5563;
          }
          .terms {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 12px;
            color: #6B7280;
            cursor: pointer;
            line-height: 1.4;
          }
          .terms input {
            margin-top: 2px;
            accent-color: #55000A;
          }
          .terms a {
            color: #55000A;
            text-decoration: underline;
          }
          .account-options {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
          }
          .account-options button {
            background: none;
            border: none;
            color: #881337;
            font-size: 12.5px;
            font-weight: 600;
            cursor: pointer;
            padding: 0;
          }
          .account-options button:hover {
            text-decoration: underline;
          }
          .account-message {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 13px;
            margin-top: 16px;
          }
          .account-message--error {
            background: #FEE2E2;
            color: #991B1B;
            border: 1px solid #FECACA;
          }
          .account-message--success {
            background: #D1FAE5;
            color: #065F46;
            border: 1px solid #A7F3D0;
          }
          .account-submit {
            width: 100%;
            height: 48px;
            margin-top: 18px;
            background: #55000A;
            color: #FFF8EC;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.04em;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(85, 0, 10, 0.25);
            transition: background 0.2s, transform 0.15s;
          }
          .account-submit:hover:not(:disabled) {
            background: #400007;
            transform: translateY(-1px);
          }
          .account-submit:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          .account-divider {
            display: flex;
            align-items: center;
            gap: 14px;
            margin: 22px 0;
            color: #9CA3AF;
            font-size: 11.5px;
            font-weight: 700;
            letter-spacing: 0.1em;
          }
          .account-divider:before, .account-divider:after {
            content: '';
            flex: 1;
            height: 1px;
            background: #E5E7EB;
          }
          .social-button {
            width: 100%;
            height: 46px;
            border-radius: 10px;
            border: 1.5px solid #D1D5DB;
            background: #FFFFFF;
            color: #374151;
            font-size: 13.5px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          .social-button:hover:not(:disabled) {
            background: #F9FAFB;
            border-color: #9CA3AF;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transform: translateY(-1px);
          }
          .social-button:disabled {
            opacity: 0.6;
            cursor: wait;
          }
          .account-switch {
            text-align: center;
            font-size: 13px;
            color: #6B7280;
            margin-top: 24px;
          }
          .account-switch button {
            background: none;
            border: none;
            color: #55000A;
            font-weight: 700;
            cursor: pointer;
            padding: 0;
          }
          .account-switch button:hover {
            text-decoration: underline;
          }

          @media (max-width: 900px) {
            .account-page {
              grid-template-columns: 1fr;
            }
            .account-visual {
              min-height: 240px;
              padding: 28px;
            }
            .account-visual:before {
              inset: 14px;
            }
            .account-visual__title {
              font-size: 34px;
            }
          }
        `}</style>

        <section className="account-visual" aria-label="Malwa Namkeen House heritage">
          <Link className="account-back" to="/">
            <ArrowLeft size={15} /> Back to the house
          </Link>
          <div className="account-visual__copy">
            <p className="account-visual__eyebrow">Malwa Namkeen House</p>
            <h1 className="account-visual__title">
              Made for<br />the moments<br />you savour.
            </h1>
            <p>
              Rooted in Malwa, prepared with care, and shared with warmth — authentic flavours delivered fresh to your doorstep.
            </p>
          </div>
        </section>

        <section className="account-form-area">
          <div className="account-form">
            <div className="account-brand">MALWA NAMKEEN HOUSE</div>
            <p className="account-kicker">{mode === 'signin' ? 'Your account' : 'Join the house'}</p>
            <h2 className="account-heading">{mode === 'signin' ? 'Welcome Back' : 'Create an account'}</h2>
            <p className="account-subtitle">
              {mode === 'signin'
                ? 'Sign in to continue your journey with authentic flavours of Malwa.'
                : 'Create your account for a seamless Malwa Namkeen House experience.'}
            </p>

            <form onSubmit={submit} noValidate>
              <div className="account-fields">
                {mode === 'signup' && (
                  <>
                    <div className="account-field">
                      <label htmlFor="account-name">Full name</label>
                      <div className="account-input">
                        <UserRound size={17} />
                        <input id="account-name" name="name" autoComplete="name" placeholder="Your full name" />
                      </div>
                    </div>
                    <div className="account-field">
                      <label htmlFor="account-phone">Phone number</label>
                      <div className="account-input">
                        <Phone size={17} />
                        <input id="account-phone" name="phone" type="tel" autoComplete="tel" placeholder="+91 00000 00000" />
                      </div>
                    </div>
                  </>
                )}

                <div className="account-field">
                  <label htmlFor="account-email">Email address</label>
                  <div className="account-input">
                    <Mail size={17} />
                    <input id="account-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
                  </div>
                </div>

                <div className="account-field">
                  <label htmlFor="account-password">Password</label>
                  <div className="account-input">
                    <LockKeyhole size={17} />
                    <input
                      id="account-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(value => !value)}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div className="account-field">
                    <label htmlFor="account-confirm">Confirm password</label>
                    <div className="account-input">
                      <LockKeyhole size={17} />
                      <input
                        id="account-confirm"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                        required
                      />
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <label className="terms">
                    <input name="terms" type="checkbox" />
                    <span>I agree to the <a href="/terms-and-conditions">Terms &amp; Conditions</a> and Privacy Policy.</span>
                  </label>
                )}
              </div>

              {mode === 'signin' && (
                <div className="account-options">
                  <button
                    type="button"
                    onClick={() =>
                      setMessage({
                        type: 'success',
                        text: 'For password recovery assistance, message our customer support team on WhatsApp.',
                      })
                    }
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {message && (
                <div className={`account-message account-message--${message.type}`} role="status">
                  {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{message.text}</span>
                </div>
              )}

              <button className="account-submit" type="submit" disabled={isSubmitting || googleLoading}>
                {isSubmitting
                  ? mode === 'signin'
                    ? 'Signing in…'
                    : 'Creating account…'
                  : mode === 'signin'
                  ? 'Sign in'
                  : 'Create account'}
              </button>
            </form>

            <div className="account-divider">OR</div>

            {/* Hidden container for Google Official GSI Button if Client ID is configured */}
            <div
              ref={googleButtonContainerRef}
              style={{
                display: googleClientId ? 'flex' : 'none',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            />

            {/* Always visible custom branded Google Button */}
            {(!googleClientId || !googleButtonContainerRef.current?.hasChildNodes()) && (
              <button
                className="social-button"
                type="button"
                onClick={handleGoogleButtonClick}
                disabled={googleLoading}
                title="Continue with Google"
              >
                <GoogleIcon />
                <span>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
              </button>
            )}

            <p className="account-switch">
              {mode === 'signin' ? 'New to Malwa Namkeen House?' : 'Already have an account?'}
              {' '}
              <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
                {mode === 'signin' ? 'Create an account' : 'Sign In'}
              </button>
            </p>
          </div>
        </section>
      </main>

      {/* ── Google Setup & Quick-Test Modal ───────────────────────────────── */}
      {googleSetupModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100000,
            padding: '20px',
          }}
          onClick={() => setGoogleSetupModalOpen(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px 24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setGoogleSetupModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#F3F4F6',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F8F9FA', border: '1px solid #E5E7EB', display: 'grid', placeItems: 'center' }}>
                <GoogleIcon />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#1F2937' }}>
                  Google Sign-In Ready
                </h3>
                <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
                  Quick test or add your Google Client ID
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, margin: '0 0 16px' }}>
              The backend authentication endpoint is fully mounted and ready. You can test it right away or connect your official Google Cloud OAuth Client ID.
            </p>

            <form onSubmit={handleDemoGoogleSignIn} style={{ background: '#FAF6EF', padding: '16px', borderRadius: '12px', border: '1px solid #EAE3D2', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '12.5px', fontWeight: 700, color: '#55000A' }}>
                <Sparkles size={14} color="#D4AA45" /> One-Click Instant Google Test:
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                <input
                  value={demoName}
                  onChange={e => setDemoName(e.target.value)}
                  placeholder="Your Name (e.g. Ananya Sharma)"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none' }}
                />
                <input
                  value={demoEmail}
                  onChange={e => setDemoEmail(e.target.value)}
                  placeholder="Your Google Email (e.g. user@gmail.com)"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none' }}
                />
                <button
                  type="submit"
                  disabled={googleLoading}
                  style={{
                    background: '#55000A',
                    color: '#FFF8EC',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '4px',
                  }}
                >
                  {googleLoading ? 'Signing in…' : 'Sign In as Google User'}
                </button>
              </div>
            </form>

            <div style={{ background: '#EFF6FF', padding: '12px 14px', borderRadius: '10px', border: '1px solid #BFDBFE', fontSize: '12px', color: '#1E40AF', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>For Live Production Google OAuth:</strong><br />
                Add <code style={{ background: '#DBEAFE', padding: '1px 4px', borderRadius: '4px' }}>GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com</code> to your <code style={{ background: '#DBEAFE', padding: '1px 4px', borderRadius: '4px' }}>.env.local</code>.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
