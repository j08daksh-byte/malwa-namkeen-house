import LegalLayout from './LegalLayout';
import { useStoreSettings } from '../../lib/storeSettingsContext';

export default function ShippingPolicy() {
  const { settings } = useStoreSettings();
  const freeThreshold = settings.deliverySettings?.freeShippingThreshold ?? 499;
  const standardFee = settings.deliverySettings?.standardShippingFee ?? 49;
  const storeName = settings.storeName || 'MALWA NAMKEEN HOUSE';
  const email = settings.contact?.email || 'malwanamkeenhouse@gmail.com';
  const phone = settings.contact?.phone || '+91 7987732765';
  const whatsapp = (settings.contact?.whatsappNumber || phone).replace(/\D/g, '');
  const address = settings.contact?.address?.full || '99/1 Kalidas Marg, Maxi Road, Freeganj, Ujjain – 456010, Madhya Pradesh, India';
  const customPolicy = settings.policies?.shippingPolicy?.trim();

  return (
    <LegalLayout title="Shipping & Delivery Policy" lastUpdated="October 2026">
      {customPolicy && (
        <div style={{ background: '#FFF3E0', padding: '16px 20px', borderRadius: '8px', borderLeft: '4px solid #D97706', marginBottom: '24px' }}>
          <strong>Notice from Store Administration:</strong>
          <p style={{ margin: '6px 0 0', whiteSpace: 'pre-line' }}>{customPolicy}</p>
        </div>
      )}

      <h2>1. Nationwide Shipping Coverage</h2>
      <p>
        {storeName} ships fresh, artisanal namkeens, sweets, and gifting hampers across India to all major serviceable pincodes in partnership with premium national courier partners.
      </p>

      <h2>2. Order Processing & Dispatch Timelines</h2>
      <p>
        Because our savouries are prepared in small batches and packed fresh in aroma-seal pouches, all retail orders are processed and handed over to our logistics partners within <strong>24 to 48 hours</strong> of order confirmation (excluding Sundays and national holidays).
      </p>

      <h2>3. Delivery Timelines</h2>
      <p>Estimated transit times from our dispatch facility in Ujjain are as follows:</p>
      <ul>
        <li><strong>Madhya Pradesh & Central India:</strong> 1 to 2 business days.</li>
        <li><strong>Metros (Delhi NCR, Mumbai, Pune, Kolkata, Bengaluru, Hyderabad):</strong> 3 to 5 business days.</li>
        <li><strong>Tier-2, Tier-3 Cities & Regional Towns:</strong> 4 to 7 business days.</li>
      </ul>
      <p>
        Please note that public holidays, adverse weather conditions, or local courier delays may occasionally impact transit times.
      </p>

      <h2>4. Shipping Rates & Free Delivery Threshold</h2>
      <p>
        We believe in transparent pricing with no hidden charges at checkout:
      </p>
      <ul>
        <li><strong>Free Standard Delivery:</strong> All orders with a subtotal of <strong>₹{freeThreshold} or more</strong> qualify for free nationwide delivery.</li>
        <li><strong>Standard Shipping Fee:</strong> Orders below ₹{freeThreshold} incur a flat nominal delivery fee of <strong>₹{standardFee}</strong> across India.</li>
      </ul>

      <h2>5. Shipment Tracking</h2>
      <p>
        As soon as your consignment is collected by our courier partner, a live Air Waybill (AWB) tracking number and courier tracking link are generated. You can track your package in real-time from your <strong>Customer Dashboard</strong> or via the tracking link sent to your registered email and mobile number.
      </p>

      <h2>6. Damaged, Leaking, or Tampered Shipments</h2>
      <p>
        We take utmost care in packaging using food-grade multi-layer corrugated boxes and tamper-evident sealing. In the unlikely event that your package appears physically tampered or damaged upon delivery:
      </p>
      <ul>
        <li>Do not accept the delivery or mention "Damaged upon delivery" on the courier delivery sheet.</li>
        <li>Take clear photos or an unboxing video of the outer box and contents.</li>
        <li>Notify our customer support team within <strong>48 hours</strong> of receipt for an immediate free replacement or refund.</li>
      </ul>

      <h2>7. Delivery Queries & Support</h2>
      <p>For any queries regarding your order status, dispatch, or address changes, please reach out to us:</p>
      <ul>
        <li>Email: <a href={`mailto:${email}`}>{email}</a></li>
        <li>WhatsApp Support: <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">{phone}</a></li>
        <li>Dispatch Facility: {address}</li>
      </ul>
    </LegalLayout>
  );
}
