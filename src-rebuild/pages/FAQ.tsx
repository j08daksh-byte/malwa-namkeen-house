import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/sections/Footer';
import SEOHead from '../components/seo/SEOHead';
import { BUSINESS } from '../lib/business';
import {
  ChevronDown,
  Search,
  HelpCircle,
  Package,
  ShieldCheck,
  Truck,
  RotateCcw,
  Gift,
  Mail,
  ArrowRight,
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'ord-1',
    category: 'Ordering & Packaging',
    question: 'How are Malwa Namkeen House savouries packaged for freshness?',
    answer:
      'All our artisanal sevs, mixtures, and mathris are packed in high-barrier, food-grade multi-layer pouches and boxes immediately after cooling. This preserves maximum crunch, aroma, and peppery clove notes during transit.',
  },
  {
    id: 'ord-2',
    category: 'Ordering & Packaging',
    question: 'Can I select custom packaging weights?',
    answer:
      'Yes. Each delicacy offers dynamic packaging variants (such as 250g Pouches, 500g Boxes, or 1kg Family Packs). You can select your preferred variant directly on the product page before adding to your cart.',
  },
  {
    id: 'qual-1',
    category: 'Ingredients & Purity',
    question: 'What cooking oil is used in preparing the namkeens?',
    answer:
      'We use 100% pure soya oil for our traditional frying process. We never use palm oil, hydrogenated fats, or artificial preservatives.',
  },
  {
    id: 'qual-2',
    category: 'Ingredients & Purity',
    question: 'Are all products 100% vegetarian?',
    answer:
      'Yes, all delicacies at Malwa Namkeen House are 100% pure vegetarian (Satvik standards) prepared with carefully inspected flours, whole spices, and pure cow ghee for sweets.',
  },
  {
    id: 'qual-3',
    category: 'Ingredients & Purity',
    question: 'What gives Ratlami Sev its signature peppery warmth?',
    answer:
      'Our authentic Ratlami Sev is infused with freshly stone-ground whole cloves (Laung), black pepper (Kali Mirch), and hing (asafoetida), crafted in traditional proportions handed down through generations.',
  },
  {
    id: 'stor-1',
    category: 'Shelf Life & Storage',
    question: 'What is the shelf life of the namkeens and savouries?',
    answer:
      'Most dry namkeens and sevs have a shelf life of 90 days from the packaging date when stored unopened in a cool, dry place away from direct sunlight.',
  },
  {
    id: 'stor-2',
    category: 'Shelf Life & Storage',
    question: 'How should I store the delicacies after opening?',
    answer:
      'Once opened, transfer the savouries into an airtight stainless steel or glass container to maintain crispness and prevent moisture absorption.',
  },
  {
    id: 'ship-1',
    category: 'Delivery & Shipping',
    question: 'What are the delivery charges?',
    answer:
      'We offer FREE Delivery on all orders above ₹499 across India. For orders below ₹499, a flat nominal delivery charge of ₹49 applies.',
  },
  {
    id: 'ship-2',
    category: 'Delivery & Shipping',
    question: 'How long does delivery take?',
    answer:
      'Orders are freshly dispatched within 24 to 48 hours. Transit generally takes 2–4 business days for major metropolitan hubs and 4–6 business days for other regional areas.',
  },
  {
    id: 'ship-3',
    category: 'Delivery & Shipping',
    question: 'Do you provide order tracking updates?',
    answer:
      'Yes! As soon as your consignment is dispatched, you will receive an SMS and WhatsApp notification containing your live courier tracking link.',
  },
  {
    id: 'pay-1',
    category: 'Payment & Gifting',
    question: 'What payment modes are supported?',
    answer:
      'We support UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD) on eligible pin codes.',
  },
  {
    id: 'pay-2',
    category: 'Payment & Gifting',
    question: 'Can I place bulk orders for weddings and corporate gifting?',
    answer:
      'Absolutely. We provide customized gift hampers, festive gift boxes, and special bulk pricing for weddings, corporate events, and parties. Contact our gifting desk or reach out via WhatsApp.',
  },
];

