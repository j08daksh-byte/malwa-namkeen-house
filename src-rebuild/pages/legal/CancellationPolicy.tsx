import LegalLayout from './LegalLayout';
import { useStoreSettings } from '../../lib/storeSettingsContext';

export default function CancellationPolicy() {
  const { settings } = useStoreSettings();
  const storeName = settings.storeName || 'MALWA NAMKEEN HOUSE';
  const email = settings.contact?.email || 'malwanamkeenhouse@gmail.com';
  const phone = settings.contact?.phone || '+91 7987732765';
  const whatsapp = (settings.contact?.whatsappNumber || phone).replace(/\D/g, '');
  const customPolicy = settings.policies?.cancellationPolicy?.trim();

  return (
    <LegalLayout title="Cancellation Policy" lastUpdated="October 2026">
      {customPolicy && (
        <div style={{ background: '#FFF3E0', padding: '16px 20px', borderRadius: '8px', borderLeft: '4px solid #D97706', marginBottom: '24px' }}>
          <strong>Notice from Store Administration:</strong>
          <p style={{ margin: '6px 0 0', whiteSpace: 'pre-line' }}>{customPolicy}</p>
        </div>
      )}

      <h2>1. Online Order Cancellations</h2>
      <p>We understand that plans can change. If you need to cancel or modify an online order, please contact us as early as possible at <a href={`mailto:${email}`}>{email}</a> or via WhatsApp before the order is dispatched.</p>
      <p>Once an order has been packaged and handed over to our courier partner, it cannot be cancelled in transit due to the perishable nature of packaged savouries.</p>

      <h2>2. Bulk and Gifting Order Cancellations</h2>
      <p>Cancellation terms for bulk orders, corporate gifting, and bespoke batches are agreed upon at the time of finalising the quotation and will be clearly communicated before any advance payment is requested. Please refer to your order confirmation or contact our team for the specific terms applicable to your order.</p>

      <h2>3. {storeName}-Initiated Cancellations</h2>
      <p>In rare cases — due to unforeseen circumstances, operational issues, or out-of-stock items — {storeName} may need to cancel a confirmed order or bulk booking. We will notify you promptly and work with you to find a suitable resolution, including a full refund of any advance payments made where applicable.</p>

      <h2>4. How to Cancel</h2>
      <p>To cancel an order or bulk enquiry, contact us via:</p>
      <ul>
        <li>Email: <a href={`mailto:${email}`}>{email}</a></li>
        <li>WhatsApp: <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">{phone}</a></li>
      </ul>
      <p>Please include your name, order ID or enquiry reference number, and contact details when contacting us.</p>
    </LegalLayout>
  );
}
