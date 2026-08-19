import React, { useState, useEffect } from 'react';
import { useCart } from '../../lib/cartContext';
import { BUSINESS } from '../../lib/business';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { cart, subtotal, totalItems, clearCart } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Bengaluru',
    pincode: '',
    notes: '',
    paymentMethod: 'cod',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setOrderConfirmed(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedOrderId = `MLW-${Math.floor(100000 + Math.random() * 900000)}`;

    setTimeout(() => {
      setOrderConfirmed(generatedOrderId);
      setIsSubmitting(false);
      clearCart();
    }, 600);
  };

  const handleSendWhatsAppConfirmation = () => {
    if (!orderConfirmed) return;

    let itemsList = '';
    cart.forEach((item, idx) => {
      itemsList += `${idx + 1}. *${item.product.name}* (${item.selectedOption.weight}) × ${item.quantity} — ₹${item.selectedOption.price * item.quantity}\n`;
    });

    const msg = `Namaste ${BUSINESS.name}! 🙏\n\n*NEW SHOP ORDER (#${orderConfirmed})*\n\n🛍️ *ITEMS:*\n${itemsList}\n📦 *Total Items:* ${totalItems}\n💰 *Total Amount:* ₹${subtotal}\n💳 *Payment Method:* ${formData.paymentMethod.toUpperCase()}\n\n📍 *DELIVERY ADDRESS:*\n*Name:* ${formData.name}\n*Phone:* ${formData.phone}\n*Address:* ${formData.address}, ${formData.city} - ${formData.pincode}\n${formData.notes ? `*Special Notes:* ${formData.notes}\n` : ''}\nPlease confirm my order dispatch. Thank you!`;

    window.open(`https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="checkout-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <style>{`
        .checkout-overlay {
          position: fixed;
          inset: 0;
          z-index: 400;
          background: rgba(35, 3, 10, 0.80);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: checkoutFade 0.22s ease;
        }

        @keyframes checkoutFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .checkout-modal {
          background: #FDFAF4;
          border: 1px solid rgba(200, 154, 61, 0.40);
          border-radius: 24px;
          max-width: 640px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.40);
          position: relative;
        }

        .checkout-modal__header {
          background: #55000A;
          color: #FFF8EC;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(200, 154, 61, 0.25);
        }

        .checkout-modal__title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: #FFF8EC;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .checkout-modal__close-btn {
          background: none;
          border: none;
          color: rgba(255, 248, 236, 0.80);
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: color 0.15s;
        }

        .checkout-modal__close-btn:hover {
          color: #D4AA45;
        }

        .checkout-modal__body {
          padding: 28px;
        }

        /* ── Order Summary Card ──────────────────────────────── */
        .checkout-summary-mini {
          background: #FAF5ED;
          border: 1px solid rgba(200, 154, 61, 0.22);
          border-radius: 14px;
          padding: 14px 18px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .checkout-summary-mini__left {
          font-family: Inter, sans-serif;
          font-size: 13px;
          color: #5E4940;
        }

        .checkout-summary-mini__left strong {
          color: #55000A;
        }

        .checkout-summary-mini__total {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          color: #55000A;
        }

        /* ── Form Inputs ─────────────────────────────────────── */
        .checkout-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .checkout-field--full {
          grid-column: 1 / -1;
        }

        .checkout-label {
          display: block;
          font-family: Inter, sans-serif;
          font-size: 11.5px;
          font-weight: 700;
          color: #55000A;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .checkout-input,
        .checkout-select,
        .checkout-textarea {
          width: 100%;
          background: #FFFDF8;
          border: 1.5px solid rgba(200, 154, 61, 0.35);
          border-radius: 10px;
          padding: 10px 14px;
          font-family: Inter, sans-serif;
          font-size: 13.5px;
          color: #34211D;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }

        .checkout-input:focus,
        .checkout-select:focus,
        .checkout-textarea:focus {
          border-color: #C99A32;
          box-shadow: 0 0 0 3px rgba(201, 154, 50, 0.15);
        }

        .checkout-textarea {
          resize: vertical;
          min-height: 70px;
        }

        .checkout-submit-btn {
          grid-column: 1 / -1;
          height: 48px;
          border-radius: 999px;
          background: #55000A;
          color: #FFF8EC;
          border: 1px solid #55000A;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          cursor: pointer;
          margin-top: 8px;
          box-shadow: 0 6px 18px rgba(85, 0, 10, 0.20);
          transition: background 0.18s, transform 0.18s;
        }

        .checkout-submit-btn:hover {
          background: #6B000D;
          transform: translateY(-1px);
        }

        /* ── Success Confirmation Screen ─────────────────────── */
        .checkout-success {
          text-align: center;
          padding: 20px 10px;
        }

        .checkout-success__icon {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: rgba(37, 211, 102, 0.15);
          border: 2px solid #25D366;
          color: #20BA5A;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
        }

        .checkout-success__title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 32px;
          font-weight: 700;
          color: #55000A;
          margin: 0 0 8px;
        }

        .checkout-success__id-badge {
          display: inline-block;
          font-family: Inter, sans-serif;
          font-size: 12.5px;
          font-weight: 800;
          color: #2C0612;
          background: #D4AA45;
          padding: 4px 14px;
          border-radius: 999px;
          margin-bottom: 18px;
          letter-spacing: 0.05em;
        }

        .checkout-success__desc {
          font-family: Inter, sans-serif;
          font-size: 14px;
          color: #5E4940;
          line-height: 1.6;
          max-width: 440px;
          margin: 0 auto 24px;
        }

        .checkout-success__actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 380px;
          margin: 0 auto;
        }

        .checkout-success__wa-btn {
          height: 46px;
          border-radius: 999px;
          background: #25D366;
          color: white;
          border: none;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(37, 211, 102, 0.30);
          transition: background 0.18s;
        }

        .checkout-success__wa-btn:hover {
          background: #20BA5A;
        }

        .checkout-success__done-btn {
          height: 42px;
          border-radius: 999px;
          background: transparent;
          color: #55000A;
          border: 1.5px solid rgba(85, 0, 10, 0.30);
          font-family: Inter, sans-serif;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.18s;
        }

        .checkout-success__done-btn:hover {
          background: rgba(85, 0, 10, 0.06);
        }

        @media (max-width: 580px) {
          .checkout-form {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="checkout-modal" onClick={e => e.stopPropagation()}>
        <div className="checkout-modal__header">
          <h2 id="checkout-title" className="checkout-modal__title">
            {orderConfirmed ? 'Order Received' : 'Delivery & Checkout'}
          </h2>
          <button className="checkout-modal__close-btn" onClick={onClose} aria-label="Close checkout">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="checkout-modal__body">
          {orderConfirmed ? (
            <div className="checkout-success">
              <div className="checkout-success__icon" aria-hidden="true">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="checkout-success__title">Thank You, {formData.name || 'Guest'}!</h3>
              <span className="checkout-success__id-badge">Order ID: {orderConfirmed}</span>
              <p className="checkout-success__desc">
                Your order for Malwa delicacies has been registered. We are preparing your freshly packed batch for dispatch.
              </p>

              <div className="checkout-success__actions">
                <button
                  type="button"
                  className="checkout-success__wa-btn"
                  onClick={handleSendWhatsAppConfirmation}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-1.127-.08-.271-.089-.624-.22-1.077-.42-1.912-.846-3.149-2.775-3.245-2.903-.095-.129-.773-1.029-.773-1.962 0-.933.489-1.393.663-1.583.174-.19.38-.238.507-.238.127 0 .254.001.365.006.118.005.277-.045.433.332.162.392.553 1.348.601 1.446.048.098.08.213.016.342-.064.129-.096.208-.19.319-.096.111-.202.247-.289.332-.097.094-.198.196-.085.39.113.194.502.828 1.077 1.341.74.66 1.364.865 1.558.961.194.096.308.08.423-.051.114-.131.488-.568.618-.762.13-.195.26-.162.437-.097.178.064 1.128.532 1.322.629.194.097.324.145.372.228.047.081.047.472-.097.877z" />
                  </svg>
                  Confirm on WhatsApp
                </button>
                <button
                  type="button"
                  className="checkout-success__done-btn"
                  onClick={onClose}
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="checkout-summary-mini">
                <div className="checkout-summary-mini__left">
                  <span>Items: <strong>{totalItems}</strong></span>
                </div>
                <div className="checkout-summary-mini__total">
                  Total: ₹{subtotal}
                </div>
              </div>

              <form className="checkout-form" onSubmit={handleSubmit}>
                <div>
                  <label className="checkout-label" htmlFor="checkout-name">Full Name *</label>
                  <input
                    id="checkout-name"
                    name="name"
                    type="text"
                    required
                    className="checkout-input"
                    placeholder="e.g. Ramesh Chandra"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="checkout-label" htmlFor="checkout-phone">Phone / WhatsApp *</label>
                  <input
                    id="checkout-phone"
                    name="phone"
                    type="tel"
                    required
                    className="checkout-input"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="checkout-field--full">
                  <label className="checkout-label" htmlFor="checkout-address">Delivery Address *</label>
                  <input
                    id="checkout-address"
                    name="address"
                    type="text"
                    required
                    className="checkout-input"
                    placeholder="House/Flat No., Apartment, Street, Landmark"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="checkout-label" htmlFor="checkout-city">City *</label>
                  <input
                    id="checkout-city"
                    name="city"
                    type="text"
                    required
                    className="checkout-input"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="checkout-label" htmlFor="checkout-pincode">Pincode *</label>
                  <input
                    id="checkout-pincode"
                    name="pincode"
                    type="text"
                    required
                    className="checkout-input"
                    placeholder="e.g. 560034"
                    value={formData.pincode}
                    onChange={handleChange}
                  />
                </div>

                <div className="checkout-field--full">
                  <label className="checkout-label" htmlFor="checkout-payment">Payment Preference</label>
                  <select
                    id="checkout-payment"
                    name="paymentMethod"
                    className="checkout-select"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                  >
                    <option value="cod">Cash / UPI on Delivery</option>
                    <option value="whatsapp_upi">Instant UPI via WhatsApp (GPay / PhonePe / Paytm)</option>
                    <option value="bank_transfer">Direct NEFT / Bank Transfer</option>
                  </select>
                </div>

                <div className="checkout-field--full">
                  <label className="checkout-label" htmlFor="checkout-notes">Special Instructions (Optional)</label>
                  <textarea
                    id="checkout-notes"
                    name="notes"
                    className="checkout-textarea"
                    placeholder="E.g. Gift wrap with personalized greeting, call before delivery, etc."
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

                <button
                  type="submit"
                  className="checkout-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Placing Order...' : `Place Order (₹${subtotal})`}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
