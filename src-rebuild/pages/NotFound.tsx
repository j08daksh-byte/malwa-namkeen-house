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
      <style>{`
        .notfound-btn-group {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        @media (max-width: 480px) {
          .notfound-btn-group {
            flex-direction: column;
            width: 100%;
          }
          .notfound-btn-group a {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px, 8vw, 80px) 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '500px', width: '100%' }}>
          <div style={{
            fontFamily: "var(--font-primary, 'DM Sans', sans-serif)",
            fontSize: 'clamp(64px, 10vw, 96px)',
            fontWeight: 800,
            color: '#3C0815',
            lineHeight: 0.95,
            marginBottom: '16px',
            letterSpacing: '-0.04em',
          }}>
            404
          </div>
          <h1 style={{
            fontFamily: "var(--font-primary, 'DM Sans', sans-serif)",
            fontSize: 'clamp(24px, 4vw, 30px)',
            fontWeight: 700,
            color: '#3C0815',
            letterSpacing: '-0.02em',
            margin: '0 0 12px',
          }}>
            Page Not Found
          </h1>
          <p style={{
            fontFamily: "var(--font-primary, 'DM Sans', sans-serif)",
            fontSize: '14.5px',
            lineHeight: 1.6,
            color: '#75645C',
            marginBottom: '28px',
          }}>
            The page you are looking for might have been moved or does not exist. Explore our fresh heritage savouries and artisanal namkeens in the shop.
          </p>
          <div className="notfound-btn-group">
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
