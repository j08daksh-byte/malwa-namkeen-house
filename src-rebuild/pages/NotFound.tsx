import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/sections/Footer';
import SEOHead from '../components/seo/SEOHead';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ background: 'var(--bg-parchment, #F6EFE3)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEOHead
        title="Page Not Found (404)"
        description="The requested page could not be found. Explore our authentic artisanal namkeens in The Shop."
        noIndex={true}
      />
      <Navbar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '500px', width: '100%' }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(80px, 12vw, 130px)',
            fontWeight: 700,
            color: '#3C0815',
            lineHeight: 0.9,
            marginBottom: '16px',
            letterSpacing: '-0.04em',
          }}>
            404
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '32px',
            color: '#3C0815',
            margin: '0 0 12px',
          }}>
            Page Not Found
          </h1>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14.5px',
            lineHeight: 1.6,
            color: '#75645C',
            marginBottom: '28px',
          }}>
            The page you are looking for might have been moved or does not exist. Explore our fresh heritage savouries and artisanal namkeens in the shop.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 24px',
                height: '46px',
                background: 'transparent',
                border: '1px solid #3C0815',
                color: '#3C0815',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={15} /> Return Home
            </Link>
            <Link
              to="/shop"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 26px',
                height: '46px',
                background: '#3C0815',
                color: '#FFF8EC',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                boxShadow: '0 6px 18px rgba(60, 8, 21, 0.22)',
              }}
            >
              <ShoppingBag size={15} /> Explore The Shop
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
