import LegalLayout from './LegalLayout';
import { useStoreSettings } from '../../lib/storeSettingsContext';

export default function PrivacyPolicy() {
  const { settings } = useStoreSettings();
  const storeName = settings.storeName || 'MALWA NAMKEEN HOUSE';
  const email = settings.contact?.email || 'malwanamkeenhouse@gmail.com';
  const address = settings.contact?.address?.full || '99/1 Kalidas Marg, Maxi Road, Freeganj, Ujjain – 456010, Madhya Pradesh, India';
  const customPolicy = settings.policies?.privacyPolicy?.trim();

  return (
    <LegalLayout title="Privacy Policy" lastUpdated="October 2026">
      {customPolicy && (
        <div style={{ background: '#FFF3E0', padding: '16px 20px', borderRadius: '8px', borderLeft: '4px solid #D97706', marginBottom: '24px' }}>
          <strong>Notice from Store Administration:</strong>
          <p style={{ margin: '6px 0 0', whiteSpace: 'pre-line' }}>{customPolicy}</p>
        </div>
      )}

      <h2>1. Information We Collect</h2>
      <p>When you browse our catalog, submit an enquiry, create a patron account, or place an order on our website, we collect necessary personal information including your name, email address, phone number, and delivery address. Payment credentials (card numbers, UPI IDs, net banking details) are handled directly by PCI-DSS compliant payment gateways and are never stored on our servers.</p>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information you provide to:</p>
      <ul>
        <li>Process, dispatch, and deliver your orders accurately.</li>
        <li>Transmit order confirmation, tracking updates, and invoices via email or SMS/WhatsApp.</li>
        <li>Respond to your customer support enquiries and bulk booking requests.</li>
        <li>Improve our store catalog, security, and services.</li>
      </ul>
      <p>We strictly do not sell, rent, or trade your personal information to third parties.</p>

      <h2>3. Data Storage & Security</h2>
      <p>Your account and order details are stored securely in our encrypted cloud database. Access to your personal data is restricted to authorised {storeName} administrative staff. We implement TLS encryption, hashed authentication, and regular vulnerability audits to safeguard your data.</p>

      <h2>4. Data Retention</h2>
      <p>We retain transaction and order records in compliance with applicable Indian commercial, tax (GST), and accounting regulations. You may request review or deletion of your account at any time by contacting us at the address below.</p>

      <h2>5. Cookies & Local Session</h2>
      <p>Our website uses local storage and essential session tokens solely for authentication, keeping your cart active, and preserving your preferences. We do not use third-party invasive tracking or advertising cookies.</p>

      <h2>6. Third-Party Infrastructure Services</h2>
      <p>Our e-commerce infrastructure operates in conjunction with trusted service providers:</p>
      <ul>
        <li><strong>MongoDB Atlas</strong> — secure cloud database hosting.</li>
        <li><strong>Resend</strong> — transactional email notifications.</li>
        <li><strong>Cloudinary</strong> — media and product image delivery.</li>
      </ul>
      <p>These services operate under strict data protection and confidentiality agreements.</p>

      <h2>7. Your Rights</h2>
      <p>You have the right to request access to, correction of, or deletion of the personal data we hold about you. To exercise these rights, please contact us at <a href={`mailto:${email}`}>{email}</a>.</p>

      <h2>8. Changes to This Policy</h2>
      <p>We may update this Privacy Policy periodically. The "Last Updated" date reflects the most recent revision. Continued use of our website after any changes constitutes acceptance of the revised policy.</p>

      <h2>9. Contact</h2>
      <p>{storeName}, {address}<br />Email: <a href={`mailto:${email}`}>{email}</a></p>
    </LegalLayout>
  );
}
