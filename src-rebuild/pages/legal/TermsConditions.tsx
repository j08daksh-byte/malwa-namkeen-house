import LegalLayout from './LegalLayout';
import { useStoreSettings } from '../../lib/storeSettingsContext';

export default function TermsConditions() {
  const { settings } = useStoreSettings();
  const storeName = settings.storeName || 'MALWA NAMKEEN HOUSE';
  const email = settings.contact?.email || 'malwanamkeenhouse@gmail.com';
  const city = settings.contact?.address?.city || 'Ujjain';
  const state = settings.contact?.address?.state || 'Madhya Pradesh';
  const customPolicy = settings.policies?.termsConditions?.trim();

  return (
    <LegalLayout title="Terms & Conditions" lastUpdated="October 2026">
      {customPolicy && (
        <div style={{ background: '#FFF3E0', padding: '16px 20px', borderRadius: '8px', borderLeft: '4px solid #D97706', marginBottom: '24px' }}>
          <strong>Notice from Store Administration:</strong>
          <p style={{ margin: '6px 0 0', whiteSpace: 'pre-line' }}>{customPolicy}</p>
        </div>
      )}

      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or using the {storeName} website and submitting any order or form on this site, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our website.</p>

      <h2>2. Order Confirmations & Enquiries</h2>
      <p>Order requests submitted through our website are subject to availability and verified payment. We reserve the right to decline or cancel any order request due to unforeseen inventory limitations.</p>
      <p>Please ensure that all information provided (name, delivery address, contact details) is accurate. {storeName} is not responsible for delivery delays arising from incorrect shipping information submitted by the customer.</p>

      <h2>3. Catering and Gifting Enquiries</h2>
      <p>Enquiries for catering, bulk orders, and corporate gifting are subject to separate quotation and agreement. Pricing, minimum order quantities, and delivery terms will be communicated directly by our team following your enquiry. No commitment exists until a written agreement is in place.</p>

      <h2>4. Intellectual Property</h2>
      <p>All content on this website — including text, images, logos, and design — is the intellectual property of {storeName} and may not be reproduced, distributed, or used without explicit written permission.</p>

      <h2>5. Limitation of Liability</h2>
      <p>{storeName} makes reasonable efforts to ensure the accuracy of information on this website but does not warrant that it is complete, current, or error-free. We are not liable for any losses or damages arising from your reliance on information provided on this site.</p>

      <h2>6. Governing Law</h2>
      <p>These Terms are governed by the laws of India. Any disputes arising from the use of this website shall be subject to the exclusive jurisdiction of the competent courts in {city}, {state}.</p>

      <h2>7. Changes to Terms</h2>
      <p>We reserve the right to modify these Terms at any time. The "Last Updated" date reflects the most recent revision. Continued use of our website constitutes acceptance of any changes.</p>

      <h2>8. Contact</h2>
      <p>For questions regarding these Terms, contact us at <a href={`mailto:${email}`}>{email}</a>.</p>
    </LegalLayout>
  );
}
