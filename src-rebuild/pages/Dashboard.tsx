import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MapPin,
  UserRound,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Check,
  ArrowRight,
  X,
  LockKeyhole,
  ChevronRight,
  ExternalLink,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Mail,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  CreditCard,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/sections/Footer';
import SEOHead from '../components/seo/SEOHead';
import { useCustomerSession } from '../components/layout/CustomerSessionContext';
import { DashboardSkeleton } from '../components/skeletons';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type Section = 'dashboard' | 'orders' | 'addresses' | 'details';

export interface CustomerAddress {
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

export interface CustomerOrder {
  _id: string;
  orderNumber: string;
  items: Array<{
    productName: string;
    variantLabel: string;
    sku?: string;
    price: number;
    quantity: number;
    itemTotal: number;
    image?: string;
  }>;
  subtotal: number;
  discount: number;
  discountCode?: string;
  shipping: number;
  total: number;
  shippingAddress: CustomerAddress;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod?: string;
  shipmentStatus: string;
  trackingInfo?: {
    courierName?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  };
  shiprocketDetails?: {
    shipmentId?: number;
    awbCode?: string;
    courierName?: string;
    trackingUrl?: string;
    status?: string;
    rawStatus?: string;
    lastEvent?: string;
  };
  createdAt: string;
}

const blankAddress: CustomerAddress = {
  name: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
  isDefault: false,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { customer, loading: sessionLoading, signOut, updateProfile } = useCustomerSession();

  const [section, setSection] = useState<Section>('dashboard');
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [cancelModalOrder, setCancelModalOrder] = useState<CustomerOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [paymentActionError, setPaymentActionError] = useState<string | null>(null);

  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [notice, setNotice] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string>('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await signOut();
    navigate('/', { replace: true });
  };

  // 2-Step Password Change with Email OTP
  const [passwordStep, setPasswordStep] = useState<1 | 2>(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  // Resend countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('malwa_auth_token') : null;

  // Protect route
  useEffect(() => {
    if (!sessionLoading && !customer) {
      navigate('/account', { replace: true });
    }
  }, [customer, sessionLoading, navigate]);

  // Fetch Addresses
  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/customer/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.addresses)) {
          setAddresses(data.addresses);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch customer addresses', e);
    }
  }, [token]);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/customer/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch customer orders', e);
    }
  }, [token]);

  useEffect(() => {
    if (customer && token) {
      fetchAddresses();
      fetchOrders();
    }
  }, [customer, token, fetchAddresses, fetchOrders]);

  // Dialog scroll lock and Escape key
  useEffect(() => {
    const isModalOpen = Boolean(editingAddress || selectedOrder || cancelModalOrder);
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (!isCancellingOrder) setCancelModalOrder(null);
          setEditingAddress(null);
          setSelectedOrder(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [editingAddress, selectedOrder, cancelModalOrder, isCancellingOrder]);

  const go = (next: Section) => {
    setSection(next);
    setNotice('');
    setErrorNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel Order (Customer self-service for eligible pending orders)
  const handleCancelOrder = async (order: CustomerOrder) => {
    setIsCancellingOrder(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/customer/orders/${order._id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ reason: cancelReason.trim() || 'Cancelled by customer via dashboard' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to cancel order.');
      }

      const updatedOrder = data.order || { ...order, orderStatus: 'cancelled' };
      setOrders(prev => prev.map(o => (o._id === order._id ? { ...o, ...updatedOrder, orderStatus: 'cancelled' } : o)));
      if (selectedOrder && selectedOrder._id === order._id) {
        setSelectedOrder(prev => prev ? { ...prev, ...updatedOrder, orderStatus: 'cancelled' } : null);
      }

      setNotice('Your order has been cancelled successfully. Reserved delicacies have been returned to stock.');
      setCancelModalOrder(null);
      setCancelReason('');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to cancel order.';
      setCancelError(errMsg);
    } finally {
      setIsCancellingOrder(false);
    }
  };

  // Retry or Complete Online Payment
  const handleRetryPayment = async (order: CustomerOrder) => {
    try {
      setIsRetryingPayment(true);
      setPaymentActionError(null);
      const res = await fetch(`/api/orders/${order._id}/retry-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.razorpay) {
        setPaymentActionError(data.message || 'Unable to initialize payment retry.');
        setIsRetryingPayment(false);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setPaymentActionError('Payment gateway failed to load. Please check your internet connection.');
        setIsRetryingPayment(false);
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: data.razorpay.keyId,
        amount: data.razorpay.amount,
        currency: data.razorpay.currency || 'INR',
        name: data.razorpay.name || 'Malwa Namkeen House',
        description: data.razorpay.description,
        order_id: data.razorpay.orderId,
        prefill: data.razorpay.prefill || {},
        theme: { color: '#3C0815' },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/orders/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              credentials: 'include',
              body: JSON.stringify({
                orderId: order._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              await fetchOrders();
              if (verifyData.order) {
                setSelectedOrder(verifyData.order);
              }
              setNotice('Payment completed successfully! Your order has been confirmed.');
            } else {
              setPaymentActionError(verifyData.message || 'Payment verification failed.');
            }
          } catch {
            setPaymentActionError('Network error during payment verification.');
          } finally {
            setIsRetryingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsRetryingPayment(false);
          },
        },
      });

      rzp.on('payment.failed', function (resp: any) {
        setIsRetryingPayment(false);
        const reason = resp?.error?.description || 'Payment was declined by issuing bank.';
        setPaymentActionError(`Payment failed: ${reason}`);
      });

      rzp.open();
    } catch {
      setPaymentActionError('An unexpected error occurred while launching payment.');
      setIsRetryingPayment(false);
    }
  };

  // Save Address (Create or Edit)
  const handleSaveAddress = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    const formData = new FormData(e.currentTarget);
    setIsSavingAddress(true);
    setAddressError(null);

    const rawPhone = String(formData.get('phone') || '').trim();
    const cleanPhone = rawPhone.replace(/[\s\-\(\)\+]/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '').trim();
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setAddressError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      setIsSavingAddress(false);
      return;
    }

    const payload = {
      name: String(formData.get('name') || '').trim(),
      phone: cleanPhone,
      addressLine1: String(formData.get('addressLine1') || '').trim(),
      addressLine2: String(formData.get('addressLine2') || '').trim(),
      city: String(formData.get('city') || '').trim(),
      state: String(formData.get('state') || '').trim(),
      pincode: String(formData.get('pincode') || '').trim(),
      landmark: String(formData.get('landmark') || '').trim(),
      isDefault: formData.get('isDefault') === 'on' || addresses.length === 0,
    };

    try {
      const isEditing = editingAddress && editingAddress._id;
      const url = isEditing
        ? `/api/customer/addresses/${editingAddress._id}`
        : '/api/customer/addresses';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.addresses || []);
        setEditingAddress(null);
        setNotice(isEditing ? 'Address updated successfully.' : 'New address added to your book.');
      } else {
        setAddressError(data.message || 'Failed to save address. Please check your fields.');
      }
    } catch {
      setAddressError('Network error. Could not save address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Delete Address
  const confirmDeleteAddress = async (addressId?: string | null) => {
    if (!addressId || !token) return;

    try {
      const res = await fetch(`/api/customer/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.addresses || []);
        setNotice('Address removed.');
      } else {
        setErrorNotice(data.message || 'Failed to remove address.');
      }
    } catch {
      setErrorNotice('Failed to delete address.');
    } finally {
      setAddressToDelete(null);
    }
  };

  // Set Default Address
  const handleSetDefault = async (addressId?: string) => {
    if (!addressId || !token) return;

    try {
      const res = await fetch(`/api/customer/addresses/${addressId}/default`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.addresses || []);
        setNotice('Default delivery address updated.');
      }
    } catch {
      setErrorNotice('Failed to update default address.');
    }
  };

  // Update Profile
  const handleUpdateProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    setIsUpdatingProfile(true);
    setNotice('');
    setErrorNotice('');

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const phone = String(formData.get('phone') || '').trim();

    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.profile) {
        updateProfile(data.profile);
        setNotice('Your profile information has been saved.');
      } else {
        setErrorNotice(data.message || 'Failed to update profile.');
      }
    } catch {
      setErrorNotice('Network error. Could not update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Step 1: Request Password Change OTP
  const handleRequestPasswordOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    setNotice('');
    setErrorNotice('');

    if (!currentPassword) {
      setErrorNotice('Current password is required.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorNotice('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorNotice('New passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorNotice('New password must be different from your current password.');
      return;
    }

    setIsRequestingOtp(true);
    try {
      const res = await fetch('/api/auth/password-change/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMaskedEmail(data.maskedEmail || customer.email);
        setCooldownSeconds(data.cooldownSeconds || 60);
        setPasswordStep(2);
        setNotice('A 6-digit verification code has been dispatched to your email.');
      } else {
        setErrorNotice(data.message || 'Failed to initiate password change.');
      }
    } catch {
      setErrorNotice('Network error. Could not dispatch verification code.');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Step 2: Verify OTP and Commit Password Change
  const handleVerifyPasswordOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    if (!otpCode || !/^\d{6}$/.test(otpCode.trim())) {
      setErrorNotice('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setIsVerifyingOtp(true);
    setNotice('');
    setErrorNotice('');

    try {
      const res = await fetch('/api/auth/password-change/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp: otpCode.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotice('Password updated successfully! Your account is now secured with your new password.');
        setPasswordStep(1);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpCode('');
      } else {
        setErrorNotice(data.message || 'Verification failed. Please check your code and try again.');
      }
    } catch {
      setErrorNotice('Network error. Could not verify code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!token || cooldownSeconds > 0 || isResendingOtp) return;

    setIsResendingOtp(true);
    setNotice('');
    setErrorNotice('');

    try {
      const res = await fetch('/api/auth/password-change/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCooldownSeconds(data.cooldownSeconds || 60);
        setNotice('A fresh verification code has been sent to your email.');
      } else {
        setErrorNotice(data.message || 'Failed to resend code.');
      }
    } catch {
      setErrorNotice('Network error while resending verification code.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleBackToStep1 = () => {
    setPasswordStep(1);
    setOtpCode('');
    setErrorNotice('');
  };

  if (sessionLoading || !customer) {
    return <DashboardSkeleton />;
  }

  const navItems = [
    { id: 'dashboard' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'orders' as const, label: `Order History (${orders.length})`, icon: Package },
    { id: 'addresses' as const, label: `Saved Addresses (${addresses.length})`, icon: MapPin },
    { id: 'details' as const, label: 'Profile Details', icon: UserRound },
  ];

  return (
    <>
      <SEOHead title="Customer Portal" noIndex={true} />
      <Navbar />
      <main className="customer-dashboard">
        <style>{`
          .customer-dashboard {
            min-height: calc(100dvh - 68px);
            padding: clamp(26px, 4vw, 58px) clamp(16px, 4vw, 48px) 76px;
            background: #F6EFE3;
          }

          .customer-shell {
            width: min(100%, 1200px);
            margin: auto;
            display: grid;
            grid-template-columns: 260px minmax(0, 1fr);
            gap: clamp(28px, 4vw, 52px);
          }

          .customer-sidebar {
            height: max-content;
            padding: 24px 18px;
            border: 1px solid rgba(200, 154, 61, 0.28);
            background: #FDFAF4;
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(85, 0, 10, 0.04);
          }

          .customer-sidebar__brand {
            padding: 4px 10px 18px;
            color: #55000A;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 18px;
            font-weight: 700;
            border-bottom: 1px solid rgba(200, 154, 61, 0.22);
          }

          .customer-sidebar__brand span {
            display: block;
            margin-top: 3px;
            color: #C99A32;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }

          .customer-nav {
            display: grid;
            gap: 6px;
            padding-top: 16px;
          }

          .customer-nav button {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 12px 14px;
            border: 0;
            border-radius: 8px;
            background: transparent;
            color: #75645C;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 13px;
            font-weight: 600;
            text-align: left;
            cursor: pointer;
            transition: all 0.18s;
          }

          .customer-nav button:hover {
            background: rgba(201, 154, 50, 0.12);
            color: #55000A;
          }

          .customer-nav button.is-active {
            background: #55000A;
            color: #FFF8EC;
          }

          .customer-logout {
            display: flex;
            align-items: center;
            gap: 10px;
            width: calc(100% - 20px);
            margin: 20px 10px 0;
            padding: 14px 0 2px;
            border: 0;
            border-top: 1px solid rgba(200, 154, 61, 0.22);
            background: transparent;
            color: #8C786E;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            cursor: pointer;
            transition: color 0.18s;
          }

          .customer-logout:hover {
            color: #DC2626;
          }

          .customer-content {
            min-width: 0;
          }

          .customer-eyebrow {
            color: #C99A32;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 10.5px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            margin-bottom: 6px;
          }

          .customer-header-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 8px;
          }

          .customer-quick-logout {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 8px;
            border: 1px solid rgba(200, 154, 61, 0.35);
            background: #FFFDF9;
            color: #8C786E;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.18s ease;
            white-space: nowrap;
            flex-shrink: 0;
            margin-top: 4px;
          }

          .customer-quick-logout:hover {
            color: #DC2626;
            border-color: #FECACA;
            background: #FEF2F2;
          }

          .customer-title {
            margin: 0;
            color: #55000A;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: clamp(26px, 3.8vw, 44px);
            font-weight: 700;
            letter-spacing: -0.025em;
            line-height: 1.1;
          }

          .customer-lede {
            max-width: 620px;
            color: #75645C;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 14px;
            line-height: 1.6;
            margin: 0 0 28px;
          }

          .customer-overview {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 32px;
          }

          .overview-card {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 20px 22px;
            border: 1px solid rgba(200, 154, 61, 0.28);
            border-radius: 14px;
            background: #FDFAF4;
            cursor: pointer;
            transition: all 0.18s;
          }

          .overview-card:hover {
            border-color: #C99A32;
            box-shadow: 0 10px 24px rgba(85, 0, 10, 0.06);
          }

          .overview-card__icon {
            width: 44px;
            height: 44px;
            display: grid;
            place-items: center;
            flex: none;
            border-radius: 50%;
            background: rgba(201, 154, 50, 0.14);
            color: #55000A;
          }

          .overview-card h3 {
            margin: 0;
            color: #55000A;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 16.5px;
            font-weight: 700;
            letter-spacing: -0.01em;
          }

          .overview-card p {
            margin: 4px 0 0;
            color: #75645C;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 12.5px;
            line-height: 1.4;
          }

          /* ── Address Book ──────────────────────────────────── */
          .address-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }

          .address-card {
            position: relative;
            padding: 22px;
            border: 1px solid rgba(200, 154, 61, 0.28);
            background: #FDFAF4;
            border-radius: 14px;
          }

          .address-card--default {
            border: 2px solid #C99A32;
            background: #FFFDF8;
          }

          .address-card__tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-bottom: 12px;
            background: rgba(201, 154, 50, 0.15);
            color: #881337;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.10em;
            text-transform: uppercase;
            padding: 3px 8px;
            border-radius: 999px;
          }

          .address-card h3 {
            margin: 0;
            color: #55000A;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 16.5px;
            font-weight: 700;
          }

          .address-card p {
            margin: 8px 0 0;
            color: #75645C;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 13px;
            line-height: 1.55;
          }

          .address-card__actions {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-top: 18px;
            border-top: 1px solid rgba(200, 154, 61, 0.18);
            padding-top: 14px;
          }

          .text-action {
            padding: 0;
            border: 0;
            background: transparent;
            color: #55000A;
            font: 700 11.5px Inter, sans-serif;
            text-decoration: underline;
            text-underline-offset: 3px;
            cursor: pointer;
          }

          .text-action--muted {
            color: #A39086;
          }

          .text-action--muted:hover {
            color: #DC2626;
          }

          /* ── Orders Table ──────────────────────────────────── */
          .orders-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .order-item-card {
            background: #FDFAF4;
            border: 1px solid rgba(200, 154, 61, 0.28);
            border-radius: 14px;
            padding: 20px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.18s;
          }

          .order-item-card:hover {
            border-color: #C99A32;
            box-shadow: 0 8px 20px rgba(85, 0, 10, 0.05);
          }

          .order-number {
            font-family: monospace;
            font-weight: 700;
            font-size: 14px;
            color: #55000A;
          }

          .order-date {
            font-size: 12px;
            color: #8C786E;
            margin-top: 2px;
          }

          .order-status-badge {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: 999px;
            display: inline-block;
          }

          .status-delivered { background: #D1FAE5; color: #065F46; }
          .status-shipped { background: #E0E7FF; color: #3730A3; }
          .status-processing { background: #FEF3C7; color: #92400E; }
          .status-pending { background: #F3F4F6; color: #374151; }
          .status-cancelled { background: #FEE2E2; color: #991B1B; }

          /* ── Modal Dialog ──────────────────────────────────── */
          .dialog-backdrop {
            position: fixed;
            z-index: 600;
            inset: 0;
            display: grid;
            place-items: center;
            padding: 18px;
            background: rgba(35, 3, 10, 0.65);
            backdrop-filter: blur(3px);
          }

          .address-dialog {
            width: min(100%, 580px);
            max-height: calc(100dvh - 40px);
            overflow-y: auto;
            padding: 32px;
            background: #FDFAF4;
            border-radius: 18px;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(200, 154, 61, 0.35);
          }

          .dialog-heading {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 22px;
          }

          .dialog-heading h2 {
            margin: 0;
            color: #55000A;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.015em;
          }

          .dialog-close {
            width: 32px;
            height: 32px;
            border: 1px solid rgba(200, 154, 61, 0.3);
            border-radius: 50%;
            background: transparent;
            color: #55000A;
            display: grid;
            place-items: center;
            cursor: pointer;
          }

          .profile-form {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }

          .profile-form--single {
            grid-template-columns: 1fr;
          }

          .profile-field {
            display: grid;
            gap: 6px;
          }

          .profile-field label {
            color: #34211D;
            font: 800 10.5px Inter, sans-serif;
            letter-spacing: 0.10em;
            text-transform: uppercase;
          }

          .profile-field input {
            width: 100%;
            height: 46px;
            padding: 0 14px;
            border: 1px solid rgba(200, 154, 61, 0.35);
            border-radius: 8px;
            background: #FFFFFF;
            color: #34211D;
            font: 500 14px Inter, sans-serif;
            outline: 0;
          }

          .profile-field input:focus {
            border-color: #C99A32;
            box-shadow: 0 0 0 3px rgba(201, 154, 50, 0.15);
          }

          .profile-field--wide {
            grid-column: 1 / -1;
          }

          .brand-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            height: 44px;
            padding: 0 24px;
            border: 0;
            border-radius: 999px;
            background: #55000A;
            color: #FFF8EC;
            font: 800 11px Inter, sans-serif;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            cursor: pointer;
            transition: background 0.18s, transform 0.18s;
          }

          .brand-button:hover {
            background: #6B000D;
            transform: translateY(-1px);
          }

          .notice-box {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 16px 0;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
          }

          .notice-box--success {
            background: #F0FDF4;
            border: 1px solid #BBF7D0;
            color: #166534;
          }

          .notice-box--error {
            background: #FEF2F2;
            border: 1px solid #FECACA;
            color: #991B1B;
          }

          .customer-section-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
            gap: 16px;
          }

          @media (max-width: 850px) {
            .customer-dashboard {
              padding: 18px 14px 60px;
            }
            .customer-shell {
              grid-template-columns: 1fr;
              gap: 20px;
            }
            .customer-sidebar {
              position: sticky;
              top: 70px;
              z-index: 20;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 8px 12px;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              scrollbar-width: none;
              gap: 8px;
            }
            .customer-sidebar::-webkit-scrollbar {
              display: none;
            }
            .customer-sidebar__brand {
              display: none;
            }
            .customer-nav {
              display: flex;
              align-items: center;
              gap: 6px;
              padding-top: 0;
            }
            .customer-nav button {
              white-space: nowrap;
              padding: 8px 12px;
              font-size: 12px;
            }
            .customer-logout {
              margin: 0 0 0 6px;
              padding: 0 0 0 10px;
              border-top: 0;
              border-left: 1px solid rgba(200, 154, 61, 0.22);
              width: auto;
              white-space: nowrap;
              flex-shrink: 0;
            }
          }

          @media (max-width: 580px) {
            .customer-section-header {
              flex-direction: column;
              align-items: stretch;
              gap: 14px;
            }
            .customer-section-header button {
              width: 100%;
            }
            .address-grid, .customer-overview {
              grid-template-columns: 1fr;
              gap: 12px;
            }
            .order-item-card {
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
              padding: 16px 18px;
            }
            .order-item-card > div:last-child {
              width: 100%;
              justify-content: space-between;
              border-top: 1px solid rgba(200, 154, 61, 0.15);
              padding-top: 8px;
            }
            .address-dialog {
              padding: 20px 16px;
              border-radius: 16px;
            }
            .profile-form {
              grid-template-columns: 1fr;
            }
            .profile-field--wide {
              grid-column: auto;
            }
            .customer-title {
              font-size: clamp(30px, 7vw, 40px);
            }
          }
        `}</style>

        <div className="customer-shell">
          {/* Sidebar Navigation */}
          <aside className="customer-sidebar" aria-label="Customer account navigation">
            <div className="customer-sidebar__brand">
              MALWA NAMKEEN
              <span>Customer Portal</span>
            </div>
            <nav className="customer-nav">
              {(customer?.role === 'admin' || customer?.role === 'super_admin') && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  style={{ color: '#C99A32', fontWeight: 800, background: 'rgba(201, 154, 50, 0.12)' }}
                >
                  <ShieldCheck size={16} /> Admin Portal
                </button>
              )}
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    className={section === item.id ? 'is-active' : ''}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <button
              className="customer-logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut size={15} /> {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </aside>

          {/* Main Content Area */}
          <section className="customer-content">
            {notice && (
              <div className="notice-box notice-box--success">
                <CheckCircle2 size={16} />
                <span>{notice}</span>
              </div>
            )}
            {errorNotice && (
              <div className="notice-box notice-box--error">
                <XCircle size={16} />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* Overview / Dashboard */}
            {section === 'dashboard' && (
              <>
                <div className="customer-header-row">
                  <div>
                    <p className="customer-eyebrow">Personal Concierge</p>
                    <h1 className="customer-title">Welcome back, {customer.name}</h1>
                  </div>
                  <button
                    type="button"
                    className="customer-quick-logout"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    title="Sign out of your account"
                  >
                    <LogOut size={14} /> {loggingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
                <p className="customer-lede">
                  Manage your Malwa savouries orders, saved delivery addresses, and personal profile from one central home.
                </p>

                <div className="customer-overview">
                  {customer?.role === 'admin' && (
                    <div
                      className="overview-card"
                      style={{
                        background: '#3C0815',
                        color: '#FFF8EC',
                        gridColumn: '1 / -1',
                        cursor: 'pointer',
                        border: '1px solid rgba(200, 154, 61, 0.45)',
                      }}
                      onClick={() => navigate('/admin/dashboard')}
                    >
                      <div className="overview-card__icon" style={{ background: '#F0C74E', color: '#3C0815' }}>
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h3 style={{ color: '#F0DFA0' }}>Store Administrator Panel</h3>
                        <p style={{ color: 'rgba(255, 248, 236, 0.75)' }}>
                          Manage products, inventory variants, categories, incoming orders, coupons, and store settings.
                        </p>
                      </div>
                      <ArrowRight size={18} style={{ marginLeft: 'auto', color: '#F0C74E' }} />
                    </div>
                  )}

                  <div className="overview-card" onClick={() => go('orders')}>
                    <div className="overview-card__icon"><Package size={20} /></div>
                    <div>
                      <h3>Orders ({orders.length})</h3>
                      <p>View your past delicacies and track delivery status.</p>
                    </div>
                    <ChevronRight size={18} style={{ marginLeft: 'auto', color: '#C99A32' }} />
                  </div>

                  <div className="overview-card" onClick={() => go('addresses')}>
                    <div className="overview-card__icon"><MapPin size={20} /></div>
                    <div>
                      <h3>Address Book ({addresses.length})</h3>
                      <p>Keep your home and gifting delivery addresses ready.</p>
                    </div>
                    <ChevronRight size={18} style={{ marginLeft: 'auto', color: '#C99A32' }} />
                  </div>

                  <div className="overview-card" onClick={() => go('details')}>
                    <div className="overview-card__icon"><UserRound size={20} /></div>
                    <div>
                      <h3>Account Profile</h3>
                      <p>Update your contact details and security credentials.</p>
                    </div>
                    <ChevronRight size={18} style={{ marginLeft: 'auto', color: '#C99A32' }} />
                  </div>
                </div>

                <div style={{ marginTop: '40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                    <h2 style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: '20px', fontWeight: 700, letterSpacing: '-0.015em', color: '#55000A', margin: 0 }}>
                      Recent Orders
                    </h2>
                    {orders.length > 0 && (
                      <button className="text-action" onClick={() => go('orders')}>
                        View all ({orders.length})
                      </button>
                    )}
                  </div>

                  {orders.length === 0 ? (
                    <div style={{ background: '#FDFAF4', border: '1px solid rgba(200,154,61,0.28)', borderRadius: '14px', padding: '36px', textAlign: 'center' }}>
                      <Package size={32} style={{ color: '#C99A32', marginBottom: '12px' }} />
                      <h3 style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", color: '#55000A', fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>
                        No orders yet
                      </h3>
                      <p style={{ color: '#75645C', fontSize: '13px', margin: '0 0 18px' }}>
                        Your authentic Malwa namkeens and sweets will appear here once you place your first order.
                      </p>
                      <button className="brand-button" onClick={() => navigate('/shop')}>
                        Explore Shop <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="orders-list">
                      {orders.slice(0, 3).map(order => (
                        <div key={order._id} className="order-item-card" onClick={() => setSelectedOrder(order)}>
                          <div>
                            <div className="order-number">#{order.orderNumber}</div>
                            <div className="order-date">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {order.items.length} items</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span className={`order-status-badge status-${order.orderStatus}`}>
                              {order.orderStatus}
                            </span>
                            <span style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: '15px', fontWeight: 700, color: '#55000A' }}>
                              ₹{order.total}
                            </span>
                            <ChevronRight size={16} style={{ color: '#C99A32' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Orders Section */}
            {section === 'orders' && (
              <>
                <p className="customer-eyebrow">Order History</p>
                <h1 className="customer-title">Your Delicacies</h1>
                <p className="customer-lede">
                  A complete record of your heritage orders with current delivery status and items breakdown.
                </p>

                {orders.length === 0 ? (
                  <div style={{ background: '#FDFAF4', border: '1px solid rgba(200,154,61,0.28)', borderRadius: '14px', padding: '48px 24px', textAlign: 'center' }}>
                    <Package size={36} style={{ color: '#C99A32', marginBottom: '14px' }} />
                    <h3 style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", color: '#55000A', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>
                      No order history found
                    </h3>
                    <p style={{ color: '#75645C', fontSize: '13px', margin: '0 0 20px' }}>
                      You haven't placed an order yet. Treat yourself to our signature Ratlami sev and mixtures.
                    </p>
                    <button className="brand-button" onClick={() => navigate('/shop')}>
                      Browse Shop Catalog <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map(order => (
                      <div key={order._id} className="order-item-card" onClick={() => setSelectedOrder(order)}>
                        <div>
                          <div className="order-number">#{order.orderNumber}</div>
                          <div className="order-date">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: '12px', color: '#55000A', marginTop: '4px' }}>
                            {order.items.map(i => `${i.productName} (${i.variantLabel}) × ${i.quantity}`).join(', ')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span className={`order-status-badge status-${order.orderStatus}`}>
                            {order.orderStatus}
                          </span>
                          <span style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: '16px', fontWeight: 700, color: '#55000A' }}>
                            ₹{order.total}
                          </span>
                          {order.orderStatus === 'pending' && (!order.shipmentStatus || order.shipmentStatus === 'unfulfilled') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancelModalOrder(order);
                                setCancelError(null);
                                setCancelReason('');
                              }}
                              style={{
                                background: '#FFF1F2',
                                color: '#BE123C',
                                border: '1px solid #FECDD3',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          )}
                          <ChevronRight size={16} style={{ color: '#C99A32' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Saved Addresses Section */}
            {section === 'addresses' && (
              <>
                <div className="customer-section-header">
                  <div>
                    <p className="customer-eyebrow">Delivery Details</p>
                    <h1 className="customer-title">Saved Address Book</h1>
                    <p className="customer-lede" style={{ marginBottom: 0 }}>
                      Save your residential, workplace, and gifting delivery locations for faster ordering.
                    </p>
                  </div>
                  <button
                    className="brand-button"
                    onClick={() => {
                      setEditingAddress(blankAddress);
                      setAddressError(null);
                    }}
                  >
                    <Plus size={15} /> Add New Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div style={{ background: '#FDFAF4', border: '1px solid rgba(200,154,61,0.28)', borderRadius: '14px', padding: '48px 24px', textAlign: 'center' }}>
                    <MapPin size={36} style={{ color: '#C99A32', marginBottom: '14px' }} />
                    <h3 style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", color: '#55000A', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>
                      No saved addresses
                    </h3>
                    <p style={{ color: '#75645C', fontSize: '13px', margin: '0 0 20px' }}>
                      Add your default shipping address to streamline future checkouts.
                    </p>
                    <button
                      className="brand-button"
                      onClick={() => {
                        setEditingAddress(blankAddress);
                        setAddressError(null);
                      }}
                    >
                      <Plus size={15} /> Add Address
                    </button>
                  </div>
                ) : (
                  <div className="address-grid">
                    {addresses.map(addr => (
                      <article
                        key={addr._id || addr.name}
                        className={`address-card ${addr.isDefault ? 'address-card--default' : ''}`}
                      >
                        {addr.isDefault && (
                          <span className="address-card__tag">
                            <Check size={11} /> Default Shipping Address
                          </span>
                        )}
                        <h3>{addr.name}</h3>
                        <p>
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                          <br />
                          {addr.city}, {addr.state} — {addr.pincode}
                          <br />
                          <strong>Phone:</strong> {addr.phone}
                          {addr.landmark ? <><br /><strong>Landmark:</strong> {addr.landmark}</> : null}
                        </p>
                        <div className="address-card__actions">
                          <button
                            className="text-action"
                            onClick={() => {
                              setEditingAddress(addr);
                              setAddressError(null);
                            }}
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          {!addr.isDefault && (
                            <button
                              className="text-action"
                              onClick={() => handleSetDefault(addr._id)}
                            >
                              Set as Default
                            </button>
                          )}
                          <button
                            className="text-action text-action--muted"
                            onClick={() => setAddressToDelete(addr._id || null)}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Profile Details & Password */}
            {section === 'details' && (
              <>
                <p className="customer-eyebrow">Personal Details</p>
                <h1 className="customer-title">Profile & Security</h1>
                <p className="customer-lede">
                  Keep your contact details and account security credentials up to date.
                </p>

                <div style={{ background: '#FDFAF4', border: '1px solid rgba(200,154,61,0.28)', borderRadius: '16px', padding: '28px', marginBottom: '28px' }}>
                  <h3 style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: '18px', fontWeight: 700, color: '#55000A', margin: '0 0 16px' }}>
                    Contact Information
                  </h3>
                  <form className="profile-form" onSubmit={handleUpdateProfile}>
                    <div className="profile-field">
                      <label>Full Name</label>
                      <input name="name" defaultValue={customer.name} required />
                    </div>
                    <div className="profile-field">
                      <label>Email Address (Account ID)</label>
                      <input name="email" defaultValue={customer.email} disabled style={{ background: '#F0EBE1', cursor: 'not-allowed' }} />
                    </div>
                    <div className="profile-field profile-field--wide">
                      <label>Primary Phone</label>
                      <input name="phone" defaultValue={customer.phone || ''} placeholder="+91 00000 00000" />
                    </div>
                    <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                      <button className="brand-button" type="submit" disabled={isUpdatingProfile}>
                        {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'} <ArrowRight size={14} />
                      </button>
                    </div>
                  </form>
                </div>

                <div style={{ background: '#FDFAF4', border: '1px solid rgba(200,154,61,0.28)', borderRadius: '16px', padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <h3 style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: '18px', fontWeight: 700, color: '#55000A', margin: 0 }}>
                      {customer.googleId && customer.hasPassword === false ? 'Account Security' : 'Change Password'}
                    </h3>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: customer.googleId && customer.hasPassword === false ? '#D1FAE5' : passwordStep === 1 ? 'rgba(200,154,61,0.15)' : '#D1FAE5', color: customer.googleId && customer.hasPassword === false ? '#065F46' : passwordStep === 1 ? '#8A6016' : '#065F46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {customer.googleId && customer.hasPassword === false ? 'Google Authenticated' : passwordStep === 1 ? 'Step 1 of 2: Details' : 'Step 2 of 2: Verification'}
                    </span>
                  </div>
                  {customer.googleId && customer.hasPassword === false ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginTop: '16px', background: '#FAF6EE', border: '1px solid rgba(200,154,61,0.25)', borderRadius: '12px', padding: '18px 20px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#FFFFFF', display: 'grid', placeItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexShrink: 0 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#55000A' }}>
                          Signed in with Google
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#75645C', lineHeight: 1.6 }}>
                          Your account is authenticated via your Google Account ({customer.email}). You do not require a separate local password. Password changes, two-factor authentication, and account recovery are managed directly in your Google security settings.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p style={{ color: '#75645C', fontSize: '13px', margin: '0 0 20px' }}>
                        {passwordStep === 1
                          ? 'Ensure your account is protected with a secure password containing at least 6 characters. A verification code will be sent to your registered email.'
                          : `A 6-digit security code was dispatched to ${maskedEmail || 'your email'}. Enter it below to confirm your password change.`}
                      </p>

                  {passwordStep === 1 ? (
                    <form className="profile-form" onSubmit={handleRequestPasswordOtp}>
                      <div className="profile-field profile-field--wide">
                        <label>Current Password</label>
                        <input
                          name="currentPassword"
                          type="password"
                          required
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="profile-field">
                        <label>New Password (min. 6 characters)</label>
                        <input
                          name="newPassword"
                          type="password"
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="profile-field">
                        <label>Confirm New Password</label>
                        <input
                          name="confirmPassword"
                          type="password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                        <button className="brand-button" type="submit" disabled={isRequestingOtp} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {isRequestingOtp ? 'Sending Code…' : 'Send Verification Code'} <Mail size={14} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyPasswordOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ background: '#FAF6EE', border: '1px solid rgba(200,154,61,0.3)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#55000A', fontWeight: 600, fontSize: '13.5px', marginBottom: '4px' }}>
                          <Mail size={16} color="#C89A3D" />
                          <span>Code dispatched to {maskedEmail}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#75645C' }}>
                          Please check your inbox (and spam folder). The code remains valid for 10 minutes.
                        </p>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#34211D', marginBottom: '6px' }}>
                          Enter 6-Digit Verification Code
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          required
                          autoFocus
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          style={{
                            fontFamily: 'monospace, Courier, sans-serif',
                            fontSize: '22px',
                            fontWeight: 700,
                            letterSpacing: '0.3em',
                            textAlign: 'center',
                            width: '100%',
                            maxWidth: '260px',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '1.5px solid rgba(200,154,61,0.4)',
                            background: '#FFFDF8',
                            color: '#3C0815',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                        <button
                          className="brand-button"
                          type="submit"
                          disabled={isVerifyingOtp || otpCode.length !== 6}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                          {isVerifyingOtp ? 'Verifying…' : 'Verify & Change Password'} <LockKeyhole size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={cooldownSeconds > 0 || isResendingOtp}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(200,154,61,0.3)',
                            background: '#FFFDF8',
                            color: cooldownSeconds > 0 ? '#9CA3AF' : '#55000A',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: cooldownSeconds > 0 || isResendingOtp ? 'not-allowed' : 'pointer',
                            opacity: cooldownSeconds > 0 ? 0.7 : 1,
                          }}
                        >
                          <RefreshCw size={13} className={isResendingOtp ? 'animate-spin' : ''} />
                          <span>{cooldownSeconds > 0 ? `Resend Code (${cooldownSeconds}s)` : isResendingOtp ? 'Sending…' : 'Resend Code'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleBackToStep1}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'transparent',
                            color: '#75645C',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <ArrowLeft size={13} />
                          <span>Change Details / Back</span>
                        </button>
                      </div>
                    </form>
                  )}
                    </>
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        {/* Address Add / Edit Modal */}
        {editingAddress && (
          <div
            className="dialog-backdrop"
            onMouseDown={e => {
              if (e.target === e.currentTarget) setEditingAddress(null);
            }}
          >
            <div className="address-dialog" role="dialog" aria-modal="true" aria-label="Address form">
              <div className="dialog-heading">
                <h2>{editingAddress._id ? 'Edit Address' : 'New Delivery Address'}</h2>
                <button
                  className="dialog-close"
                  onClick={() => setEditingAddress(null)}
                  aria-label="Close address modal"
                >
                  <X size={18} />
                </button>
              </div>

              {addressError && (
                <div className="notice-box notice-box--error" style={{ marginBottom: '18px' }}>
                  <XCircle size={16} />
                  <span>{addressError}</span>
                </div>
              )}

              <form className="profile-form" onSubmit={handleSaveAddress}>
                <div className="profile-field">
                  <label>Recipient Name</label>
                  <input name="name" defaultValue={editingAddress.name} required />
                </div>
                <div className="profile-field">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingAddress.phone}
                    required
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div className="profile-field profile-field--wide">
                  <label>Flat / House No. / Building / Street</label>
                  <input name="addressLine1" defaultValue={editingAddress.addressLine1} required />
                </div>
                <div className="profile-field profile-field--wide">
                  <label>Area / Sector / Colony (Optional)</label>
                  <input name="addressLine2" defaultValue={editingAddress.addressLine2} />
                </div>
                <div className="profile-field">
                  <label>City</label>
                  <input name="city" defaultValue={editingAddress.city} required />
                </div>
                <div className="profile-field">
                  <label>State</label>
                  <input name="state" defaultValue={editingAddress.state} required />
                </div>
                <div className="profile-field">
                  <label>6-Digit PIN Code</label>
                  <input name="pincode" defaultValue={editingAddress.pincode} required pattern="[0-9]{6}" />
                </div>
                <div className="profile-field">
                  <label>Landmark (Optional)</label>
                  <input name="landmark" defaultValue={editingAddress.landmark} />
                </div>
                <div className="profile-field profile-field--wide" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    defaultChecked={editingAddress.isDefault || addresses.length === 0}
                    style={{ width: '16px', height: '16px', accentColor: '#55000A' }}
                  />
                  <label htmlFor="isDefault" style={{ cursor: 'pointer', margin: 0, textTransform: 'none', fontSize: '13px' }}>
                    Set as my primary default delivery address
                  </label>
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                  <button className="brand-button" type="submit" disabled={isSavingAddress}>
                    {isSavingAddress ? 'Saving Address...' : 'Save Address'} <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Address Deletion Confirmation Modal */}
        {addressToDelete && (
          <div
            className="dialog-backdrop"
            style={{ zIndex: 10000 }}
            onMouseDown={e => {
              if (e.target === e.currentTarget) setAddressToDelete(null);
            }}
          >
            <div
              className="address-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Confirm address deletion"
              style={{ maxWidth: '420px', textAlign: 'center', padding: '28px 24px' }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Trash2 size={24} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#3C0815' }}>
                Remove Delivery Address?
              </h3>
              <p style={{ margin: '0 0 24px', fontSize: '13.5px', color: '#75645C', lineHeight: 1.5 }}>
                Are you sure you want to remove this address from your address book? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setAddressToDelete(null)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '999px',
                    border: '1px solid rgba(200, 154, 61, 0.4)',
                    background: '#FFFFFF',
                    color: '#55000A',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteAddress(addressToDelete)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '999px',
                    border: 'none',
                    background: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Delete Address
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div
            className="dialog-backdrop"
            onMouseDown={e => {
              if (e.target === e.currentTarget) setSelectedOrder(null);
            }}
          >
            <div className="address-dialog" role="dialog" aria-modal="true" aria-label="Order Details">
              <div className="dialog-heading">
                <div>
                  <h2 style={{ fontSize: '20px' }}>Order #{selectedOrder.orderNumber}</h2>
                  <div style={{ fontSize: '12px', color: '#8C786E', marginTop: '2px' }}>
                    Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button
                  className="dialog-close"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close order details modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <span className={`order-status-badge status-${selectedOrder.orderStatus}`}>
                  Order: {selectedOrder.orderStatus}
                </span>
                <span className={`order-status-badge status-${selectedOrder.paymentStatus === 'paid' ? 'delivered' : 'pending'}`}>
                  Payment: {selectedOrder.paymentStatus}
                </span>
                {selectedOrder.shipmentStatus && (
                  <span className={`order-status-badge status-${selectedOrder.shipmentStatus === 'delivered' ? 'delivered' : ['in_transit', 'out_for_delivery'].includes(selectedOrder.shipmentStatus) ? 'shipped' : 'pending'}`}>
                    Shipment: {selectedOrder.shipmentStatus.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {/* Items List */}
              <div style={{ borderTop: '1px solid rgba(200,154,61,0.25)', paddingTop: '16px', marginBottom: '18px' }}>
                <h4 style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C99A32', margin: '0 0 12px' }}>
                  Ordered Delicacies
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <div>
                        <strong>{item.productName}</strong> ({item.variantLabel}) × {item.quantity}
                        <div style={{ fontSize: '11px', color: '#8C786E' }}>₹{item.price} each</div>
                      </div>
                      <div style={{ fontFamily: "var(--font-primary, 'DM Sans', sans-serif)", fontWeight: 700, fontSize: '15px', color: '#55000A' }}>
                        ₹{item.itemTotal}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div style={{ borderTop: '1px solid rgba(200,154,61,0.25)', paddingTop: '14px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                    <span>Discount ({selectedOrder.discountCode || 'Promo'})</span>
                    <span>-₹{selectedOrder.discount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Shipping</span>
                  <span>{selectedOrder.shipping === 0 ? 'Complimentary' : `₹${selectedOrder.shipping}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(200,154,61,0.2)', paddingTop: '8px', fontWeight: 700, fontSize: '16px', color: '#55000A' }}>
                  <span>Total Amount</span>
                  <span>₹{selectedOrder.total}</span>
                </div>
              </div>

              {/* Delivery Address */}
              {selectedOrder.shippingAddress && (
                <div style={{ background: '#FAF6EF', padding: '14px', borderRadius: '10px', fontSize: '12.5px', color: '#55000A' }}>
                  <strong style={{ display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '10.5px', color: '#C99A32' }}>
                    Delivery Destination
                  </strong>
                  {selectedOrder.shippingAddress.name} ({selectedOrder.shippingAddress.phone})<br />
                  {selectedOrder.shippingAddress.addressLine1}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} — {selectedOrder.shippingAddress.pincode}
                </div>
              )}

              {/* Live Tracking Information Card */}
              {Boolean(selectedOrder.trackingInfo?.trackingNumber || selectedOrder.shiprocketDetails?.awbCode) && (() => {
                const trackingNumber = selectedOrder.trackingInfo?.trackingNumber || selectedOrder.shiprocketDetails?.awbCode;
                const courierName = selectedOrder.trackingInfo?.courierName || selectedOrder.shiprocketDetails?.courierName || 'Shiprocket Partner';
                const trackingUrl = selectedOrder.trackingInfo?.trackingUrl || selectedOrder.shiprocketDetails?.trackingUrl || (trackingNumber ? `https://shiprocket.co/tracking/${trackingNumber}` : undefined);
                return (
                  <div style={{ marginTop: '14px', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '14px', borderRadius: '10px', fontSize: '12.5px', color: '#166534' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '10.5px', color: '#15803D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={14} /> Shipment Tracking
                      </strong>
                      {trackingUrl && (
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 700, color: '#15803D', textDecoration: 'underline' }}
                        >
                          Track Online <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <div>
                      <strong>Courier:</strong> {courierName}<br />
                      <strong>AWB / Tracking #:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{trackingNumber}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Payment Action Error Notification */}
              {paymentActionError && (
                <div style={{ marginTop: '14px', padding: '10px 14px', background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '8px', color: '#BE123C', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{paymentActionError}</span>
                </div>
              )}

              {/* Order Actions: Pay Now (for pending online orders) & Cancel Order */}
              {selectedOrder.orderStatus === 'pending' && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(200,154,61,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedOrder.paymentStatus !== 'paid' && Boolean(selectedOrder.paymentMethod && ['online', 'upi', 'card'].includes(selectedOrder.paymentMethod)) && (
                    <button
                      type="button"
                      disabled={isRetryingPayment}
                      onClick={() => handleRetryPayment(selectedOrder)}
                      style={{
                        background: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: isRetryingPayment ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(5,150,105,0.2)',
                      }}
                    >
                      <CreditCard size={15} /> {isRetryingPayment ? 'Launching Gateway...' : `Complete Payment (₹${selectedOrder.total})`}
                    </button>
                  )}

                  {(!selectedOrder.shipmentStatus || selectedOrder.shipmentStatus === 'unfulfilled') && (
                    <button
                      type="button"
                      className="btn-cancel-order"
                      onClick={() => {
                        setCancelModalOrder(selectedOrder);
                        setCancelError(null);
                        setCancelReason('');
                      }}
                      style={{
                        background: '#FFF1F2',
                        color: '#BE123C',
                        border: '1px solid #FECDD3',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background 0.2s',
                        marginLeft: 'auto',
                      }}
                    >
                      <XCircle size={15} /> Cancel Order
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cancel Order Confirmation Dialog Modal */}
        {cancelModalOrder && (
          <div className="dialog-overlay" onClick={() => !isCancellingOrder && setCancelModalOrder(null)}>
            <div
              className="dialog-card"
              style={{ maxWidth: '440px' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="dialog-header">
                <div>
                  <h3 className="dialog-title" style={{ color: '#BE123C', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={20} /> Cancel Order
                  </h3>
                  <p className="dialog-sub">Order #{cancelModalOrder.orderNumber}</p>
                </div>
                {!isCancellingOrder && (
                  <button
                    className="dialog-close"
                    onClick={() => setCancelModalOrder(null)}
                    aria-label="Close cancellation modal"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div style={{ marginTop: '14px', fontSize: '13.5px', color: '#55000A', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 12px' }}>
                  Are you sure you want to cancel this order? All reserved delicacies will be returned to stock immediately, and this action cannot be undone.
                </p>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#75645C', marginBottom: '6px' }}>
                    Reason for cancellation (optional):
                  </label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    placeholder="e.g. Ordered by mistake, changing address..."
                    disabled={isCancellingOrder}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(200,154,61,0.3)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                {cancelError && (
                  <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', padding: '10px 12px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} />
                    <span>{cancelError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
                  <button
                    type="button"
                    onClick={() => setCancelModalOrder(null)}
                    disabled={isCancellingOrder}
                    style={{
                      background: 'transparent',
                      border: '1px solid #D6D3D1',
                      color: '#57534E',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isCancellingOrder ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Keep Order
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancelOrder(cancelModalOrder)}
                    disabled={isCancellingOrder}
                    style={{
                      background: '#BE123C',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isCancellingOrder ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {isCancellingOrder ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Cancelling…
                      </>
                    ) : (
                      'Yes, Cancel Order'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
