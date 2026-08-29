import { useState, useEffect, useRef } from 'react';
import { submitContact } from '../../lib/api.ts';
import { CATEGORY_WA_URLS, WA_URLS } from '../../lib/whatsapp.ts';
import { BUSINESS } from '../../lib/business.ts';
import { useStoreSettings } from '../../lib/storeSettingsContext';
import { EVENTS } from '../../lib/events';

// Must match server/validate.ts message min
const MIN_MESSAGE = 10;

const CATEGORIES = [
  { value: 'general_enquiry',         label: 'General Enquiries'         },
  { value: 'catering',                label: 'Catering'                   },
  { value: 'bulk_orders',             label: 'Bulk Orders'                },
  { value: 'corporate_gifting',       label: 'Corporate Gifting'          },
  { value: 'birthday_parties_events', label: 'Birthday Parties & Events'  },
];

const MESSAGE_PLACEHOLDERS: Record<string, string> = {
  catering:                 'Please share the event date, venue, expected guest count and any specific requirements.',
  bulk_orders:              'Please list the required items, quantity and preferred delivery date.',
  corporate_gifting:        'Please share the quantity, budget per gift, occasion and delivery details.',
  birthday_parties_events:  'Please share the event date, guest count, venue preference and any special requirements.',
  general_enquiry:          'How can we help you?',
};

function formatReferenceId(rawId: string): string {
  return `MC-ENQ-${rawId.slice(-6).toUpperCase()}`;
}

const WA_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L.057 23.985l6.304-1.648A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-5.002-1.368l-.358-.213-3.743.979 1.003-3.648-.234-.374A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/>
  </svg>
);

/* ─── Info block used in the left panel ─────────────────────────────────── */
function InfoBlock({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <div style={{
        flexShrink: 0, width: '38px', height: '38px',
        borderRadius: '10px',
        border: '1px solid rgba(200,154,61,0.45)',
        background: 'rgba(200,154,61,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px', fontWeight: 700,
          letterSpacing: '0.10em', textTransform: 'uppercase',
          color: '#D4AA45', margin: '0 0 4px',
        }}>{title}</p>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '13.5px', lineHeight: 1.6,
          color: 'rgba(255,248,236,0.78)', margin: 0,
        }}>{text}</p>
      </div>
    </div>
  );
}