const CATEGORIES = [
  'All',
  'Ordering & Packaging',
  'Ingredients & Purity',
  'Shelf Life & Storage',
  'Delivery & Shipping',
  'Payment & Gifting',
];

export default function FAQ() {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'ord-1': true,
    'qual-1': true,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter(item => {
      const matchCat = selectedCat === 'All' || item.category === selectedCat;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [selectedCat, search]);

  return (
    <div style={{ background: 'var(--bg-parchment, #F6EFE3)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .faq-hero {
          background: linear-gradient(180deg, #3C0815 0%, #2A0005 100%);
          color: #FFF8EC;
          padding: clamp(60px, 9vw, 100px) clamp(20px, 4vw, 48px) clamp(40px, 6vw, 64px);
          text-align: center;
        }

        .faq-search-wrap {
          max-width: 540px;
          margin: 28px auto 0;
          position: relative;
        }

        .faq-search-input {
          width: 100%;
          height: 52px;
          border-radius: 999px;
          border: 1px solid rgba(200, 154, 61, 0.4);
          background: rgba(255, 255, 255, 0.1);
          color: #FFF8EC;
          padding: 0 24px 0 48px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14px;
          outline: none;
          backdrop-filter: blur(8px);
          transition: background 0.18s, border-color 0.18s;
        }

        .faq-search-input:focus {
          background: rgba(255, 255, 255, 0.18);
          border-color: #D4AA45;
        }

        .faq-search-input::placeholder {
          color: rgba(255, 248, 236, 0.6);
        }

        .faq-search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: #D4AA45;
        }

        .faq-content-area {
          max-width: 1240px;
          margin: 0 auto;
          width: 100%;
          padding: clamp(32px, 5vw, 60px) clamp(16px, 4vw, 48px) clamp(64px, 8vw, 96px);
          flex: 1;
        }

        .faq-cat-bar {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 8px;
          margin-bottom: 28px;
          justify-content: flex-start;
          flex-wrap: nowrap;
        }

        .faq-cat-bar::-webkit-scrollbar {
          display: none;
        }

        .faq-cat-pill {
          background: #FFFDF8;
          border: 1px solid rgba(200, 154, 61, 0.3);
          color: #55000A;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 999px;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }

        .faq-cat-pill:hover {
          border-color: #D4AA45;
        }

        .faq-cat-pill--active {
          background: #3C0815;
          color: #FFF8EC;
          border-color: #3C0815;
        }

        .faq-accordion-group {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          align-items: start;
        }

        @media (min-width: 860px) {
          .faq-cat-bar {
            justify-content: center;
            flex-wrap: wrap;
          }
          .faq-accordion-group {
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
        }

        .faq-item-card {
          background: #FFFDF8;
          border: 1px solid rgba(200, 154, 61, 0.28);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(85, 0, 10, 0.04);
          transition: border-color 0.18s, box-shadow 0.18s;
        }

        .faq-item-card:hover {
          border-color: rgba(200, 154, 61, 0.55);
          box-shadow: 0 8px 22px rgba(85, 0, 10, 0.08);
        }

        .faq-btn-trigger {
          width: 100%;
          background: none;
          border: none;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          cursor: pointer;
          text-align: left;
        }

        .faq-question-title {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 15.5px;
          font-weight: 700;
          color: #3C0815;
          line-height: 1.35;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .faq-chevron {
          color: #D4AA45;
          flex-shrink: 0;
          transition: transform 0.22s ease;
        }

        .faq-chevron--open {
          transform: rotate(180deg);
        }

        .faq-answer-panel {
          padding: 0 22px 20px;
          border-top: 1px solid rgba(200, 154, 61, 0.15);
          padding-top: 14px;
        }

        .faq-answer-text {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14px;
          line-height: 1.65;
          color: #5E4940;
          margin: 0;
        }

        /* ── Support Help Box ─────────────────────────────────────── */
        .faq-help-box {
          background: linear-gradient(135deg, #3C0815 0%, #55000A 100%);
          border-radius: 20px;
          padding: 32px;
          margin-top: 48px;
          color: #FFF8EC;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          border: 1px solid rgba(200, 154, 61, 0.35);
        }

        .faq-help-left h3 {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 6px;
          letter-spacing: -0.015em;
        }

        .faq-help-left p {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14px;
          color: rgba(255, 248, 236, 0.85);
          margin: 0;
        }

        .faq-help-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #D4AA45;
          color: #3C0815;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 13px 24px;
          border-radius: 999px;
          text-decoration: none;
          transition: background 0.18s, transform 0.18s;
        }

        .faq-help-btn:hover {
          background: #E5BE5C;
          transform: translateY(-2px);
        }
      `}</style>

      <SEOHead
        title="Frequently Asked Questions (FAQ)"
        description="Everything you need to know about our authentic Malwa namkeens, packaging integrity, dietary purity, and nationwide delivery."
        canonicalPath="/faq"
      />
      <Navbar />

      <section className="faq-hero">
        <p style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: '11px', fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'var(--gold-pale, #F0DFA0)', marginBottom: '12px' }}>
          Customer Guidance & Help
        </p>
        <h1 style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: 'clamp(32px, 4.8vw, 52px)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.025em' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: '15px', color: 'rgba(255, 248, 236, 0.85)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
          Everything you need to know about our authentic Malwa namkeens, freshness-sealed packaging, dietary purity, and nationwide delivery.
        </p>

        <div className="faq-search-wrap">
          <Search size={18} className="faq-search-icon" />
          <input
            type="text"
            className="faq-search-input"
            placeholder="Search questions (e.g. storage, shelf life, shipping)…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search FAQs"
          />
        </div>
      </section>

      <main className="faq-content-area">
        {/* Category Filter */}
        <div className="faq-cat-bar" role="tablist" aria-label="FAQ categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={selectedCat === cat}
              className={`faq-cat-pill ${selectedCat === cat ? 'faq-cat-pill--active' : ''}`}
              onClick={() => setSelectedCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        {filteredFaqs.length > 0 ? (
          <div className="faq-accordion-group">
            {filteredFaqs.map(faq => {
              const isOpen = Boolean(openItems[faq.id]);
              return (
                <div key={faq.id} className="faq-item-card">
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => toggleItem(faq.id)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                        color: '#D4AA45',
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div className="faq-answer-pane">
                      <p style={{ margin: 0 }}>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: '#FFFDF8', borderRadius: '16px', border: '1px solid rgba(200,154,61,0.25)' }}>
            <HelpCircle size={36} color="#D4AA45" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#3C0815' }}>
              No matching questions found
            </h3>
            <p style={{ fontSize: '13.5px', color: '#75645C', margin: 0 }}>
              Try searching with different keywords or contact our customer support team directly.
            </p>
          </div>
        )}

        {/* Contact Assistance Callout */}
        <div className="faq-contact-card">
          <h3 style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 700, margin: '0 0 10px', color: '#FFF8EC' }}>
            Still have questions?
          </h3>
          <p style={{ fontSize: '14px', color: 'rgba(255, 248, 236, 0.85)', margin: '0 auto 24px', maxWidth: '520px', lineHeight: 1.6 }}>
            Our culinary and customer experience team is always happy to assist with orders, bulk inquiries, or flavour recommendations.
          </p>
          <div className="faq-cta-btn-group">
            <Link
              to="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 24px',
                height: '46px',
                background: '#D4AA45',
                color: '#2C0612',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              <Mail size={15} /> Contact Support
            </Link>
            <Link
              to="/shop"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 24px',
                height: '46px',
                background: 'transparent',
                border: '1px solid rgba(255, 248, 236, 0.4)',
                color: '#FFF8EC',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Explore The Shop <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
