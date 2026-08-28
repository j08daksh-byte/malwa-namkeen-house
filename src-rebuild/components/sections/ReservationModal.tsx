import { useState, useEffect, useCallback, useRef } from 'react';
import { submitReservation } from '../../lib/api.ts';
import { WA_URLS } from '../../lib/whatsapp.ts';

const TIMES = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM',
];

const WA_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L.057 23.985l6.304-1.648A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-5.002-1.368l-.358-.213-3.743.979 1.003-3.648-.234-.374A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/>
  </svg>
);

/** Minimum date string for the date input (today in YYYY-MM-DD) */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ReservationModal({ open, onClose }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [email,        setEmail]        = useState('');
  const [phone,        setPhone]        = useState('');
  const [date,         setDate]         = useState('');
  const [time,         setTime]         = useState('');
  const [guests,       setGuests]       = useState('');
  const [specialReq,   setSpecialReq]   = useState('');
  const [consent,      setConsent]      = useState(false);

  const [loading,     setLoading]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [success,     setSuccess]     = useState<{ referenceId?: string } | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap — cycle Tab/Shift+Tab within the modal
  useEffect(() => {
    if (!open) return;
    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const els = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    // Set initial focus
    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [open]);

  // Escape key + body scroll lock
  const close = useCallback(() => {
    if (loading) return;
    setSuccess(null);
    setFieldErrors({});
    setServerError('');
    onClose();
  }, [loading, onClose]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [open, close]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function fieldErr(f: string) {
    return fieldErrors[f]
      ? <span className="rm-field-error">{fieldErrors[f]}</span>
      : null;
  }

  function resetForm() {
    setCustomerName(''); setEmail(''); setPhone('');
    setDate(''); setTime(''); setGuests('');
    setSpecialReq(''); setConsent(false);
    setFieldErrors({}); setServerError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setServerError('');

    if (!consent) {
      setFieldErrors({ consent_accepted: 'Please accept the terms to proceed.' });
      return;
    }

    const guestCount = parseInt(guests, 10);
    if (!guests || isNaN(guestCount) || guestCount < 1) {
      setFieldErrors({ guest_count: 'Please enter a valid number of guests.' });
      return;
    }

    setLoading(true);
    try {
      const result = await submitReservation({
        customer_name:    customerName,
        email,
        phone,
        reservation_date: date,
        preferred_time:   time,
        guest_count:      guestCount,
        special_request:  specialReq,
        consent_accepted: consent,
        location_id:      'bengaluru-sarjapur',
      });

      if (result.success) {
        setSuccess({ referenceId: result.referenceId });
        resetForm();
      } else {
        if (result.fieldErrors && Object.keys(result.fieldErrors).length) {
          setFieldErrors(result.fieldErrors);
        }
        setServerError(result.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <style>{`
        .rm-overlay {
          position: fixed; inset: 0; z-index: 900;
          background: rgba(30,5,12,0.72);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: clamp(8px, 3vw, 16px);
          animation: rm-fade-in 0.22s ease;
        }
        @keyframes rm-fade-in { from { opacity: 0; } to { opacity: 1; } }

        .rm-panel {
          background: #FFFDF8;
          border-radius: 20px;
          width: 100%; max-width: 560px;
          max-height: calc(100dvh - 24px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          box-shadow: 0 32px 80px rgba(30,5,12,0.36);
          animation: rm-slide-up 0.26s cubic-bezier(0.34,1.56,0.64,1);
          position: relative;
        }
        @keyframes rm-slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }

        .rm-header {
          background: #55000A; border-radius: 20px 20px 0 0;
          padding: 24px 28px 20px; position: relative;
        }
        .rm-header-title {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: clamp(19px, 4.5vw, 22px); font-weight: 700;
          letter-spacing: -0.015em;
          color: #FFF8EC; margin: 0 0 6px; line-height: 1.15;
          padding-right: 36px;
        }
        .rm-header-sub {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 13px; color: rgba(255,248,236,0.75);
          margin: 0; line-height: 1.5;
        }
        .rm-close {
          position: absolute; top: 16px; right: 16px;
          background: rgba(255,248,236,0.12); border: none;
          border-radius: 8px; width: 34px; height: 34px;
          display: grid; place-items: center;
          cursor: pointer; color: rgba(255,248,236,0.85);
          transition: background 0.18s, color 0.18s;
        }
        .rm-close:hover { background: rgba(255,248,236,0.22); color: #FFF8EC; }

        .rm-notice {
          background: rgba(200,154,61,0.10);
          border: 1px solid rgba(200,154,61,0.35);
          border-radius: 10px; padding: 11px 14px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px; color: #75645C; line-height: 1.55;
          margin-bottom: 16px;
        }
        .rm-notice strong { color: #55000A; }

        .rm-body { padding: 22px 28px 28px; }
        .rm-form { display: flex; flex-direction: column; gap: 14px; }
        .rm-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .rm-label {
          display: block; margin-bottom: 5px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: #55000A;
        }
        .rm-input, .rm-select, .rm-textarea {
          width: 100%; box-sizing: border-box;
          background: #FFFDF8;
          border: 1px solid rgba(200,154,61,0.35);
          border-radius: 10px;
          padding: 11px 13px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14px; color: #3D2A25;
          outline: none;
          transition: border-color 0.20s, box-shadow 0.20s;
          min-height: 46px;
        }
        .rm-input::placeholder, .rm-textarea::placeholder { color: #A08D82; }
        .rm-input:focus, .rm-select:focus, .rm-textarea:focus {
          border-color: #C99A32;
          box-shadow: 0 0 0 3px rgba(200,154,61,0.12);
        }
        .rm-input--error, .rm-select--error, .rm-textarea--error {
          border-color: rgba(192,57,43,0.55);
        }
        .rm-select { appearance: none; cursor: pointer; }
        .rm-select-wrap { position: relative; }
        .rm-select-arrow {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%); pointer-events: none;
          color: #C99A32;
        }
        .rm-textarea { min-height: 85px; resize: vertical; line-height: 1.55; }

        .rm-field-error {
          display: block; color: #C0392B;
          font-family: Inter, sans-serif;
          font-size: 11px; margin-top: 4px;
        }

        .rm-consent {
          display: flex; align-items: flex-start;
          gap: 9px; cursor: pointer;
        }
        .rm-consent input { margin-top: 2px; accent-color: #55000A; cursor: pointer; }
        .rm-consent-text {
          font-family: Inter, sans-serif;
          font-size: 12px; color: #75645C; line-height: 1.6;
        }
        .rm-consent-text a { color: #C99A32; }

        .rm-server-error {
          background: rgba(192,57,43,0.08);
          border: 1px solid rgba(192,57,43,0.28);
          border-radius: 8px; padding: 10px 14px;
          font-family: Inter, sans-serif;
          font-size: 12px; color: #C0392B; line-height: 1.5;
        }

        .rm-submit {
          background: #55000A; color: #FFF8EC;
          border: none; border-radius: 999px;
          min-height: 48px; padding: 12px 20px;
          font-family: Inter, sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; width: 100%;
          transition: background 0.22s, transform 0.22s, opacity 0.22s;
          display: flex; align-items: center; justify-content: center;
          text-align: center;
        }
        .rm-submit:hover:not(:disabled) {
          background: #C99A32; transform: translateY(-2px);
        }
        .rm-submit:disabled { opacity: 0.60; cursor: not-allowed; }

        .rm-success {
          text-align: center; padding: 12px 0;
        }
        .rm-wa-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: #25D366; color: #fff;
          text-decoration: none; border-radius: 999px;
          padding: 0 20px; height: 44px; width: 100%;
          justify-content: center;
          font-family: Inter, sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-top: 16px;
          transition: transform 0.20s, box-shadow 0.20s;
        }
        .rm-wa-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,211,102,0.26); }

        @media (max-width: 540px) {
          .rm-header { padding: 20px 18px 16px; }
          .rm-body   { padding: 18px 16px calc(20px + env(safe-area-inset-bottom, 0px)); }
          .rm-row    { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Backdrop */}
      <div className="rm-overlay" onClick={e => { if (e.target === e.currentTarget) close(); }} role="dialog" aria-modal="true" aria-labelledby="rm-title">

        <div className="rm-panel" ref={dialogRef}>

          {/* Header */}
          <div className="rm-header">
            <h2 id="rm-title" className="rm-header-title">Bulk &amp; Gifting Enquiry</h2>
            <p className="rm-header-sub">Send us your requirements for bulk namkeens, wedding boxes, or corporate hampers.</p>
            <button className="rm-close" onClick={close} aria-label="Close enquiry form">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="rm-body">

            {success ? (
              <div className="rm-success">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 16px', display: 'block' }}>
                  <circle cx="24" cy="24" r="22" stroke="#C99A32" strokeWidth="1.5" fill="none"/>
                  <path d="M14 24l7 7 13-14" stroke="#55000A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: '20px', fontWeight: 700, letterSpacing: '-0.015em', color: '#55000A', margin: '0 0 10px' }}>
                  Enquiry received!
                </p>
                <div className="rm-notice" style={{ textAlign: 'left' }}>
                  <strong>Thank you! Your bulk/gifting enquiry has been received.</strong>
                  {' '}Our team will contact you shortly with customized quotations.
                </div>
                {success.referenceId && (
                  <p style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: '12px', color: '#A08D82', margin: '0 0 4px' }}>
                    Reference: <strong style={{ color: '#55000A' }}>{success.referenceId}</strong>
                  </p>
                )}
                <a href={WA_URLS.reservation} className="rm-wa-btn" target="_blank" rel="noopener noreferrer">
                  {WA_ICON}
                  Follow up on WhatsApp
                </a>
                <button
                  onClick={close}
                  style={{
                    marginTop: '12px', background: 'none', border: 'none',
                    fontFamily: 'Inter, sans-serif', fontSize: '12px',
                    color: '#A08D82', cursor: 'pointer', textDecoration: 'underline',
                    display: 'block', width: '100%', textAlign: 'center',
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="rm-form">

                <div className="rm-notice">
                  <strong>Gifting &amp; Bulk supply.</strong> We will contact you via WhatsApp or email with packaging options and volume rates.
                </div>

                {/* Name + Email */}
                <div className="rm-row">
                  <div>
                    <label htmlFor="rm-name" className="rm-label">Full Name *</label>
                    <input
                      id="rm-name"
                      className={`rm-input${fieldErrors.customer_name ? ' rm-input--error' : ''}`}
                      type="text" placeholder="Priya Sharma"
                      autoComplete="name"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      required
                    />
                    {fieldErr('customer_name')}
                  </div>
                  <div>
                    <label htmlFor="rm-email" className="rm-label">Email *</label>
                    <input
                      id="rm-email"
                      className={`rm-input${fieldErrors.email ? ' rm-input--error' : ''}`}
                      type="email" placeholder="you@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                    {fieldErr('email')}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="rm-phone" className="rm-label">Phone Number *</label>
                  <input
                    id="rm-phone"
                    className={`rm-input${fieldErrors.phone ? ' rm-input--error' : ''}`}
                    type="tel" placeholder="+91 98765 43210"
                    autoComplete="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                  {fieldErr('phone')}
                </div>

                {/* Date + Time */}
                <div className="rm-row">
                  <div>
                    <label htmlFor="rm-date" className="rm-label">Date *</label>
                    <input
                      id="rm-date"
                      className={`rm-input${fieldErrors.reservation_date ? ' rm-input--error' : ''}`}
                      type="date"
                      min={todayStr()}
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                    />
                    {fieldErr('reservation_date')}
                  </div>
                  <div>
                    <label htmlFor="rm-time" className="rm-label">Preferred Time *</label>
                    <div className="rm-select-wrap">
                      <select
                        id="rm-time"
                        className={`rm-select${fieldErrors.preferred_time ? ' rm-select--error' : ''}`}
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        required
                      >
                        <option value="">Select time…</option>
                        {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="rm-select-arrow" aria-hidden="true">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </div>
                    {fieldErr('preferred_time')}
                  </div>
                </div>

                {/* Guests */}
                <div>
                  <label htmlFor="rm-guests" className="rm-label">Number of Guests *</label>
                  <input
                    id="rm-guests"
                    className={`rm-input${fieldErrors.guest_count ? ' rm-input--error' : ''}`}
                    type="number" placeholder="e.g. 4"
                    min="1" max="200"
                    value={guests}
                    onChange={e => setGuests(e.target.value)}
                    required
                  />
                  {fieldErr('guest_count')}
                </div>

                {/* Special request */}
                <div>
                  <label htmlFor="rm-special" className="rm-label">Special Requests</label>
                  <textarea
                    id="rm-special"
                    className="rm-textarea"
                    placeholder="Dietary needs, occasion, seating preference, décor requests…"
                    value={specialReq}
                    onChange={e => setSpecialReq(e.target.value)}
                  />
                </div>

                {/* Consent */}
                <div>
                  <label className="rm-consent">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={e => setConsent(e.target.checked)}
                    />
                    <span className="rm-consent-text">
                      I agree that Malwa Namkeen House may use my details to respond to this order enquiry.
                      I understand this requires manual confirmation from the store team.
                    </span>
                  </label>
                  {fieldErr('consent_accepted')}
                </div>

                {/* Honeypot */}
                <input type="text" name="_hp" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

                {serverError && (
                  <div className="rm-server-error" role="alert">{serverError}</div>
                )}

                <button type="submit" className="rm-submit" disabled={loading}>
                  {loading ? 'Submitting…' : 'Submit Gifting & Bulk Enquiry'}
                </button>

              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
