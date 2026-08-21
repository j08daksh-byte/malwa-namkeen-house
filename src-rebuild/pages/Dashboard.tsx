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
  ShieldCheck,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/sections/Footer';
import SEOHead from '../components/seo/SEOHead';
import { useCustomerSession } from '../components/layout/CustomerSessionContext';

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
  shipmentStatus: string;
  trackingInfo?: {
    courierName?: string;
    trackingNumber?: string;
    trackingUrl?: string;
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

  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [notice, setNotice] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string>('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
    const isModalOpen = Boolean(editingAddress || selectedOrder);
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
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
  }, [editingAddress, selectedOrder]);

  const go = (next: Section) => {
    setSection(next);
    setNotice('');
    setErrorNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save Address (Create or Edit)
  const handleSaveAddress = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    setIsSavingAddress(true);
    setAddressError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get('name') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
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
  const handleDeleteAddress = async (addressId?: string) => {
    if (!addressId || !token) return;
    if (!window.confirm('Are you sure you want to remove this address?')) return;

    try {
      const res = await fetch(`/api/customer/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.addresses || []);
        setNotice('Address removed.');
      }
    } catch {
      setErrorNotice('Failed to delete address.');
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

  // Change Password
  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    setIsChangingPassword(true);
    setNotice('');
    setErrorNotice('');

    const formData = new FormData(e.currentTarget);
    const currentPassword = String(formData.get('currentPassword') || '');
    const newPassword = String(formData.get('newPassword') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');

    if (newPassword !== confirmPassword) {
      setErrorNotice('New passwords do not match.');
      setIsChangingPassword(false);
      return;
    }

    try {
      const res = await fetch('/api/customer/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotice('Password updated successfully.');
        (e.target as HTMLFormElement).reset();
      } else {
        setErrorNotice(data.message || 'Failed to update password.');
      }
    } catch {
      setErrorNotice('Network error. Could not update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (sessionLoading || !customer) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F6EFE3' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', color: '#55000A', fontWeight: 600 }}>
          Opening your Malwa Account…
        </p>
      </div>
    );
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
            font: 700 20px 'Cormorant Garamond', Georgia, serif;
            border-bottom: 1px solid rgba(200, 154, 61, 0.22);
          }

          .customer-sidebar__brand span {
            display: block;
            margin-top: 3px;
            color: #C99A32;
            font: 800 9.5px Inter, sans-serif;
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
            font: 600 13px Inter, sans-serif;
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
            font: 700 11px Inter, sans-serif;
            letter-spacing: 0.09em;
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
            font: 800 10.5px Inter, sans-serif;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            margin-bottom: 6px;
          }

          .customer-title {
            margin: 0 0 10px;
            color: #55000A;
            font: 600 clamp(36px, 4.5vw, 54px)/1 'Cormorant Garamond', Georgia, serif;
            letter-spacing: -0.03em;
          }

          .customer-lede {
            max-width: 620px;
            color: #75645C;
            font-size: 14px;
            line-height: 1.6;
            margin: 0 0 28px;
          }

          .customer-overview {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            margin-top: 24px;
          }

          .overview-card {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 22px;
            border: 1px solid rgba(200, 154, 61, 0.28);
            background: #FDFAF4;
            border-radius: 14px;
            text-align: left;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          }

          .overview-card:hover {
            transform: translateY(-2px);
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
            font: 700 20px 'Cormorant Garamond', Georgia, serif;
          }

          .overview-card p {
            margin: 4px 0 0;
            color: #75645C;
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
            font: 800 9px Inter, sans-serif;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            padding: 3px 8px;
            border-radius: 999px;
          }

          .address-card h3 {
            margin: 0;
            color: #55000A;
            font: 700 20px 'Cormorant Garamond', Georgia, serif;
          }

          .address-card p {
            margin: 8px 0 0;
            color: #75645C;
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
            font: 700 28px 'Cormorant Garamond', Georgia, serif;
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

          @media (max-width: 850px) {
            .customer-shell {
              grid-template-columns: 1fr;
            }
            .customer-sidebar {
              position: sticky;
              top: 78px;
              z-index: 2;
              display: flex;
              align-items: center;
              padding: 10px;
              overflow-x: auto;
            }
            .customer-sidebar__brand {
              display: none;
            }
            .customer-nav {
              display: flex;
              padding-top: 0;
            }
            .customer-nav button {
              white-space: nowrap;
            }
          }

          @media (max-width: 580px) {
            .address-grid, .customer-overview {
              grid-template-columns: 1fr;
            }
            .profile-form {
              grid-template-columns: 1fr;
            }
            .profile-field--wide {
              grid-column: auto;
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
              onClick={() => {
                signOut();
                navigate('/');
              }}
            >
              <LogOut size={15} /> Sign out
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
                <p className="customer-eyebrow">Personal Concierge</p>
                <h1 className="customer-title">Welcome back, {customer.name}</h1>
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
                    <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '26px', color: '#55000A', margin: 0 }}>
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
                      <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#55000A', fontSize: '22px', margin: '0 0 6px' }}>
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
                            <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#55000A' }}>
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
                    <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#55000A', fontSize: '24px', margin: '0 0 6px' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <span className={`order-status-badge status-${order.orderStatus}`}>
                            {order.orderStatus}
                          </span>
                          <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '20px', fontWeight: 700, color: '#55000A' }}>
                            ₹{order.total}
                          </span>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
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
                    <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#55000A', fontSize: '24px', margin: '0 0 6px' }}>
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
                      <Plus size={15} /> Add First Address
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
                            onClick={() => handleDeleteAddress(addr._id)}
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
                  <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '24px', color: '#55000A', margin: '0 0 16px' }}>
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
                  <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '24px', color: '#55000A', margin: '0 0 6px' }}>
                    Change Password
                  </h3>
                  <p style={{ color: '#75645C', fontSize: '13px', margin: '0 0 20px' }}>
                    Ensure your account is protected with a secure password containing at least 6 characters.
                  </p>
                  <form className="profile-form" onSubmit={handleChangePassword}>
                    <div className="profile-field profile-field--wide">
                      <label>Current Password</label>
                      <input name="currentPassword" type="password" required placeholder="••••••••" />
                    </div>
                    <div className="profile-field">
                      <label>New Password</label>
                      <input name="newPassword" type="password" required minLength={6} placeholder="••••••••" />
                    </div>
                    <div className="profile-field">
                      <label>Confirm New Password</label>
                      <input name="confirmPassword" type="password" required minLength={6} placeholder="••••••••" />
                    </div>
                    <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                      <button className="brand-button" type="submit" disabled={isChangingPassword}>
                        {isChangingPassword ? 'Updating...' : 'Update Password'} <LockKeyhole size={14} />
                      </button>
                    </div>
                  </form>
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
                  <input name="phone" defaultValue={editingAddress.phone} required placeholder="+91 00000 00000" />
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
                  <h2 style={{ fontSize: '24px' }}>Order #{selectedOrder.orderNumber}</h2>
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

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <span className={`order-status-badge status-${selectedOrder.orderStatus}`}>
                  Order: {selectedOrder.orderStatus}
                </span>
                <span className={`order-status-badge status-${selectedOrder.paymentStatus === 'paid' ? 'delivered' : 'pending'}`}>
                  Payment: {selectedOrder.paymentStatus}
                </span>
              </div>

              {/* Items List */}
              <div style={{ borderTop: '1px solid rgba(200,154,61,0.25)', paddingTop: '16px', marginBottom: '18px' }}>
                <h4 style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C99A32', margin: '0 0 12px' }}>
                  Ordered Delicacies
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <div>
                        <strong>{item.productName}</strong> ({item.variantLabel}) × {item.quantity}
                        <div style={{ fontSize: '11px', color: '#8C786E' }}>₹{item.price} each</div>
                      </div>
                      <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 700, fontSize: '16px', color: '#55000A' }}>
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
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
