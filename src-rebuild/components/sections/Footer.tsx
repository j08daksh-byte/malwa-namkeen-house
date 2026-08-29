import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStoreSettings } from '../../lib/storeSettingsContext';
import { NAV_LINKS } from '../../data/nav-links';

const LEGAL_LINKS = [
  { label: 'Frequently Asked Questions', href: '/faq' },
  { label: 'Privacy Policy',      href: '/privacy-policy'       },
  { label: 'Terms & Conditions',  href: '/terms-and-conditions' },
  { label: 'Cancellation Policy', href: '/cancellation-policy'  },
  { label: 'Refund Policy',       href: '/refund-policy'        },
];

function isValidLink(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed !== '' && trimmed !== '#' && trimmed !== 'undefined' && trimmed !== 'null';
}

function SocialBtn({ label, path, href }: { label: string; path: string; href?: string }) {
  const [hov, setHov] = useState(false);
  if (!isValidLink(href)) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: '50%',
        border: `1px solid ${hov ? 'rgba(200,154,61,0.65)' : 'rgba(255,249,239,0.14)'}`,
        background: hov ? 'rgba(200,154,61,0.14)' : 'rgba(255,249,239,0.04)',
        transition: 'border-color 0.22s, background 0.22s, transform 0.22s',
        transform: hov ? 'translateY(-2px)' : 'none',
        textDecoration: 'none',
        cursor: 'pointer',
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
  const { settings } = useStoreSettings();

  const handleNavigation = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    const isHashLink = href.includes('#');
    if (href === '/') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
    } else if (isHashLink) {
      if (location.pathname === '/') {
        const cleanId = href.replace(/^(\/)?#/, '');
        const target = document.getElementById(cleanId);
        if (target) {
          const topPos = target.getBoundingClientRect().top + window.scrollY - 68;
          window.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
          window.history.pushState(null, '', href);
        }
      } else {
        navigate(href);
      }
    } else {
      navigate(href);
    }
  };

  const addr = settings.contact.address;

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
          grid-template-columns: 1.4fr 0.7fr 0.7fr 1.2fr;
          gap: clamp(28px, 3.5vw, 56px);
          padding-bottom: clamp(40px, 5vw, 60px);
          border-bottom: 1px solid rgba(200,154,61,0.14);
        }
        #footer-section .ft-col-head {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
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
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14px;
          font-weight: 400;
          line-height: 1.7;
          max-width: 290px;
          margin-bottom: 22px;
          color: rgba(255,249,239,0.78);
        }
        #footer-section .ft-contact-row {
          display: flex;
          align-items: center;
          gap: 9px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 13.5px;
          font-weight: 400;
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
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14px;
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
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,249,239,0.80);
          text-decoration: none;
          transition: color 0.18s;
          letter-spacing: 0.01em;
        }
        #footer-section .ft-legal-links a:hover { color: #D4AA45; }

        /* ── Address & Registration column ─────────────────── */
        #footer-section .ft-address {
          font-style: normal;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 13.5px;
          line-height: 1.8;
          font-weight: 400;
          color: rgba(255,249,239,0.80);
          margin-bottom: 16px;
        }
        #footer-section .ft-reg {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 500;
          line-height: 2.0;
          color: rgba(255,249,239,0.60);
          letter-spacing: 0.02em;
          border-top: 1px solid rgba(200,154,61,0.14);
          padding-top: 12px;
        }
        #footer-section .ft-reg span {
          color: #D4AA45;
          font-weight: 700;
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
          #footer-section {
            padding: 44px 0 0;
          }
          #footer-section .ft-grid {
            grid-template-columns: 1fr 1fr;
            gap: 28px 20px;
          }
          #footer-section .ft-col-brand {
            grid-column: 1 / -1;
          }
          #footer-section .ft-col-address {
            grid-column: 1 / -1;
          }
          #footer-section .ft-brand-desc { max-width: 100%; }
          #footer-section .ft-bottom {
            flex-direction: column;
            text-align: center;
            gap: 8px;
            padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
          }
        }

        /* ── Very small ≤ 430px ────────────────────────────── */
        @media (max-width: 430px) {
          #footer-section .ft-grid {
            grid-template-columns: 1fr;
            gap: 26px;
          }
          #footer-section .ft-col-head {
            margin-bottom: 14px;
          }
        }
      `}</style>

      <div className="ft-inner">
        <div className="ft-grid">

          {/* ── Column 1: Brand + Contact ── */}
          <div className="ft-col-brand">
            <div style={{ marginBottom: '16px' }}>
              <img
                src={settings.logo || '/logo-gold.png'}
                alt={settings.storeName}
                style={{ height: '44px', width: 'auto', opacity: 0.92 }}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            {Boolean(settings.description?.trim()) && (
              <p className="ft-brand-desc">{settings.description}</p>
            )}
            {Boolean(settings.contact?.email?.trim()) && (
              <div className="ft-contact-row">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                  <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="rgba(200,154,61,0.55)" strokeWidth="1.1"/>
                  <path d="M1 5l6 3.5L13 5" stroke="rgba(200,154,61,0.55)" strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
                <a href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a>
              </div>
            )}
            {Boolean(settings.contact?.phone?.trim() || settings.contact?.whatsappNumber?.trim()) && (
              <div className="ft-contact-row">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M2 2h2.5l1 2.5-1.5 1.5c.75 1.75 2 3 3.75 3.75l1.5-1.5L11.5 9.5V12C8 12.5 1.5 8.5 2 2z" stroke="rgba(200,154,61,0.55)" strokeWidth="1.1" strokeLinejoin="round"/>
                </svg>
                <a href={`tel:${settings.contact.whatsappNumber || settings.contact.phone}`}>{settings.contact.phone || settings.contact.whatsappNumber}</a>
              </div>
            )}
            {(isValidLink(settings.socialLinks?.instagram) ||
              isValidLink(settings.socialLinks?.facebook) ||
              isValidLink(settings.socialLinks?.youtube) ||
              isValidLink(settings.socialLinks?.twitter)) && (
              <div className="ft-socials">
                {isValidLink(settings.socialLinks?.instagram) && (
                  <SocialBtn
                    label="Instagram"
                    href={settings.socialLinks?.instagram}
                    path="M11 1H5a4 4 0 00-4 4v6a4 4 0 004 4h6a4 4 0 004-4V5a4 4 0 00-4-4zM8 11a3 3 0 110-6 3 3 0 010 6zm3.5-6.5a.75.75 0 110-1.5.75.75 0 010 1.5z"
                  />
                )}
                {isValidLink(settings.socialLinks?.facebook) && (
                  <SocialBtn
                    label="Facebook"
                    href={settings.socialLinks?.facebook}
                    path="M13 1H3a2 2 0 00-2 2v10a2 2 0 002 2h5v-5H6.5V7.5H8V6c0-1.66 1.34-3 3-3h2v2.5h-1.5c-.28 0-.5.22-.5.5v1.5H13l-.5 2.5H11V15h2a2 2 0 002-2V3a2 2 0 00-2-2z"
                  />
                )}
                {isValidLink(settings.socialLinks?.youtube) && (
                  <SocialBtn
                    label="YouTube"
                    href={settings.socialLinks?.youtube}
                    path="M14.667 4.667a1.667 1.667 0 00-1.173-1.173C12.46 3.227 8 3.227 8 3.227s-4.46 0-5.494.267A1.667 1.667 0 001.333 4.667C1.067 5.7 1.067 8 1.067 8s0 2.3.266 3.333a1.667 1.667 0 001.174 1.174c1.033.266 5.493.266 5.493.266s4.46 0 5.494-.266a1.667 1.667 0 001.173-1.174c.266-1.033.266-3.333.266-3.333s0-2.3-.266-3.333zM6.5 10.133V5.867L10.267 8 6.5 10.133z"
                  />
                )}
                {isValidLink(settings.socialLinks?.twitter) && (
                  <SocialBtn
                    label="X (Twitter)"
                    href={settings.socialLinks?.twitter}
                    path="M12.6 1.5h2.4L9.75 7.5 16 15h-4.8l-3.75-5.1L3.2 15H.8l5.65-6.5L.4 1.5h4.95l3.4 4.7z"
                  />
                )}
              </div>
            )}
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
                  <a
                    href={l.href}
                    onClick={e => {
                      e.preventDefault();
                      navigate(l.href);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Store & Dispatch Address (Opening hours removed) ── */}
          <div className="ft-col-address">
            <p className="ft-col-head">Store &amp; Dispatch</p>
            <address className="ft-address">
              {addr.line1 && <div>{addr.line1}</div>}
              {addr.line2 && <div>{addr.line2}</div>}
              <div>{addr.city}{addr.postalCode ? ` – ${addr.postalCode}` : ''}</div>
              <div>{addr.state}{addr.country ? `, ${addr.country}` : ''}</div>
            </address>
            <div className="ft-reg">
              {settings.gstNumber && <div>GSTIN: <span>{settings.gstNumber}</span></div>}
              {settings.fssaiNumber && <div>FSSAI Lic: <span>{settings.fssaiNumber}</span></div>}
            </div>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div className="ft-bottom">
          <p className="ft-bottom-copy">
            © {new Date().getFullYear()} {settings.storeName || 'MALWA NAMKEEN HOUSE'}. All rights reserved.
          </p>
          <p className="ft-bottom-tagline">{settings.tagline || 'THE NAMKEEN & SNACKS HUB'}</p>
        </div>

      </div>
    </footer>
  );
}
