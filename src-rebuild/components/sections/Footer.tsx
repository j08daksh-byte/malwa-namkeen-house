import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BUSINESS } from '../../lib/business';
import { NAV_LINKS } from '../../data/nav-links';

const LEGAL_LINKS = [
  { label: 'Privacy Policy',      href: '/privacy-policy'       },
  { label: 'Terms & Conditions',  href: '/terms-and-conditions' },
  { label: 'Cancellation Policy', href: '/cancellation-policy'  },
  { label: 'Refund Policy',       href: '/refund-policy'        },
];

function SocialBtn({ label, path, href }: { label: string; path: string; href?: string }) {
  const [hov, setHov] = useState(false);
  const isPlaceholder = !href || href === '#';
  return (
    <a
      href={href ?? '#'}
      aria-label={isPlaceholder ? `${label} (coming soon)` : label}
      aria-disabled={isPlaceholder}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={e => { if (isPlaceholder) e.preventDefault(); }}
      title={isPlaceholder ? `${label} — link coming soon` : label}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: '50%',
        border: `1px solid ${hov ? 'rgba(200,154,61,0.65)' : 'rgba(255,249,239,0.14)'}`,
        background: hov ? 'rgba(200,154,61,0.14)' : 'rgba(255,249,239,0.04)',
        transition: 'border-color 0.22s, background 0.22s, transform 0.22s',
        transform: hov ? 'translateY(-2px)' : 'none',
        textDecoration: 'none',
        opacity: isPlaceholder ? 0.45 : 1,
        cursor: isPlaceholder ? 'not-allowed' : 'pointer',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d={path} stroke={hov ? '#D4AA45' : 'rgba(255,249,239,0.58)'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </a>
  );
}

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    if (href.startsWith('/')) {
      navigate(href);
    } else if (location.pathname === '/') {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/${href}`);
    }
  };

  return (
    <footer id="footer-section">
      <style>{`
        #footer-section {
          background: linear-gradient(180deg, #55000A 0%, #3D0007 100%);
          color: rgba(255,249,239,0.68);
          padding: clamp(52px,6vw,80px) 0 0;
          position: relative;
          overflow: hidden;
        }
        #footer-section::before {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 700px; height: 260px;
          background: radial-gradient(ellipse at center, rgba(200,154,61,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        #footer-section .ft-inner {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 clamp(16px,3vw,48px);
          position: relative;
        }
        #footer-section .ft-grid {
          display: grid;
          grid-template-columns: 1.5fr 0.7fr 0.7fr 1.1fr;
          gap: clamp(28px, 3.5vw, 56px);
          padding-bottom: clamp(40px, 5vw, 60px);
          border-bottom: 1px solid rgba(200,154,61,0.14);
        }
        #footer-section .ft-col-head {
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #C99A32;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        #footer-section .ft-col-head::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(200,154,61,0.20);
        }

        /* ── Brand column ──────────────────────────────────── */
        #footer-section .ft-brand-desc {
          font-family: Inter, sans-serif;
          font-size: 14.5px;
          font-weight: 500;
          line-height: 1.78;
          max-width: 290px;
          margin-bottom: 22px;
          color: rgba(255,249,239,0.78);
        }
        #footer-section .ft-contact-row {
          display: flex;
          align-items: center;
          gap: 9px;
          font-family: Inter, sans-serif;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.6;
          color: rgba(255,249,239,0.82);
          margin-bottom: 10px;
        }
        #footer-section .ft-contact-row a {
          color: rgba(255,249,239,0.82);
          text-decoration: none;
          transition: color 0.15s;
        }
        #footer-section .ft-contact-row a:hover { color: #D4AA45; }
        #footer-section .ft-socials {
          display: flex;
          gap: 8px;
          margin-top: 20px;
        }

        /* ── Navigate column ───────────────────────────────── */
        #footer-section .ft-nav-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 13px;
          padding: 0; margin: 0;
        }
        #footer-section .ft-nav-links a {
          font-family: Inter, sans-serif;
          font-size: 14.5px;
          font-weight: 500;
          color: rgba(255,249,239,0.82);
          text-decoration: none;
          transition: color 0.18s;
          letter-spacing: 0.01em;
        }
        #footer-section .ft-nav-links a:hover { color: #D4AA45; }

        /* ── Legal column ──────────────────────────────────── */
        #footer-section .ft-legal-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 13px;
          padding: 0; margin: 0;
        }
        #footer-section .ft-legal-links a {
          font-family: Inter, sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,249,239,0.80);
          text-decoration: none;
          transition: color 0.18s;
          letter-spacing: 0.01em;
        }
        #footer-section .ft-legal-links a:hover { color: #D4AA45; }

        /* ── Hours & Address column ────────────────────────── */
        #footer-section .ft-hours {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 18px;
        }
        #footer-section .ft-hours-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 0;
          border-bottom: 1px solid rgba(200,154,61,0.09);
        }
        #footer-section .ft-hours-row:last-child { border-bottom: none; }
        #footer-section .ft-hours-day {
          font-family: Inter, sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,249,239,0.75);
        }
        #footer-section .ft-hours-time {
          font-family: Inter, sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,249,239,0.85);
          white-space: nowrap;
        }
        #footer-section .ft-address {
          font-style: normal;
          font-family: Inter, sans-serif;
          font-size: 13px;
          line-height: 1.80;
          font-weight: 500;
          color: rgba(255,249,239,0.72);
          padding-top: 14px;
          border-top: 1px solid rgba(200,154,61,0.11);
        }
        #footer-section .ft-reg {
          margin-top: 12px;
          font-family: Inter, sans-serif;
          font-size: 11.5px;
          font-weight: 500;
          line-height: 2.0;
          color: rgba(255,249,239,0.50);
          letter-spacing: 0.01em;
        }

        /* ── Bottom bar ────────────────────────────────────── */
        #footer-section .ft-bottom {
          padding: clamp(14px, 2.5vw, 22px) 0;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: space-between;
          align-items: center;
        }
        #footer-section .ft-bottom-copy,
        #footer-section .ft-bottom-tagline {
          font-family: Inter, sans-serif;
          font-size: 12.5px;
          font-weight: 500;
          color: rgba(255,249,239,0.55);
          letter-spacing: 0.02em;
        }

        /* ── Tablet 768–1180px ─────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1180px) {
          #footer-section .ft-grid {
            grid-template-columns: 1fr 1fr;
            gap: 36px 32px;
          }
        }

        /* ── Mobile ≤ 767px ────────────────────────────────── */
        @media (max-width: 767px) {
          #footer-section .ft-grid {
            grid-template-columns: 1fr 1fr;
            gap: 28px 20px;
          }
          #footer-section .ft-col-brand {
            grid-column: 1 / -1;
          }
          #footer-section .ft-brand-desc { max-width: 100%; }
          #footer-section .ft-bottom {
            flex-direction: column;
            text-align: center;
            gap: 6px;
          }
        }

        /* ── Very small ≤ 430px ────────────────────────────── */
        @media (max-width: 430px) {
          #footer-section .ft-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="ft-inner">
        <div className="ft-grid">

          {/* ── Column 1: Brand + Contact ── */}
          <div className="ft-col-brand">
            <div style={{ marginBottom: '16px' }}>
              <img
                src="/mishtichaat/logo.svg"
                alt="MishtiChaat"
                style={{ height: '42px', width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.88 }}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <p className="ft-brand-desc">
              Banaras heritage on every plate — handcrafted mithai, authentic chaat and traditional flavours brought to Bengaluru.
            </p>
            <div className="ft-contact-row">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="rgba(200,154,61,0.55)" strokeWidth="1.1"/>
                <path d="M1 5l6 3.5L13 5" stroke="rgba(200,154,61,0.55)" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
              <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
            </div>
            <div className="ft-contact-row">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 2h2.5l1 2.5-1.5 1.5c.75 1.75 2 3 3.75 3.75l1.5-1.5L11.5 9.5V12C8 12.5 1.5 8.5 2 2z" stroke="rgba(200,154,61,0.55)" strokeWidth="1.1" strokeLinejoin="round"/>
              </svg>
              <a href={`tel:${BUSINESS.whatsappNumber}`}>{BUSINESS.phone}</a>
            </div>
            <div className="ft-socials">
              <SocialBtn label="Instagram" path="M11 1H5a4 4 0 00-4 4v6a4 4 0 004 4h6a4 4 0 004-4V5a4 4 0 00-4-4zM8 11a3 3 0 110-6 3 3 0 010 6zm3.5-6.5a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </div>
          </div>

          {/* ── Column 2: Navigate ── */}
          <div>
            <p className="ft-col-head">Navigate</p>
            <ul className="ft-nav-links">
              {NAV_LINKS.map(l => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={e => handleNavigation(e, l.href)}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Legal ── */}
          <div>
            <p className="ft-col-head">Legal</p>
            <ul className="ft-legal-links">
              {LEGAL_LINKS.map(l => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Hours + Address ── */}
          <div>
            <p className="ft-col-head">Opening Hours</p>
            <div className="ft-hours">
              {BUSINESS.hours.map(h => (
                <div key={h.days} className="ft-hours-row">
                  <span className="ft-hours-day">{h.days}</span>
                  <span className="ft-hours-time">{h.open} – {h.close}</span>
                </div>
              ))}
            </div>
            <address className="ft-address">
              {BUSINESS.address.line1}<br />
              {BUSINESS.address.line2}<br />
              {BUSINESS.address.city} – {BUSINESS.address.postalCode}<br />
              {BUSINESS.address.state}, {BUSINESS.address.country}
            </address>
            <div className="ft-reg">
              <div>GST: {BUSINESS.gstNumber}</div>
              <div>FSSAI: {BUSINESS.fssaiNumber}</div>
            </div>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div className="ft-bottom">
          <p className="ft-bottom-copy">
            © {new Date().getFullYear()} MishtiChaat. All rights reserved.
          </p>
          <p className="ft-bottom-tagline">Made with heritage &amp; heart in Banaras.</p>
        </div>

      </div>
    </footer>
  );
}
