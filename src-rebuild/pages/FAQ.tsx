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
      'Yes. Each delicacy offers dynamic packaging variants (such as 250g Pouches, 500g Boxes, or 1kg Family Packs). You can select your preferred variant directly on the product page before adding to your bag.',
  },
  {
    id: 'qual-1',
    category: 'Ingredients & Purity',
    question: 'What cooking oil is used in preparing the namkeens?',
    answer:
      'We use 100% pure cold-pressed groundnut oil for our traditional frying process. We never use palm oil, hydrogenated fats, or artificial preservatives.',
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
      'We offer complimentary standard shipping on all orders above ₹499. For orders below this threshold, a flat nominal delivery fee of ₹49 applies.',
  },
  {
    id: 'ship-2',
    category: 'Delivery & Shipping',
    question: 'How can I track my order?',
    answer:
      'Once your order is confirmed, you can track its progress under your Customer Dashboard at /dashboard. You will also receive email updates as your order transitions from processing to dispatch.',
  },
  {
    id: 'ret-1',
    category: 'Returns & Cancellations',
    question: 'Can I cancel or modify my order?',
    answer:
      'Orders can be cancelled before dispatch by contacting our customer support team or reaching out via WhatsApp with your order reference number. Once an order is handed to the courier, cancellations cannot be processed.',
  },
  {
    id: 'ret-2',
    category: 'Returns & Cancellations',
    question: 'What happens if my order arrives damaged?',
    answer:
      'If your parcel arrives damaged or with broken packaging seals, please share photographs with our support team within 24 hours of delivery. We will issue a replacement or refund promptly.',
  },
  {
    id: 'bulk-1',
    category: 'Bulk Orders & Festive Gifting',
    question: 'Do you offer corporate gifting and wedding bulk orders?',
    answer:
      'Yes, we curate custom gift boxes, wedding return hampers, and corporate assortments with personalized branding. Submit an inquiry through our Contact page or WhatsApp us directly for custom quotations.',
  },
];

const CATEGORIES = [
  'All',
  'Ordering & Packaging',
  'Ingredients & Purity',
  'Shelf Life & Storage',
  'Delivery & Shipping',
  'Returns & Cancellations',
  'Bulk Orders & Festive Gifting',
];

export default function FAQ() {
  const [selectedCat, setSelectedCat] = useState('All');
  const [search, setSearch] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ 'ord-1': true, 'qual-1': true });

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
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
          font-family: Inter, sans-serif;
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
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
          padding: clamp(32px, 5vw, 60px) clamp(16px, 3vw, 40px) clamp(64px, 8vw, 96px);
          flex: 1;
        }

        .faq-cat-bar {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 12px;
          margin-bottom: 32px;
        }

        .faq-cat-pill {
          background: #FFFDF8;
          border: 1px solid rgba(200, 154, 61, 0.3);
          color: #55000A;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 999px;
          cursor: pointer;
          white-space: nowrap;
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
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .faq-item-card {
          background: #FFFDF8;
          border: 1px solid rgba(200, 154, 61, 0.28);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(85, 0, 10, 0.03);
          transition: border-color 0.18s;
        }

        .faq-item-card:hover {
          border-color: rgba(201, 154, 50, 0.55);
        }

        .faq-question-btn {
          width: 100%;
          background: transparent;
          border: none;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          text-align: left;
          cursor: pointer;
          color: #3C0815;
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(18px, 2vw, 21px);
          font-weight: 700;
        }

        .faq-answer-pane {
          padding: 0 22px 18px;
          font-family: Inter, sans-serif;
          font-size: 14px;
          line-height: 1.7;
          color: #4A3530;
          border-top: 1px solid rgba(200, 154, 61, 0.15);
          padding-top: 14px;
        }

        .faq-contact-card {
          margin-top: 56px;
          background: linear-gradient(135deg, #3C0815 0%, #55000A 100%);
          color: #FFF8EC;
          border-radius: 20px;
          padding: clamp(28px, 5vw, 40px);
          text-align: center;
          border: 1px solid rgba(200, 154, 61, 0.4);
        }
      `}</style>

      <SEOHead
        title="Frequently Asked Questions (FAQ)"
        description="Everything you need to know about our authentic Malwa namkeens, packaging integrity, dietary purity, and nationwide delivery."
        canonicalPath="/faq"
        structuredData={faqStructuredData}
      />
      <Navbar />

      <section className="faq-hero">
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold-pale, #F0DFA0)', marginBottom: '12px' }}>
          Customer Guidance & Help
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif", fontSize: 'clamp(36px, 5.5vw, 60px)', fontWeight: 600, margin: '0 0 16px', letterSpacing: '-0.03em' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'rgba(255, 248, 236, 0.85)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
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
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '22px', margin: '0 0 8px', color: '#3C0815' }}>
              No matching questions found
            </h3>
            <p style={{ fontSize: '13.5px', color: '#75645C', margin: 0 }}>
              Try searching with different keywords or contact our customer support team directly.
            </p>
          </div>
        )}

        {/* Contact Assistance Callout */}
        <div className="faq-contact-card">
          <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 34px)', margin: '0 0 10px', color: '#FFF8EC' }}>
            Still have questions?
          </h3>
          <p style={{ fontSize: '14px', color: 'rgba(255, 248, 236, 0.85)', margin: '0 auto 24px', maxWidth: '520px', lineHeight: 1.6 }}>
            Our culinary and customer experience team is always happy to assist with orders, bulk inquiries, or flavour recommendations.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
