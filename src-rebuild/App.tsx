import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import SEOHead from './components/seo/SEOHead';
import ScrollToTop from './components/layout/ScrollToTop';

// Public site sections
import BrandIntro           from './components/layout/BrandIntro';
import Navbar               from './components/layout/Navbar';
import { CartProvider }     from './lib/cartContext';
import { CustomerSessionProvider } from './components/layout/CustomerSessionContext';
import { WishlistProvider } from './lib/wishlistContext';
import Hero                 from './components/sections/Hero';
import HeritageSpecialities from './components/sections/HeritageSpecialities';
import LegacyStory          from './components/sections/LegacyStory';
import MenuSection          from './components/sections/MenuSection';
import SignatureDelicacies  from './components/sections/SignatureDelicacies';
import Katering             from './components/sections/Katering';
import QualityValues        from './components/sections/QualityValues';
import GuestReviews         from './components/sections/GuestReviews';
import Contact              from './components/sections/Contact';
import Footer               from './components/sections/Footer';
import ReservationModal     from './components/sections/ReservationModal';
import Shop                 from './pages/Shop';
import ProductDetail        from './pages/ProductDetail';
import ContactPage          from './pages/Contact';
import AboutUs              from './pages/AboutUs';
import FAQ                  from './pages/FAQ';
import Account              from './pages/Account';
import Dashboard            from './pages/Dashboard';
import NotFound             from './pages/NotFound';

// Admin pages
import AdminLogin        from './pages/admin/AdminLogin';
import ProtectedRoute    from './pages/admin/ProtectedRoute';
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminProducts     from './pages/admin/AdminProducts';
import AdminCategories   from './pages/admin/AdminCategories';
import AdminOrders       from './pages/admin/AdminOrders';
import AdminCustomers    from './pages/admin/AdminCustomers';
import AdminDiscounts    from './pages/admin/AdminDiscounts';
import AdminInquiries    from './pages/admin/AdminInquiries';
import AdminReservations from './pages/admin/AdminReservations';
import AdminEnquiries    from './pages/admin/AdminEnquiries';
import AdminSettings     from './pages/admin/AdminSettings';
import AdminStaff        from './pages/admin/AdminStaff';
import ResetPassword     from './pages/admin/ResetPassword';
import AcceptInvite      from './pages/admin/AcceptInvite';

// Legal pages
import PrivacyPolicy      from './pages/legal/PrivacyPolicy';
import TermsConditions    from './pages/legal/TermsConditions';
import CancellationPolicy from './pages/legal/CancellationPolicy';
import RefundPolicy       from './pages/legal/RefundPolicy';

function PublicSite() {
  const [reservationOpen, setReservationOpen] = useState(false);
  const openReservation = () => setReservationOpen(true);

  const homeStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://malwanamkeen.com/#organization',
        name: 'MALWA NAMKEEN HOUSE',
        url: 'https://malwanamkeen.com',
        logo: 'https://malwanamkeen.com/logo.png',
        description: 'THE NAMKEEN & SNACKS HUB — Authentic Ratlami Sev, artisanal namkeens, and festive gifting.',
        telephone: '+91 7987732765',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://malwanamkeen.com/#website',
        url: 'https://malwanamkeen.com',
        name: 'MALWA NAMKEEN HOUSE',
        publisher: { '@id': 'https://malwanamkeen.com/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://malwanamkeen.com/shop?search={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <ErrorBoundary>
      <SEOHead
        title="THE NAMKEEN & SNACKS HUB"
        description="Authentic Malwa namkeens, small-batch Ratlami Sev, Ujjaini chivda, and festive gifting crafted with traditional spices and 100% pure cold-pressed groundnut oil."
        canonicalPath="/"
        structuredData={homeStructuredData}
      />
      <BrandIntro />
      <Navbar onReserve={openReservation} />
      <main>
        <Hero onReserve={openReservation} />
        <HeritageSpecialities />
        <LegacyStory />
        <MenuSection />
        <SignatureDelicacies />
        <Katering />
        <QualityValues />
        <GuestReviews />
        <Contact />
      </main>
      <Footer />
      <ReservationModal open={reservationOpen} onClose={() => setReservationOpen(false)} />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <CustomerSessionProvider>
        <WishlistProvider>
          <CartProvider>
            <Routes>
              {/* Public website */}
              <Route path="/" element={<PublicSite />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/account" element={<Account />} />
              <Route path="/login" element={<Account />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Legal pages */}
              <Route path="/privacy-policy"      element={<PrivacyPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsConditions />} />
              <Route path="/cancellation-policy"  element={<CancellationPolicy />} />
              <Route path="/refund-policy"        element={<RefundPolicy />} />

              {/* Admin — login (public) */}
              <Route path="/admin" element={<AdminLogin />} />

              {/* Admin — public recovery and invite acceptance */}
              <Route path="/admin/reset-password" element={<ResetPassword />} />
              <Route path="/admin/accept-invite"  element={<AcceptInvite />} />

              {/* Admin — protected */}
              <Route path="/admin/dashboard"    element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/products"     element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
              <Route path="/admin/categories"   element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
              <Route path="/admin/orders"       element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/customers"    element={<ProtectedRoute><AdminCustomers /></ProtectedRoute>} />
              <Route path="/admin/discounts"    element={<ProtectedRoute><AdminDiscounts /></ProtectedRoute>} />
              <Route path="/admin/inquiries"    element={<ProtectedRoute><AdminInquiries /></ProtectedRoute>} />
              <Route path="/admin/enquiries"    element={<ProtectedRoute><AdminEnquiries /></ProtectedRoute>} />
              <Route path="/admin/reservations" element={<ProtectedRoute><AdminReservations /></ProtectedRoute>} />
              <Route path="/admin/staff"        element={<ProtectedRoute requireSuperAdmin><AdminStaff /></ProtectedRoute>} />
              <Route path="/admin/settings"     element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </WishlistProvider>
      </CustomerSessionProvider>
    </BrowserRouter>
  );
}
