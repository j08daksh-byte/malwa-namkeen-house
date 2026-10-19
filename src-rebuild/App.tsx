import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import SEOHead from './components/seo/SEOHead';
import ScrollToTop from './components/layout/ScrollToTop';

// Public site sections (Directly loaded for instant first paint)
import BrandIntro           from './components/layout/BrandIntro';
import Navbar               from './components/layout/Navbar';
import { CartProvider, useCart } from './lib/cartContext';
import CartDrawer from './components/shop/CartDrawer';
import CheckoutModal from './components/shop/CheckoutModal';
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
const Shop          = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const ContactPage   = lazy(() => import('./pages/Contact'));
const AboutUs       = lazy(() => import('./pages/AboutUs'));
const FAQ           = lazy(() => import('./pages/FAQ'));
const Account       = lazy(() => import('./pages/Account'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const Wishlist      = lazy(() => import('./pages/Wishlist'));
const NotFound      = lazy(() => import('./pages/NotFound'));

// Premium Malwa Shimmer Skeletons for instant route transitions
import {
  ShopSkeleton,
  ProductDetailSkeleton,
  ContactSkeleton,
  AboutSkeleton,
  FAQSkeleton,
  AccountSkeleton,
  DashboardSkeleton,
  WishlistSkeleton,
  LegalSkeleton,
} from './components/skeletons';

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
const ShippingPolicy     = lazy(() => import('./pages/legal/ShippingPolicy'));

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
        '@type': ['LocalBusiness', 'Store'],
        '@id': 'https://www.malwanamkeenhouse.com/#store',
        name: 'MALWA NAMKEEN HOUSE',
        alternateName: 'Malwa Namkeen House Ujjain',
        url: 'https://www.malwanamkeenhouse.com',
        logo: 'https://www.malwanamkeenhouse.com/logo.png',
        image: 'https://www.malwanamkeenhouse.com/hero-banner-1.png',
        description: 'Best authentic namkeen & sweets shop in Ujjain, Madhya Pradesh. Handcrafted Ratlami Sev, Ujjaini Sev, mixture, and festive gifting in pure groundnut oil.',
        telephone: '+91 79877 32765',
        priceRange: '₹₹',
        currenciesAccepted: 'INR',
        paymentAccepted: 'Cash, UPI, Credit Card, Debit Card',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Maksi Rd, Freeganj',
          addressLocality: 'Ujjain',
          addressRegion: 'Madhya Pradesh',
          postalCode: '456010',
          addressCountry: 'IN',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 23.1828,
          longitude: 75.7925,
        },
        sameAs: [
          'https://www.instagram.com/malwanamkeenhouse',
          'https://www.facebook.com/malwanamkeenhouse',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+91 79877 32765',
          contactType: 'customer service',
          areaServed: 'IN',
          availableLanguage: ['en', 'hi'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.malwanamkeenhouse.com/#website',
        url: 'https://www.malwanamkeenhouse.com',
        name: 'MALWA NAMKEEN HOUSE — Best Namkeen Shop in Ujjain',
        publisher: { '@id': 'https://www.malwanamkeenhouse.com/#store' },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://www.malwanamkeenhouse.com/shop?search={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'ItemList',
        '@id': 'https://www.malwanamkeenhouse.com/#navigation',
        name: 'Main Site Navigation',
        itemListElement: [
          { '@type': 'SiteNavigationElement', position: 1, name: 'Shop All Namkeens', url: 'https://www.malwanamkeenhouse.com/shop' },
          { '@type': 'SiteNavigationElement', position: 2, name: 'My Account', url: 'https://www.malwanamkeenhouse.com/account' },
          { '@type': 'SiteNavigationElement', position: 3, name: 'Contact & Store', url: 'https://www.malwanamkeenhouse.com/contact' },
          { '@type': 'SiteNavigationElement', position: 4, name: 'Heritage & Legacy', url: 'https://www.malwanamkeenhouse.com/about-us' },
          { '@type': 'SiteNavigationElement', position: 5, name: 'Shipping & Delivery', url: 'https://www.malwanamkeenhouse.com/shipping-policy' },
          { '@type': 'SiteNavigationElement', position: 6, name: 'Terms & Conditions', url: 'https://www.malwanamkeenhouse.com/terms-and-conditions' },
        ],
      },
    ],
  };

  return (
    <ErrorBoundary>
      <SEOHead
        title="Best Namkeen & Sweets Shop in Ujjain | Authentic Ratlami Sev"
        description="Authentic namkeen shop in Ujjain, Madhya Pradesh. Handcrafted Ratlami Sev, Ujjaini Sev, festive sweets, and namkeens fried in 100% pure cold-pressed groundnut oil."
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

function GlobalCartAndCheckout() {
  const { isCheckoutOpen, closeCheckout, openCheckout } = useCart();
  return (
    <>
      <CartDrawer onOpenCheckout={openCheckout} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={closeCheckout} />
    </>
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
              <GlobalCartAndCheckout />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public website */}
                  <Route path="/" element={<PublicSite />} />
                  <Route path="/shop" element={<Suspense fallback={<ShopSkeleton />}><Shop /></Suspense>} />
                  <Route path="/product/:slug" element={<Suspense fallback={<ProductDetailSkeleton />}><ProductDetail /></Suspense>} />
                  <Route path="/contact" element={<Suspense fallback={<ContactSkeleton />}><ContactPage /></Suspense>} />
                  <Route path="/about-us" element={<Suspense fallback={<AboutSkeleton />}><AboutUs /></Suspense>} />
                  <Route path="/faq" element={<Suspense fallback={<FAQSkeleton />}><FAQ /></Suspense>} />
                  <Route path="/account" element={<Suspense fallback={<AccountSkeleton />}><Account /></Suspense>} />
                  <Route path="/login" element={<Suspense fallback={<AccountSkeleton />}><Account /></Suspense>} />
                  <Route path="/forgot-password" element={<Suspense fallback={<AccountSkeleton />}><Account /></Suspense>} />
                  <Route path="/reset-password" element={<Suspense fallback={<AccountSkeleton />}><Account /></Suspense>} />
                  <Route path="/dashboard" element={<Suspense fallback={<DashboardSkeleton />}><Dashboard /></Suspense>} />
                  <Route path="/wishlist" element={<Suspense fallback={<WishlistSkeleton />}><Wishlist /></Suspense>} />

                  {/* Legal pages */}
                  <Route path="/privacy-policy"       element={<Suspense fallback={<LegalSkeleton />}><PrivacyPolicy /></Suspense>} />
                  <Route path="/terms-and-conditions" element={<Suspense fallback={<LegalSkeleton />}><TermsConditions /></Suspense>} />
                  <Route path="/cancellation-policy"  element={<Suspense fallback={<LegalSkeleton />}><CancellationPolicy /></Suspense>} />
                  <Route path="/refund-policy"        element={<Suspense fallback={<LegalSkeleton />}><RefundPolicy /></Suspense>} />
                  <Route path="/shipping-policy"      element={<Suspense fallback={<LegalSkeleton />}><ShippingPolicy /></Suspense>} />
                  <Route path="/shipping-and-delivery" element={<Navigate to="/shipping-policy" replace />} />

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
                  <Route path="/admin/enquiries"    element={<Navigate to="/admin/inquiries" replace />} />
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
