import React, { useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/sections/Footer';
import LegacyStory from '../components/sections/LegacyStory';
import QualityValues from '../components/sections/QualityValues';
import SEOHead from '../components/seo/SEOHead';
import { BUSINESS } from '../lib/business';

export default function AboutUs() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div style={{ background: 'var(--bg-parchment, #F6EFE3)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEOHead
        title="About Us — Heritage, Purity & Craft"
        description="Celebrating over seven decades of authentic Malwa namkeen craftsmanship, hand-ground spices, and 100% pure cold-pressed groundnut oil."
        canonicalPath="/about-us"
      />
      <Navbar />
      <main style={{ flex: 1 }}>
        <section style={{
          position: 'relative',
          padding: 'clamp(48px, 8vw, 110px) clamp(16px, 4vw, 48px) clamp(36px, 6vw, 70px)',
          background: 'linear-gradient(180deg, #3C0815 0%, #2A0005 100%)',
          color: '#FFF8EC',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <p style={{
              fontFamily: "var(--font-primary, 'DM Sans', sans-serif)",
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.20em',
              textTransform: 'uppercase',
              color: 'var(--gold-pale, #F0DFA0)',
              marginBottom: '16px',
            }}>
              Est. 1954 · Malwa Heritage
            </p>
            <h1 style={{
              fontFamily: "var(--font-primary, 'DM Sans', sans-serif)",
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.05,
              margin: '0 0 20px',
              letterSpacing: '-0.025em',
            }}>
              Our Heritage & Legacy
            </h1>
            <p style={{
              fontFamily: "var(--font-primary, 'DM Sans', sans-serif)",
              fontSize: 'clamp(15px, 1.5vw, 17px)',
              lineHeight: 1.65,
              color: 'rgba(255, 248, 236, 0.85)',
              margin: '0 auto',
              maxWidth: '640px',
            }}>
              Celebrating over seven decades of authentic Malwa namkeen craftsmanship, hand-ground spices, and 100% pure cold-pressed groundnut oil.
            </p>
          </div>
        </section>

        <LegacyStory />
        <QualityValues />
      </main>
      <Footer />
    </div>
  );
}
