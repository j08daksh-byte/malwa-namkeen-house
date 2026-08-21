import React, { useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/sections/Footer';
import ContactSection from '../components/sections/Contact';
import SEOHead from '../components/seo/SEOHead';

export default function Contact() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div style={{ background: 'var(--bg-parchment, #F6EFE3)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEOHead
        title="Contact Us — Orders, Gifting & Enquiries"
        description="Get in touch with Malwa Namkeen House for bulk corporate gifting, wedding orders, flavour recommendations, and customer support."
        canonicalPath="/contact"
      />
      <Navbar />
      <main style={{ flex: 1 }}>
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
