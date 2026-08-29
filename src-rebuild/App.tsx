import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import SEOHead from './components/seo/SEOHead';
import ScrollToTop from './components/layout/ScrollToTop';

// Public site sections (Directly loaded for instant first paint)
import BrandIntro           from './components/layout/BrandIntro';
import Navbar               from './components/layout/Navbar';
import { CartProvider }     from './lib/cartContext';
import { CustomerSessionProvider } from './components/layout/CustomerSessionContext';
import { WishlistProvider } from './lib/wishlistContext';
import { StoreSettingsProvider } from './lib/storeSettingsContext';
import Hero                 from './components/sections/Hero';
import HeritageSpecialities from './components/sections/HeritageSpecialities';
import LegacyStory          from './components/sections/LegacyStory';
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

// Lazy-loaded Admin pages (reduces initial customer bundle size)
const AdminLogin        = lazy(() => import('./pages/admin/AdminLogin'));
const ProtectedRoute    = lazy(() => import('./pages/admin/ProtectedRoute'));
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts     = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories   = lazy(() => import('./pages/admin/AdminCategories'));
const AdminBanners      = lazy(() => import('./pages/admin/AdminBanners'));
const AdminOrders       = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCustomers    = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminDiscounts    = lazy(() => import('./pages/admin/AdminDiscounts'));
const AdminInquiries    = lazy(() => import('./pages/admin/AdminInquiries'));
const AdminReservations = lazy(() => import('./pages/admin/AdminReservations'));
const AdminEnquiries    = lazy(() => import('./pages/admin/AdminEnquiries'));
const AdminSettings     = lazy(() => import('./pages/admin/AdminSettings'));
const AdminStaff        = lazy(() => import('./pages/admin/AdminStaff'));
const ResetPassword     = lazy(() => import('./pages/admin/ResetPassword'));
const AcceptInvite      = lazy(() => import('./pages/admin/AcceptInvite'));

// Lazy-loaded Legal pages
const PrivacyPolicy      = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsConditions    = lazy(() => import('./pages/legal/TermsConditions'));
const CancellationPolicy = lazy(() => import('./pages/legal/CancellationPolicy'));
const RefundPolicy       = lazy(() => import('./pages/legal/RefundPolicy'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center', background: '#F8F6F2' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #800020', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

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
      <StoreSettingsProvider>
        <CustomerSessionProvider>
          <WishlistProvider>
            <CartProvider>
              <Suspense fallback={<PageLoader />}>
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
                  <Route path="/forgot-password" element={<Account />} />
                  <Route path="/reset-password" element={<Account />} />
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* Legal pages */}
                  <Route path="/privacy-policy"       element={<PrivacyPolicy />} />
                  <Route path="/terms-and-conditions" element={<TermsConditions />} />
                  <Route path="/cancellation-policy"  element={<CancellationPolicy />} />
                  <Route path="/refund-policy"        element={<RefundPolicy />} />

                  {/* Admin — login (public) */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin"       element={<AdminLogin />} />

                  {/* Admin — public recovery and invite acceptance */}
                  <Route path="/admin/reset-password" element={<ResetPassword />} />
                  <Route path="/admin/accept-invite"  element={<AcceptInvite />} />

                  {/* Admin — protected */}
                  <Route path="/admin/dashboard"    element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/products"     element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
                  <Route path="/admin/categories"   element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
                  <Route path="/admin/banners"      element={<ProtectedRoute><AdminBanners /></ProtectedRoute>} />
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
              </Suspense>
            </CartProvider>
          </WishlistProvider>
        </CustomerSessionProvider>
      </StoreSettingsProvider>
    </BrowserRouter>
  );
}
