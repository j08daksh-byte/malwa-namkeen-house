import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

// Public site sections
import Navbar               from './components/layout/Navbar';
import { CartProvider }     from './components/layout/CartContext';
import { CustomerSessionProvider } from './components/layout/CustomerSessionContext';
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
import ContactPage          from './pages/Contact';
import AboutUs              from './pages/AboutUs';
import Account              from './pages/Account';
import Dashboard            from './pages/Dashboard';

// Admin pages
import AdminLogin        from './pages/admin/AdminLogin';
import ProtectedRoute    from './pages/admin/ProtectedRoute';
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminReservations from './pages/admin/AdminReservations';
import AdminEnquiries    from './pages/admin/AdminEnquiries';
import AdminSettings     from './pages/admin/AdminSettings';

// Legal pages
import PrivacyPolicy      from './pages/legal/PrivacyPolicy';
import TermsConditions    from './pages/legal/TermsConditions';
import CancellationPolicy from './pages/legal/CancellationPolicy';
import RefundPolicy       from './pages/legal/RefundPolicy';

function PublicSite() {
  const [reservationOpen, setReservationOpen] = useState(false);
  const openReservation = () => setReservationOpen(true);

  return (
    <ErrorBoundary>
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
      <CartProvider>
        <CustomerSessionProvider>
          <Routes>
            {/* Public website */}
            <Route path="/" element={<PublicSite />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about-us" element={<AboutUs />} />
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

            {/* Admin — protected */}
            <Route path="/admin/dashboard"    element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/reservations" element={<ProtectedRoute><AdminReservations /></ProtectedRoute>} />
            <Route path="/admin/enquiries"    element={<ProtectedRoute><AdminEnquiries /></ProtectedRoute>} />
            <Route path="/admin/settings"     element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
          </Routes>
        </CustomerSessionProvider>
      </CartProvider>
    </BrowserRouter>
  );
}
