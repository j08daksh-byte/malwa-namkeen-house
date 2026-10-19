import LegalLayout from './LegalLayout';
import { useStoreSettings } from '../../lib/storeSettingsContext';

export default function RefundPolicy() {
  const { settings } = useStoreSettings();
  const storeName = settings.storeName || 'MALWA NAMKEEN HOUSE';
  const email = settings.contact?.email || 'malwanamkeenhouse@gmail.com';
  const phone = settings.contact?.phone || '+91 7987732765';
  const whatsapp = (settings.contact?.whatsappNumber || phone).replace(/\D/g, '');
  const address = settings.contact?.address?.full || 'No. 87/4-B, Sulikunte Village, Sarjapur Main Road, Dommasandra Post, Bengaluru – 562125, Karnataka, India';
  const customPolicy = settings.policies?.refundPolicy?.trim();

  return (
    <LegalLayout title="Refund Policy" lastUpdated="October 2026">
      {customPolicy && (
        <div style={{ background: '#FFF3E0', padding: '16px 20px', borderRadius: '8px', borderLeft: '4px solid #D97706', marginBottom: '24px' }}>
          <strong>Notice from Store Administration:</strong>
          <p style={{ margin: '6px 0 0', whiteSpace: 'pre-line' }}>{customPolicy}</p>
        </div>
      )}

      <h2>1. General Policy</h2>
      <p>{storeName} aims to handle all refund requests fairly and promptly. This page outlines the general circumstances under which refunds may be considered for online orders and bulk bookings.</p>

      <h2>2. When a Refund May Apply</h2>
      <p>A refund may be considered in the following situations:</p>
      <ul>
        <li>Cancellation of a catering or bulk order in accordance with the terms agreed at booking.</li>
        <li>A cancellation initiated by {storeName} due to out-of-stock inventory.</li>
        <li>Documented transit damage or delivery error of perishable savouries reported within 48 hours.</li>
        <li>A duplicate payment made in error.</li>
      </ul>

      <h2>3. When a Refund May Not Apply</h2>
      <p>Refunds may not be issued in the following cases:</p>
      <ul>
        <li>Cancellations made after the dispatch cutoff agreed at the time of booking or ordering.</li>
        <li>Dispatched transit items with incorrect or incomplete shipping addresses provided by the customer.</li>
        <li>Dissatisfaction with a product or package condition not raised at the time of delivery or receipt.</li>
      </ul>

      <h2>4. Refund Process</h2>
      <p>Approved refunds are processed via the original payment method where possible. Processing timelines depend on the payment method and our banking partner. We will communicate the expected timeline when confirming a refund.</p>

      <h2>5. How to Request a Refund</h2>
      <p>To initiate a refund request, contact us with your order reference number, proof of payment, and a brief description of the reason:</p>
      <ul>
        <li>Email: <a href={`mailto:${email}`}>{email}</a></li>
        <li>WhatsApp: <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">{phone}</a></li>
      </ul>

      <h2>6. Disputes</h2>
      <p>If you believe a refund has been incorrectly denied, please raise the matter in writing to <a href={`mailto:${email}`}>{email}</a>. We will review the case and respond as soon as possible.</p>

      <h2>7. Contact</h2>
      <p>{storeName}, {address}<br />Email: <a href={`mailto:${email}`}>{email}</a></p>
    </LegalLayout>
  );
}
