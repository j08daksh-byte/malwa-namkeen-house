import { useState } from 'react';
import { EVENTS } from '../../lib/events';
import { WA_URLS } from '../../lib/whatsapp';

function goToContact(category: string) {
  window.dispatchEvent(new CustomEvent(EVENTS.SELECT_CATEGORY, { detail: category }));
  const target = document.getElementById('contact');
  if (target) {
    const topPos = target.getBoundingClientRect().top + window.scrollY - 68;
    window.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
  }
}

const FAQS = [
  {
    q: 'Do you accept bulk orders?',
    a: 'Absolutely! We supply bulk namkeens and festive gift hampers for weddings, family celebrations, and corporate gatherings. You can submit an inquiry online or connect via WhatsApp for custom requirements.',
  },
  {
    q: 'Do you provide corporate gifting packages?',
    a: 'Yes, we curate custom gift boxes containing signature Ratlami sev, artisanal mathris, and pure sweets with personalized corporate branding and nationwide delivery.',
  },
  {
    q: 'Are your products prepared fresh for bulk orders?',
    a: 'Yes, all bulk order batches are fried fresh in 100% pure cold-pressed groundnut oil and packed in airtight aroma-seal packaging to ensure maximum shelf life and crunch.',
  },
  {
    q: 'What is the minimum quantity for custom gift hampers?',
    a: 'We accommodate custom gifting starting from 25 hampers up to large festive consignments. Contact our gifting team for tailored catalog options.',
  },
];

const WA_HREF = WA_URLS.catering;

const WA_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L.057 23.985l6.304-1.648A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-5.002-1.368l-.358-.213-3.743.979 1.003-3.648-.234-.374A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/>
  </svg>
);

