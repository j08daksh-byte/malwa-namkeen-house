import React, { useState, useEffect, useCallback, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../lib/cartContext';
import { useCustomerSession } from '../layout/CustomerSessionContext';
import { BUSINESS } from '../../lib/business';
import {
  Check,
  MapPin,
  Plus,
  ArrowRight,
  X,
  LockKeyhole,
  CheckCircle2,
  AlertCircle,
  Truck,
  Package,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SavedAddress {
  _id?: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const navigate = useNavigate();
  const { cart, subtotal, discountAmount, coupon, totalItems, clearCart, revalidateCart } = useCart();
  const { customer, loading: sessionLoading } = useCustomerSession();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  const [newAddress, setNewAddress] = useState<SavedAddress>({
    name: customer?.name || '',
    phone: customer?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '',
    landmark: '',
  });

  const [saveToBook, setSaveToBook] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online' | 'upi'>('cod');
  const [orderNotes, setOrderNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [idempotencyKey] = useState<string>(() => `checkout_${Date.now()}_${Math.random()}`);

  const token = typeof window !== 'undefined' ? localStorage.getItem('malwa_auth_token') : null;

  // Fetch Saved Addresses
  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/customer/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
          setAddresses(data.addresses);
          const def = data.addresses.find((a: SavedAddress) => a.isDefault);
          setSelectedAddressId(def?._id || data.addresses[0]._id || 'new');
          setIsAddingNewAddress(false);
        } else {
          setIsAddingNewAddress(true);
          setSelectedAddressId('new');
        }
      }
    } catch {
      setIsAddingNewAddress(true);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCreatedOrder(null);
      setErrorMessage(null);
      if (customer && token) {
        fetchAddresses();
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, customer, token, fetchAddresses]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shipping = subtotal >= 499 ? 0 : 49;
  const finalTotal = Math.max(0, Math.round((subtotal - discountAmount + shipping) * 100) / 100);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || cart.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    // 1. Revalidate Cart before final order creation
    try {
      const reval = await revalidateCart();
      if (!reval.valid && reval.adjustments.length > 0) {
        setErrorMessage(`Some items were updated based on current stock: ${reval.adjustments.join('. ')}`);
        setIsSubmitting(false);
        return;
      }
    } catch {
      // Proceed with server-side validation
    }

    // 2. Resolve Shipping Address
    let chosenAddress: SavedAddress;
    if (selectedAddressId !== 'new' && !isAddingNewAddress) {
      const found = addresses.find(a => a._id === selectedAddressId);
      if (!found) {
        setErrorMessage('Please select a valid delivery address.');
        setIsSubmitting(false);
        return;
      }
      chosenAddress = found;
    } else {
      if (
        !newAddress.name?.trim() ||
        !newAddress.phone?.trim() ||
        !newAddress.addressLine1?.trim() ||
        !newAddress.city?.trim() ||
        !newAddress.state?.trim() ||
        !newAddress.pincode?.trim()
      ) {
        setErrorMessage('Please fill in all required delivery address fields.');
        setIsSubmitting(false);
        return;
      }
      if (!/^\d{6}$/.test(newAddress.pincode.trim())) {
        setErrorMessage('Please enter a valid 6-digit Indian PIN code.');
        setIsSubmitting(false);
        return;
      }
      chosenAddress = newAddress;
    }

    // 3. Build Payload
    const payload = {
      items: cart.map(it => ({
        productId: it.product.id || (it.product as any)._id,
        variantId: (it.selectedOption as any).id || (it.selectedOption as any)._id,
        weight: it.selectedOption?.weight,
        sku: (it.selectedOption as any)?.sku,
        price: it.selectedOption?.price || (it.product as any).price || 0,
        quantity: it.quantity,
      })),
      shippingAddress: chosenAddress,
      saveAddressToBook: isAddingNewAddress && saveToBook,
      couponCode: coupon?.code || '',
      paymentMethod,
      notes: orderNotes,
      idempotencyKey,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setCreatedOrder(data.order);
        // Clear cart strictly after order confirmation
        clearCart();
      } else {
        setErrorMessage(data.message || 'Could not place order. Please try again.');
      }
    } catch {
      setErrorMessage('Network error during checkout. Please verify your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsAppNotification = () => {
    if (!createdOrder) return;
    const itemsText = (createdOrder.items || [])
      .map((it: any, idx: number) => `${idx + 1}. *${it.productName}* (${it.variantLabel}) × ${it.quantity} — ₹${it.itemTotal}`)
      .join('\n');

    const msg = `Namaste ${BUSINESS.name}! 🙏\n\n*CONFIRMED ORDER (#${createdOrder.orderNumber})*\n\n🛍️ *ITEMS:*\n${itemsText}\n\n💰 *Total Amount:* ₹${createdOrder.total}\n📍 *Deliver To:* ${createdOrder.shippingAddress?.name}, ${createdOrder.shippingAddress?.city} — ${createdOrder.shippingAddress?.pincode}\n\nPlease confirm dispatch. Thank you!`;

    window.open(`https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="checkout-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <style>{`
        .checkout-overlay {
          position: fixed;
          inset: 0;
          z-index: 400;
          background: rgba(35, 3, 10, 0.82);
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

        .checkout-dialog {
          background: #FDFAF4;
          width: min(100%, 780px);
          max-height: 92vh;
          border-radius: 20px;
          border: 1px solid rgba(200, 154, 61, 0.35);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .checkout-dialog__head {
          background: #3C0815;
          color: #FFF8EC;
          padding: 20px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(200, 154, 61, 0.25);
        }

        .checkout-dialog__title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          margin: 0;
          color: #FFF8EC;
        }

        .checkout-dialog__close {
          background: rgba(255, 255, 255, 0.12);
          border: none;
          color: #FFF8EC;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .checkout-dialog__body {
          flex: 1;
          overflow-y: auto;
          padding: 24px 28px;
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.95fr);
          gap: 28px;
        }

        .checkout-section-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 20px;
          font-weight: 700;
          color: #3C0815;
          margin: 0 0 12px;
        }

        .address-select-card {
          border: 1px solid rgba(200, 154, 61, 0.3);
          background: #FFFFFF;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .address-select-card--active {
          border: 2px solid #D4AA45;
          background: #FFFDF8;
        }

        .checkout-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .checkout-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .checkout-field label {
          font-family: Inter, sans-serif;
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #34211D;
        }

        .checkout-field input, .checkout-field select, .checkout-field textarea {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid rgba(200, 154, 61, 0.35);
          background: #FFFFFF;
          font-family: Inter, sans-serif;
          font-size: 13px;
          color: #34211D;
          outline: none;
        }

        .checkout-field input:focus, .checkout-field select:focus {
          border-color: #D4AA45;
        }

        .checkout-order-summary {
          background: #FAF6EF;
          border: 1px solid rgba(200, 154, 61, 0.25);
          border-radius: 12px;
          padding: 18px;
        }

        .checkout-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12.5px;
          margin-bottom: 8px;
        }

        .btn-place-order {
          width: 100%;
          height: 48px;
          background: #3C0815;
          color: #FFF8EC;
          border: none;
          border-radius: 999px;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(60, 8, 21, 0.22);
          transition: background 0.18s, transform 0.18s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 14px;
        }

        .btn-place-order:hover {
          background: #55000A;
          transform: translateY(-1px);
        }

        .btn-place-order:disabled {
          background: #8C786E;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 720px) {
          .checkout-dialog__body {
            grid-template-columns: 1fr;
            padding: 18px;
            gap: 20px;
          }
        }
      `}</style>

      <div className="checkout-dialog" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="checkout-dialog__head">
          <h2 className="checkout-dialog__title">
            {createdOrder ? 'Order Confirmation' : 'Complete Delivery & Order'}
          </h2>
          <button className="checkout-dialog__close" onClick={onClose} aria-label="Close checkout">
            <X size={18} />
          </button>
        </div>

        {/* Guest Redirection Screen */}
        {!customer ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', margin: 'auto' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(201,154,50,0.15)', color: '#D4AA45', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <LockKeyhole size={26} />
            </div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '28px', color: '#3C0815', margin: '0 0 8px' }}>
              Customer Sign In Required
            </h3>
            <p style={{ color: '#75645C', fontSize: '14px', maxWidth: '380px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Please sign in to your Malwa customer account to securely place your order and track historical deliveries.
            </p>
            <button
              className="btn-place-order"
              style={{ width: 'max-content', padding: '0 32px', margin: 'auto' }}
              onClick={() => {
                onClose();
                navigate('/account', { state: { from: '/shop' } });
              }}
            >
              Sign In or Create Account <ArrowRight size={15} />
            </button>
          </div>
        ) : createdOrder ? (
          /* Order Confirmation View */
          <div style={{ padding: '36px 28px', textAlign: 'center', overflowY: 'auto' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#D1FAE5', color: '#065F46', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '32px', color: '#3C0815', margin: '0 0 6px' }}>
              Thank You for Your Order!
            </h3>
            <p style={{ color: '#881337', fontWeight: 700, fontFamily: 'monospace', fontSize: '15px', margin: '0 0 16px' }}>
              ORDER #{createdOrder.orderNumber}
            </p>
            <p style={{ color: '#75645C', fontSize: '13.5px', maxWidth: '460px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              We have received your order for {createdOrder.items?.length} Malwa delicacy items totaling ₹{createdOrder.total}. Your order is currently being prepared with authentic small-batch heritage recipes.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-place-order"
                style={{ width: 'auto', padding: '0 24px', background: '#25D366' }}
                onClick={handleSendWhatsAppNotification}
              >
                Share via WhatsApp
              </button>
              <button
                className="btn-place-order"
                style={{ width: 'auto', padding: '0 24px' }}
                onClick={() => {
                  onClose();
                  navigate('/dashboard');
                }}
              >
                View in Account Dashboard <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          /* Main Checkout Form */
          <div className="checkout-dialog__body">
            {/* Left Column: Delivery Address Selection */}
            <div>
              <h3 className="checkout-section-title">1. Delivery Destination</h3>

              {errorMessage && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Existing Address List */}
              {addresses.length > 0 && !isAddingNewAddress && (
                <div style={{ marginBottom: '16px' }}>
                  {addresses.map(addr => (
                    <div
                      key={addr._id}
                      className={`address-select-card ${selectedAddressId === addr._id ? 'address-select-card--active' : ''}`}
                      onClick={() => setSelectedAddressId(addr._id || '')}
                    >
                      <input
                        type="radio"
                        name="selectedAddress"
                        checked={selectedAddressId === addr._id}
                        onChange={() => setSelectedAddressId(addr._id || '')}
                        style={{ marginTop: '2px', accentColor: '#55000A' }}
                      />
                      <div style={{ fontSize: '12.5px', color: '#34211D' }}>
                        <strong>{addr.name}</strong> ({addr.phone})
                        <div style={{ color: '#75645C', marginTop: '2px' }}>
                          {addr.addressLine1}, {addr.city} — {addr.pincode}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewAddress(true);
                      setSelectedAddressId('new');
                    }}
                    style={{ background: 'none', border: 'none', color: '#55000A', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}
                  >
                    <Plus size={14} /> Deliver to a new address
                  </button>
                </div>
              )}

              {/* New Address Form */}
              {(isAddingNewAddress || addresses.length === 0) && (
                <div>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewAddress(false)}
                      style={{ background: 'none', border: 'none', color: '#55000A', fontSize: '12px', fontWeight: 700, textDecoration: 'underline', marginBottom: '10px', cursor: 'pointer' }}
                    >
                      ← Back to saved addresses
                    </button>
                  )}

                  <div className="checkout-form-grid">
                    <div className="checkout-field">
                      <label>Recipient Name</label>
                      <input
                        value={newAddress.name}
                        onChange={e => setNewAddress(p => ({ ...p, name: e.target.value }))}
                        required
                        placeholder="Recipient full name"
                      />
                    </div>
                    <div className="checkout-field">
                      <label>Contact Phone</label>
                      <input
                        value={newAddress.phone}
                        onChange={e => setNewAddress(p => ({ ...p, phone: e.target.value }))}
                        required
                        placeholder="+91 00000 00000"
                      />
                    </div>
                    <div className="checkout-field" style={{ gridColumn: '1 / -1' }}>
                      <label>Address Line 1</label>
                      <input
                        value={newAddress.addressLine1}
                        onChange={e => setNewAddress(p => ({ ...p, addressLine1: e.target.value }))}
                        required
                        placeholder="Flat, House no., Street, Colony"
                      />
                    </div>
                    <div className="checkout-field">
                      <label>City</label>
                      <input
                        value={newAddress.city}
                        onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="checkout-field">
                      <label>State</label>
                      <input
                        value={newAddress.state}
                        onChange={e => setNewAddress(p => ({ ...p, state: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="checkout-field">
                      <label>PIN Code</label>
                      <input
                        value={newAddress.pincode}
                        onChange={e => setNewAddress(p => ({ ...p, pincode: e.target.value }))}
                        required
                        placeholder="6-digit PIN"
                        pattern="[0-9]{6}"
                      />
                    </div>
                    <div className="checkout-field">
                      <label>Landmark (Optional)</label>
                      <input
                        value={newAddress.landmark || ''}
                        onChange={e => setNewAddress(p => ({ ...p, landmark: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="saveToBook"
                      checked={saveToBook}
                      onChange={e => setSaveToBook(e.target.checked)}
                      style={{ accentColor: '#55000A' }}
                    />
                    <label htmlFor="saveToBook" style={{ fontSize: '12px', color: '#55000A', cursor: 'pointer' }}>
                      Save this address to my account address book
                    </label>
                  </div>
                </div>
              )}

              {/* Special Delivery Notes */}
              <div style={{ marginTop: '16px' }} className="checkout-field">
                <label>Special Instructions / Gifting Notes</label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="e.g. Ring bell twice, add gift card, handle with care"
                  style={{ resize: 'none' }}
                />
              </div>
            </div>

            {/* Right Column: Order Summary & Place Order */}
            <div>
              <h3 className="checkout-section-title">2. Order Summary</h3>

              <div className="checkout-order-summary">
                <div style={{ maxHeight: '160px', overflowY: 'auto', marginBottom: '12px', paddingRight: '4px' }}>
                  {cart.map(item => (
                    <div key={`${item.product.id}-${item.selectedOption.weight}`} className="checkout-item-row">
                      <div>
                        <strong>{item.product.name}</strong>
                        <div style={{ color: '#75645C', fontSize: '11px' }}>
                          {item.selectedOption.weight} × {item.quantity}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#3C0815' }}>
                        ₹{item.selectedOption.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid rgba(200,154,61,0.25)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                      <span>Discount ({coupon?.code || 'Promo'})</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Delivery</span>
                    <span>{shipping === 0 ? 'Complimentary (Free)' : `₹${shipping}`}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(200,154,61,0.25)', paddingTop: '8px', fontWeight: 800, fontSize: '16px', color: '#3C0815' }}>
                    <span>Total Amount</span>
                    <span>₹{finalTotal}</span>
                  </div>
                </div>

                <div style={{ marginTop: '14px', background: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(200,154,61,0.25)', fontSize: '12px' }}>
                  <div style={{ fontWeight: 700, color: '#55000A', marginBottom: '4px' }}>Payment Mode</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="payMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        style={{ accentColor: '#55000A' }}
                      />
                      Cash on Delivery
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="payMethod"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        style={{ accentColor: '#55000A' }}
                      />
                      UPI / QR (On Dispatch)
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-place-order"
                  disabled={isSubmitting || cart.length === 0}
                  onClick={handlePlaceOrder}
                >
                  {isSubmitting ? 'Securing your order…' : `Place Order (₹${finalTotal})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