/* ─── Field id map (used to focus the first invalid field) ──────────────── */
const FIELD_IDS: Record<string, string> = {
  name:             'ct-name',
  email:            'ct-email',
  phone:            'ct-phone',
  category:         'ct-category',
  message:          'ct-message',
  consent_accepted: 'ct-consent-check',
};

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function Contact() {
  const { settings } = useStoreSettings();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [category, setCategory] = useState('');
  const [message,  setMessage]  = useState('');
  const [consent,  setConsent]  = useState(false);

  const [loading,     setLoading]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [success,     setSuccess]     = useState<{ referenceId?: string; waUrl: string } | null>(null);

  const liveRef = useRef<HTMLSpanElement>(null);

  // Listen for category preselection from other sections (Catering, Gifting CTAs)
  useEffect(() => {
    const handler = (e: Event) => {
      const cat = (e as CustomEvent<string>).detail;
      setCategory(cat);
      setSuccess(null);
      setFieldErrors({});
      setServerError('');
    };
    window.addEventListener(EVENTS.SELECT_CATEGORY, handler);
    return () => window.removeEventListener(EVENTS.SELECT_CATEGORY, handler);
  }, []);

  // Client-side validation — mirrors server/validate.ts rules
  function validateForm(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Please enter your name.';
    } else if (name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }
    if (!email.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!category) {
      errs.category = 'Please select an enquiry category.';
    }
    const trimMsg = message.trim();
    if (trimMsg.length < MIN_MESSAGE) {
      errs.message = 'Please provide at least 10 characters so we can understand your enquiry.';
    }
    if (!consent) {
      errs.consent_accepted = 'Please accept the terms to proceed.';
    }
    return errs;
  }

  function focusFirstError(errs: Record<string, string>) {
    const firstKey = Object.keys(errs)[0];
    if (!firstKey) return;
    const el = document.getElementById(FIELD_IDS[firstKey] ?? firstKey);
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Announce error count to screen readers
    if (liveRef.current) {
      const n = Object.keys(errs).length;
      liveRef.current.textContent = `${n} error${n > 1 ? 's' : ''} found. Please review the highlighted fields.`;
    }
  }

  function fieldErr(f: string) {
    if (!fieldErrors[f]) return null;
    return (
      <span
        id={`${FIELD_IDS[f] ?? f}-error`}
        className="ct-field-error"
        role="alert"
        aria-live="polite"
      >
        {fieldErrors[f]}
      </span>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setServerError('');
    if (liveRef.current) liveRef.current.textContent = '';

    // Client-side validation — prevents round-trip for obvious errors
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      focusFirstError(errs);
      return;
    }

    setLoading(true);
    try {
      const result = await submitContact({
        name, email, phone, category, message,
        consent_accepted: consent,
        location_id: 'bengaluru-sarjapur',
      });

      if (result.success) {
        setSuccess({
          referenceId: result.referenceId,
          waUrl: result.whatsappUrl ?? CATEGORY_WA_URLS[category] ?? WA_URLS.general,
        });
        setName(''); setEmail(''); setPhone('');
        setCategory(''); setMessage(''); setConsent(false);
      } else if (result.fieldErrors && Object.keys(result.fieldErrors).length) {
        // Server returned field-level errors — show inline, no banner
        setFieldErrors(result.fieldErrors);
        focusFirstError(result.fieldErrors);
      } else {
        // True server/network failure — show banner only
        setServerError(result.message ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contact" aria-label="Contact us">
      {/* Screen-reader live region for error announcements */}
      <span ref={liveRef} aria-live="assertive" aria-atomic="true" className="sr-only" style={{ position:'absolute', width:1, height:1, overflow:'hidden', clip:'rect(0,0,0,0)', whiteSpace:'nowrap' }} />
      <style>{`
        /* ── Section ──────────────────────────────────────────────── */
        #contact {
          background: #F6EFE3;
          padding: 90px 24px;
          overflow-x: hidden;
        }
        #contact .ct-wrap {
          max-width: 1180px;
          margin-inline: auto;
        }

        /* ── Two-col grid ─────────────────────────────────────────── */
        #contact .ct-grid {
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 42px;
          align-items: stretch;
        }

        /* ── Header ───────────────────────────────────────────────── */
        #contact .ct-header { margin-bottom: 48px; }
        #contact .ct-eyebrow {
          display: block;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.20em; text-transform: uppercase;
          color: #C99A32; margin-bottom: 16px;
        }
        #contact .ct-h2 {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: clamp(34px, 4.4vw, 54px);
          line-height: 1.04; font-weight: 700;
          color: #55000A; margin: 0 0 16px;
          letter-spacing: -0.025em;
        }
        #contact .ct-h2 em { font-style: normal; font-weight: 700; color: #55000A; }
        #contact .ct-hdivider {
          display: flex; align-items: center;
          gap: 10px; margin-bottom: 14px;
        }
        #contact .ct-hbar {
          width: clamp(28px, 3vw, 42px); height: 1px;
          background: rgba(200,154,61,0.50);
        }
        #contact .ct-sub {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: clamp(14px, 1.1vw, 16px);
          line-height: 1.55; color: #75645C; margin: 0;
          max-width: 520px;
        }

        /* ── Left panel ───────────────────────────────────────────── */
        #contact .ct-panel {
          background: var(--brand-nav);
          border-radius: 24px; padding: 38px;
          color: #FFF8EC; position: relative;
          overflow: hidden; display: flex;
          flex-direction: column; gap: 28px;
        }
        #contact .ct-panel-title {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: clamp(20px, 2.2vw, 26px);
          font-weight: 700; line-height: 1.15;
          letter-spacing: -0.02em;
          color: #FFF8EC; margin: 0;
        }
        #contact .ct-panel-title em { font-style: normal; color: #D4AA45; }
        #contact .ct-panel-footer {
          margin-top: auto; padding-top: 24px;
          border-top: 1px solid rgba(200,154,61,0.22);
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 13.5px; font-style: normal;
          color: rgba(240,199,78,0.85);
        }

        /* ── Form card ────────────────────────────────────────────── */
        #contact .ct-card {
          background: rgba(255,253,248,0.96);
          border: 1px solid rgba(200,154,61,0.34);
          border-radius: 24px; padding: 38px;
          box-shadow: 0 18px 50px rgba(85,0,10,0.10);
        }

        /* ── Form fields ──────────────────────────────────────────── */
        #contact .ct-form { display: flex; flex-direction: column; gap: 18px; }
        #contact .ct-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        #contact .ct-label {
          display: block;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11.5px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: #55000A; margin-bottom: 6px;
        }
        #contact .ct-input,
        #contact .ct-textarea,
        #contact .ct-select {
          width: 100%; box-sizing: border-box;
          background: #FFFDF8;
          border: 1px solid rgba(200,154,61,0.35);
          border-radius: 12px;
          padding: 13px 15px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14.5px; color: #3D2A25;
          outline: none;
          transition: border-color 0.20s, box-shadow 0.20s;
          min-height: 50px;
        }
        #contact .ct-input::placeholder,
        #contact .ct-textarea::placeholder { color: #A08D82; }
        #contact .ct-input:focus,
        #contact .ct-textarea:focus,
        #contact .ct-select:focus {
          border-color: #C99A32;
          box-shadow: 0 0 0 4px rgba(200,154,61,0.12);
        }
        #contact .ct-select { appearance: none; cursor: pointer; }
        #contact .ct-select-wrap { position: relative; }
        #contact .ct-select-arrow {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          pointer-events: none; color: #C99A32;
        }
        #contact .ct-textarea {
          min-height: 130px; resize: vertical; line-height: 1.6;
        }
        #contact .ct-field-error {
          color: #C0392B; font-size: 12px; margin-top: 5px;
          font-family: Inter, sans-serif; display: block;
        }
        #contact .ct-input--error,
        #contact .ct-select--error,
        #contact .ct-textarea--error {
          border-color: rgba(192,57,43,0.55);
          box-shadow: 0 0 0 3px rgba(192,57,43,0.08);
        }

        /* ── Autofill — override browser blue/yellow tint ─────────── */
        #contact .ct-input:-webkit-autofill,
        #contact .ct-input:-webkit-autofill:hover,
        #contact .ct-input:-webkit-autofill:focus,
        #contact .ct-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #FFFDF8 inset !important;
          -webkit-text-fill-color: #3D2A25 !important;
          caret-color: #3D2A25;
          transition: background-color 9999s ease-in-out 0s;
        }

        /* ── Consent checkbox ─────────────────────────────────────── */
        #contact .ct-consent {
          display: flex; align-items: flex-start;
          gap: 10px; cursor: pointer;
        }
        #contact .ct-consent input[type="checkbox"] {
          margin-top: 2px; flex-shrink: 0;
          width: 16px; height: 16px; accent-color: #55000A;
          cursor: pointer;
        }
        #contact .ct-consent-text {
          font-family: Inter, sans-serif;
          font-size: 12px; line-height: 1.6;
          color: #75645C;
        }
        #contact .ct-consent-text a { color: #C99A32; }

        /* ── Submit button ────────────────────────────────────────── */
        #contact .ct-submit {
          display: inline-flex; align-items: center; gap: 9px;
          background: #55000A; color: #FFF8EC;
          border: 1px solid #55000A; border-radius: 999px;
          height: 50px; padding: 0 28px;
          font-family: Inter, sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; transition: background 0.22s, border-color 0.22s,
                      color 0.22s, transform 0.22s, opacity 0.22s;
          align-self: flex-start;
        }
        #contact .ct-submit:hover:not(:disabled) {
          background: #C99A32; border-color: #C99A32; color: #55000A;
          transform: translateY(-2px);
        }
        #contact .ct-submit:disabled {
          opacity: 0.60; cursor: not-allowed;
        }
        #contact .ct-submit:focus-visible {
          outline: 2px solid #C99A32; outline-offset: 3px;
        }

        /* ── Server error ─────────────────────────────────────────── */
        #contact .ct-server-error {
          background: rgba(192,57,43,0.08);
          border: 1px solid rgba(192,57,43,0.30);
          border-radius: 10px; padding: 12px 16px;
          font-family: Inter, sans-serif;
          font-size: 13px; color: #C0392B; line-height: 1.5;
        }

        /* ── Success state ────────────────────────────────────────── */
        #contact .ct-success {
          text-align: center; padding: 44px 24px;
          border: 1px solid rgba(200,154,61,0.28);
          border-radius: 20px; background: #FFFDF8;
        }
        #contact .ct-wa-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: #25D366; color: #fff;
          text-decoration: none; border-radius: 999px;
          padding: 0 22px; height: 44px;
          font-family: Inter, sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-top: 18px; transition: transform 0.20s, box-shadow 0.20s;
        }
        #contact .ct-wa-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37,211,102,0.26);
        }

        /* ── Tablet 900px – 1024px ────────────────────────────────── */
        @media (min-width: 900px) and (max-width: 1024px) {
          #contact .ct-grid { grid-template-columns: 0.8fr 1.2fr; gap: 28px; }
          #contact { padding: 72px 24px; }
        }

        /* ── Stack below 900px ────────────────────────────────────── */
        @media (max-width: 899px) {
          #contact .ct-grid { grid-template-columns: 1fr; gap: 24px; }
          #contact .ct-header { margin-bottom: 32px; text-align: center; }
          #contact .ct-h2 { font-size: clamp(38px, 9vw, 52px); }
          #contact .ct-sub { margin-inline: auto; }
          #contact .ct-hdivider { justify-content: center; }
        }

        /* ── Mobile < 768px ───────────────────────────────────────── */
        @media (max-width: 767px) {
          #contact { padding: 44px 16px 48px; }
          #contact .ct-h2 { font-size: clamp(32px, 8.5vw, 44px); }
          #contact .ct-panel { padding: 22px 18px; gap: 18px; border-radius: 16px; }
          #contact .ct-card  { padding: 20px 16px; border-radius: 16px; }
          #contact .ct-row   { grid-template-columns: 1fr; }
          #contact .ct-input, #contact .ct-textarea,
          #contact .ct-select { min-height: 48px; font-size: 16px; }
          #contact .ct-submit {
            width: 100%; justify-content: center; align-self: stretch;
          }
        }

        @media (max-width: 360px) {
          #contact .ct-h2  { font-size: 28px; }
          #contact .ct-panel { padding: 18px 14px; }
          #contact .ct-card  { padding: 16px 12px; }
        }
      `}</style>

      <div className="ct-wrap">

        {/* ── Heading ─────────────────────────────────────────────── */}
        <div className="ct-header">
          <span className="ct-eyebrow">Contact</span>
          <h2 className="ct-h2">
            Send Us<br />
            <em>an Enquiry</em>
          </h2>
          <div className="ct-hdivider">
            <div className="ct-hbar" />
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M5 0.5L9.5 5L5 9.5L0.5 5Z" stroke="#C99A32" strokeWidth="0.9" fill="rgba(200,154,61,0.18)" />
              <circle cx="5" cy="5" r="1.7" fill="#C99A32" />
            </svg>
            <div className="ct-hbar" />
          </div>
          <p className="ct-sub">
            Whether it is a family meal, a celebration or a quick hello, we would love to hear from you.
          </p>
        </div>

        {/* ── Two-column grid ─────────────────────────────────────── */}
        <div className="ct-grid">

          {/* Left — info panel */}
          <div className="ct-panel">
            <h3 className="ct-panel-title">
              We are always<br /><em>happy to hear from you</em>
            </h3>

            <InfoBlock
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="3" width="16" height="12" rx="2" stroke="#D4AA45" strokeWidth="1.2"/>
                  <path d="M1 6l8 5 8-5" stroke="#D4AA45" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              }
              title="Email Us"
              text={settings.contact?.email || BUSINESS.email}
            />

            <InfoBlock
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7.5" stroke="#D4AA45" strokeWidth="1.2"/>
                  <path d="M9 5v4.5l3 1.5" stroke="#D4AA45" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="Quick Response"
              text="Our team will get back to you as soon as possible."
            />

            <InfoBlock
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2l1.8 3.6L15 6.3l-3 2.9.7 4.1L9 11.2l-3.7 2.1.7-4.1L3 6.3l4.2-.7z" stroke="#D4AA45" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
              }
              title="Special Requests"
              text="Tell us about birthdays, décor, gifting or catering requirements."
            />

            <p className="ct-panel-footer">THE NAMKEEN & SNACKS HUB</p>
          </div>

          {/* Right — form card */}
          <div className="ct-card">
            {success ? (
              <div className="ct-success">
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ margin: '0 auto 18px', display: 'block' }}>
                  <circle cx="22" cy="22" r="20" stroke="#C99A32" strokeWidth="1.4" fill="none"/>
                  <path d="M13 22l6 6 12-12" stroke="#55000A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: '20px', fontWeight: 700, letterSpacing: '-0.015em', color: '#55000A', margin: '0 0 8px' }}>
                  Enquiry received!
                </p>
                <p style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: '14px', color: '#75645C', margin: '0 0 4px', lineHeight: 1.6 }}>
                  Your enquiry has been received. Our team will contact you shortly.
                </p>
                {success.referenceId && (
                  <p style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: '12px', color: '#A08D82', margin: '8px 0 0' }}>
                    Reference: <strong style={{ color: '#55000A' }}>{formatReferenceId(success.referenceId)}</strong>
                  </p>
                )}
                <a
                  href={success.waUrl}
                  className="ct-wa-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {WA_ICON}
                  Follow up on WhatsApp
                </a>
                <br />
                <button
                  onClick={() => setSuccess(null)}
                  style={{
                    marginTop: '12px', background: 'none', border: 'none',
                    fontFamily: 'Inter, sans-serif', fontSize: '12px',
                    color: '#A08D82', cursor: 'pointer', textDecoration: 'underline',
                  }}
                >
                  Send another enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="ct-form">

                {/* Name + Email */}
                <div className="ct-row">
                  <div>
                    <label htmlFor="ct-name" className="ct-label">Your Name *</label>
                    <input
                      id="ct-name"
                      className={`ct-input${fieldErrors.name ? ' ct-input--error' : ''}`}
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      autoComplete="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={fieldErrors.name ? 'ct-name-error' : undefined}
                      required
                    />
                    {fieldErr('name')}
                  </div>
                  <div>
                    <label htmlFor="ct-email" className="ct-label">Email Address *</label>
                    <input
                      id="ct-email"
                      className={`ct-input${fieldErrors.email ? ' ct-input--error' : ''}`}
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? 'ct-email-error' : undefined}
                      required
                    />
                    {fieldErr('email')}
                  </div>
                </div>

                {/* Phone + Category */}
                <div className="ct-row">
                  <div>
                    <label htmlFor="ct-phone" className="ct-label">Phone Number</label>
                    <input
                      id="ct-phone"
                      className={`ct-input${fieldErrors.phone ? ' ct-input--error' : ''}`}
                      type="tel"
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      aria-invalid={!!fieldErrors.phone}
                      aria-describedby={fieldErrors.phone ? 'ct-phone-error' : undefined}
                    />
                    {fieldErr('phone')}
                  </div>
                  <div>
                    <label htmlFor="ct-category" className="ct-label">Enquiry Type *</label>
                    <div className="ct-select-wrap">
                      <select
                        id="ct-category"
                        className={`ct-select${fieldErrors.category ? ' ct-select--error' : ''}`}
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        aria-invalid={!!fieldErrors.category}
                        aria-describedby={fieldErrors.category ? 'ct-category-error' : undefined}
                        required
                      >
                        <option value="">Select a category…</option>
                        {CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <span className="ct-select-arrow" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </div>
                    {fieldErr('category')}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="ct-message" className="ct-label">Your Message *</label>
                  <textarea
                    id="ct-message"
                    className={`ct-textarea${fieldErrors.message ? ' ct-textarea--error' : ''}`}
                    placeholder={MESSAGE_PLACEHOLDERS[category] ?? 'Tell us what you need'}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    aria-invalid={!!fieldErrors.message}
                    aria-describedby={fieldErrors.message ? 'ct-message-error' : undefined}
                    required
                  />
                  {fieldErr('message')}
                </div>

                {/* Consent */}
                <div>
                  <label className="ct-consent">
                    <input
                      id="ct-consent-check"
                      type="checkbox"
                      checked={consent}
                      onChange={e => setConsent(e.target.checked)}
                      aria-invalid={!!fieldErrors.consent_accepted}
                      aria-describedby={fieldErrors.consent_accepted ? 'ct-consent-check-error' : undefined}
                    />
                    <span className="ct-consent-text">
                      I agree that Malwa Namkeen House may use the information I have provided to respond to my enquiry.
                      I have read and accept the{' '}
                      <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                    </span>
                  </label>
                  {fieldErr('consent_accepted')}
                </div>

                {/* Honeypot — hidden from humans */}
                <input type="text" name="_hp" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

                {/* Server/network error banner — only shown when no field errors exist */}
                {serverError && Object.keys(fieldErrors).length === 0 && (
                  <div className="ct-server-error" role="alert" aria-live="assertive">{serverError}</div>
                )}

                <button
                  type="submit"
                  className="ct-submit"
                  disabled={loading}
                >
                  {loading ? 'Sending…' : 'Send Enquiry'}
                  {!loading && (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                      <path d="M1 6.5h10.5M7 2l4.5 4.5L7 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