/* Chevron used for open/close — rotates 180° when open */
function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function FaqItem({ faq, open, onToggle }: { faq: typeof FAQS[0]; open: boolean; onToggle: () => void }) {
  return (
    <div className={`ki-item${open ? ' ki-item--open' : ''}`}>
      <button
        aria-expanded={open}
        onClick={onToggle}
        className="ki-btn"
      >
        <span className="ki-q">{faq.q}</span>
        <span className={`ki-icon${open ? ' ki-icon--open' : ''}`}>
          <ChevronIcon />
        </span>
      </button>

      <div className="ki-body" style={{ maxHeight: open ? '320px' : '0px' }}>
        <div className="ki-body-inner">
          <p className="ki-a">{faq.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Katering() {
  const [openIdx, setOpenIdx] = useState<number>(-1);

  function toggle(i: number) {
    setOpenIdx(prev => (prev === i ? -1 : i));
  }

  const col1 = FAQS.slice(0, 4);
  const col2 = FAQS.slice(4, 8);

  return (
    <section id="katering" aria-label="Frequently Asked Questions">
      <style>{`
        /* ── Section ──────────────────────────────────────────────── */
        #katering {
          background:
            radial-gradient(circle at 50% 0%, rgba(200,154,61,0.08), transparent 30%),
            linear-gradient(180deg, #F8F1E7 0%, #F3E9DA 100%);
          padding: 78px 24px 82px;
          overflow-x: hidden;
        }
        #katering .k-inner {
          max-width: 1120px;
          margin-inline: auto;
        }

        /* ── Header ───────────────────────────────────────────────── */
        #katering .k-header {
          text-align: center;
          max-width: 680px;
          margin: 0 auto 44px;
        }
        #katering .k-eyebrow {
          display: block;
          font-family: Inter, sans-serif;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #C99A32;
          margin-bottom: 16px;
        }
        #katering .k-h2 {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(46px, 5vw, 68px);
          line-height: 0.98;
          font-weight: 650;
          color: #3A211D;
          letter-spacing: -0.02em;
          margin: 0 0 20px;
        }
        #katering .k-h2 em {
          color: #55000A;
          font-style: italic;
          font-weight: 600;
        }
        #katering .k-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 18px;
        }
        #katering .k-dbar {
          width: clamp(28px, 3vw, 44px);
          height: 1px;
          background: rgba(200,154,61,0.50);
        }
        #katering .k-sub {
          font-family: Inter, sans-serif;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.65;
          color: #5E4940;
          max-width: 680px;
          margin: 0 auto;
        }

        /* ── FAQ grid ─────────────────────────────────────────────── */
        #katering .k-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px 20px;
          align-items: start;
        }
        #katering .k-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ── Accordion item ───────────────────────────────────────── */
        #katering .ki-item {
          position: relative;
          background: linear-gradient(160deg, #FFFDF8 0%, #FBF6EE 100%);
          border: 1px solid rgba(200,154,61,0.24);
          border-radius: 18px;
          overflow: hidden;
          box-shadow:
            0 4px 16px rgba(74,31,25,0.05),
            inset 0 1px 0 rgba(255,255,255,0.90);
          transition:
            border-color 240ms ease,
            box-shadow 240ms ease,
            transform 240ms ease,
            background 240ms ease;
        }
        @media (hover: hover) {
          #katering .ki-item:hover {
            transform: translateY(-2px);
            border-color: rgba(200,154,61,0.50);
            box-shadow:
              0 10px 28px rgba(74,31,25,0.09),
              inset 0 1px 0 rgba(255,255,255,0.90);
          }
        }
        #katering .ki-item--open {
          background: linear-gradient(160deg, #FFFDF8 0%, #F8EDD8 100%);
          border-color: rgba(200,154,61,0.68);
          box-shadow:
            0 14px 34px rgba(74,31,25,0.10),
            inset 0 1px 0 rgba(255,255,255,0.90);
        }
        /* Left accent bar on open item */
        #katering .ki-item--open::before {
          content: '';
          position: absolute;
          left: 0;
          top: 16px;
          bottom: 16px;
          width: 3px;
          border-radius: 999px;
          background: linear-gradient(180deg, #C99A32, #55000A);
        }

        /* ── Question button ──────────────────────────────────────── */
        #katering .ki-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 20px 22px 20px 26px;
          min-height: 68px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
        }
        #katering .ki-btn:focus-visible {
          outline: 3px solid rgba(200,154,61,0.30);
          outline-offset: 3px;
          border-radius: 18px;
        }
        #katering .ki-q {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 21px;
          font-weight: 700;
          line-height: 1.22;
          color: #55000A;
          letter-spacing: -0.01em;
          transition: color 200ms ease;
        }
        #katering .ki-item--open .ki-q {
          color: #55000A;
        }

        /* ── Toggle icon ──────────────────────────────────────────── */
        #katering .ki-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(200,154,61,0.55);
          background: rgba(200,154,61,0.07);
          color: #C99A32;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          transition: background 240ms ease, border-color 240ms ease,
                      color 240ms ease, transform 240ms ease,
                      box-shadow 240ms ease;
        }
        #katering .ki-icon--open {
          background: #55000A;
          border-color: #55000A;
          color: #FFF8EC;
          transform: rotate(180deg);
          box-shadow: 0 4px 12px rgba(85,0,10,0.28);
        }

        /* ── Answer panel ─────────────────────────────────────────── */
        #katering .ki-body {
          overflow: hidden;
          transition: max-height 0.34s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #katering .ki-body-inner {
          border-top: 1px solid rgba(200,154,61,0.16);
          margin: 0 22px 0 26px;
          padding: 15px 0 22px;
        }
        #katering .ki-a {
          font-family: Inter, Arial, sans-serif;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.74;
          color: #5E4940;
          margin: 0;
        }

        /* ── WhatsApp CTA ─────────────────────────────────────────── */
        #katering .k-cta {
          max-width: 760px;
          margin: 34px auto 0;
          background: linear-gradient(135deg, #FFFDF8 0%, #F7EBD9 100%);
          border: 1px solid rgba(200,154,61,0.35);
          border-radius: 20px;
          padding: 28px 32px;
          box-shadow: 0 14px 34px rgba(74,31,25,0.07);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        #katering .k-cta-text h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px;
          font-weight: 700;
          color: #5A1022;
          margin: 0 0 6px;
          line-height: 1.15;
        }
        #katering .k-cta-text p {
          font-family: Inter, sans-serif;
          font-size: 14px;
          line-height: 1.55;
          color: #5E4940;
          margin: 0;
        }
        #katering .k-wa-btn {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: #25D366;
          color: #fff;
          border: none;
          border-radius: 999px;
          height: 46px;
          padding: 0 22px;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        #katering .k-wa-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 22px rgba(37,211,102,0.26);
        }
        #katering .k-wa-btn:focus-visible {
          outline: 3px solid rgba(37,211,102,0.35);
          outline-offset: 3px;
        }
        #katering .k-enquire-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #55000A;
          color: #FFF8EC;
          border: none;
          border-radius: 999px;
          height: 46px;
          padding: 0 22px;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 220ms ease, box-shadow 220ms ease, background 220ms ease;
        }
        #katering .k-enquire-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 22px rgba(60,8,21,0.22);
          background: #4E0B19;
        }
        #katering .k-enquire-btn:focus-visible {
          outline: 3px solid rgba(60,8,21,0.30);
          outline-offset: 3px;
        }
        #katering .k-cta-btns {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          flex-wrap: wrap;
        }

        /* ── Tablet 768px – 1024px ────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1024px) {
          #katering .k-grid { gap: 12px 16px; }
          #katering .k-h2   { font-size: clamp(40px, 6vw, 56px); }
        }

        /* ── Mobile < 768px ───────────────────────────────────────── */
        @media (max-width: 767px) {
          #katering {
            padding: 58px 16px 64px;
          }
          #katering .k-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          #katering .k-header { margin-bottom: 32px; }
          #katering .k-h2     { font-size: clamp(38px, 9vw, 46px); }
          #katering .k-sub    { font-size: 14px; }
          #katering .ki-q     { font-size: 17px; }
          #katering .ki-a     { font-size: 13.5px; line-height: 1.65; }
          #katering .k-cta {
            display: block;
            text-align: center;
            padding: 24px 20px;
          }
          #katering .k-cta-btns {
            width: 100%;
            justify-content: center;
            margin-top: 18px;
          }
          #katering .k-wa-btn,
          #katering .k-enquire-btn {
            flex: 1 1 auto;
            justify-content: center;
          }
        }

        /* ── Very small < 360px ───────────────────────────────────── */
        @media (max-width: 359px) {
          #katering .k-h2 { font-size: 34px; }
        }
      `}</style>

      <div className="k-inner">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="k-header">
          <span className="k-eyebrow">Help &amp; Information</span>
          <h2 className="k-h2">
            Frequently Asked <em>Questions</em>
          </h2>
          <div className="k-divider">
            <div className="k-dbar" />
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M5 0.5L9.5 5L5 9.5L0.5 5Z" stroke="#C99A32" strokeWidth="0.9" fill="rgba(200,154,61,0.20)"/>
              <circle cx="5" cy="5" r="1.7" fill="#C99A32"/>
            </svg>
            <div className="k-dbar" />
          </div>
          <p className="k-sub">
            Everything you may want to know about orders, catering, gifting, reservations, celebrations and franchise opportunities.
          </p>
        </div>

        {/* ── Two-column accordion ──────────────────────────────── */}
        <div className="k-grid">
          <div className="k-col">
            {col1.map((faq, i) => (
              <FaqItem
                key={faq.q}
                faq={faq}
                open={openIdx === i}
                onToggle={() => toggle(i)}
              />
            ))}
          </div>
          <div className="k-col">
            {col2.map((faq, i) => (
              <FaqItem
                key={faq.q}
                faq={faq}
                open={openIdx === i + 4}
                onToggle={() => toggle(i + 4)}
              />
            ))}
          </div>
        </div>

        {/* ── WhatsApp CTA ──────────────────────────────────────── */}
        <div className="k-cta">
          <div className="k-cta-text">
            <h3>Still have a question?</h3>
            <p>Talk directly to the Malwa Namkeen House team for orders, catering, gifting and reservations.</p>
          </div>
          <div className="k-cta-btns">
            <button
              className="k-enquire-btn"
              onClick={() => goToContact('catering')}
            >
              Enquire Now
            </button>
            <a
              href={WA_HREF}
              className="k-wa-btn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat on WhatsApp"
            >
              {WA_ICON}
              Chat on WhatsApp
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
