import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  X,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Package,
} from 'lucide-react';
import { Card, PageHeader, Spinner } from '../../components/admin/ui.tsx';

interface CustomerAddress {
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

interface CustomerOrderSummary {
  _id: string;
  orderNumber: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{
    productName: string;
    variantLabel: string;
    quantity: number;
    price: number;
  }>;
}

interface CustomerRecord {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  active: boolean;
  role: 'customer';
  addresses?: CustomerAddress[];
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
  orders?: CustomerOrderSummary[];
}

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalLifetimeSpent: number;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [stats, setStats] = useState<CustomerStats>({ totalCustomers: 0, activeCustomers: 0, totalLifetimeSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState('newest');

  // Detail Modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch Token Helper
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('malwa_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Fetch Customers List
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        sortBy,
      });

      const res = await fetch(`/api/admin/customers?${params.toString()}`, {
        headers: getAuthHeader(),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to fetch customers (${res.status})`);
      }

      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading customer profiles.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, search, statusFilter, sortBy]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Fetch Full Customer Details & Order History
  const openCustomerDetails = async (customer: CustomerRecord) => {
    setSelectedCustomer(customer);
    setLoadingDetails(true);
    setActionMsg(null);

    try {
      const res = await fetch(`/api/admin/customers/${customer._id}`, {
        headers: getAuthHeader(),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.customer) {
          setSelectedCustomer(data.customer);
        }
      }
    } catch {
      // Keep existing customer record in state
    } finally {
      setLoadingDetails(false);
    }
  };

  // Toggle Customer Active Status
  const handleToggleCustomerActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/customers/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to toggle status.');
      }

      setCustomers(prev =>
        prev.map(c => (c._id === id ? { ...c, active: !currentStatus } : c))
      );

      if (selectedCustomer && selectedCustomer._id === id) {
        setSelectedCustomer(prev => (prev ? { ...prev, active: !currentStatus } : null));
      }

      setActionMsg({ type: 'success', text: `Customer account is now ${!currentStatus ? 'Active' : 'Inactive'}.` });
    } catch (err: unknown) {
      setActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error updating account status.' });
    }
  };

  return (
    <div style={{ display: 'grid', gap: '22px' }}>
      {/* Top Header */}
      <PageHeader
        title="Customer Directory"
        subtitle="Manage registered patrons, lifetime purchase analytics, addresses & account access"
        action={
          <button
            onClick={fetchCustomers}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '9px 14px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Total Customers</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#3C0815', marginTop: '6px' }}>{stats.totalCustomers}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Registered customer accounts</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Active Accounts</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>{stats.activeCustomers}</div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>Authorized for ecommerce ordering</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Customer Lifetime Value</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#D4AA45', marginTop: '6px' }}>
            ₹{stats.totalLifetimeSpent.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Total revenue from customer orders</div>
        </Card>
      </div>

      {/* Filter & Table Card */}
      <Card>
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8F6F2', border: '1px solid #EAE3D2', padding: '8px 14px', borderRadius: '8px', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
            <Search size={16} color="#9CA3AF" />
            <input
              placeholder="Search customer name, email or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#1A0A0F' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', color: '#374151', outline: 'none' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', color: '#374151', outline: 'none' }}
            >
              <option value="newest">Newest Joined</option>
              <option value="name">Name (A–Z)</option>
              <option value="totalSpent">Highest Spending</option>
              <option value="orderCount">Most Orders</option>
            </select>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Customers Table */}
        {loading ? (
          <div style={{ padding: '60px 0', display: 'grid', placeItems: 'center' }}>
            <Spinner />
            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '12px' }}>Loading customers from MongoDB...</div>
          </div>
        ) : customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #E5E7EB', borderRadius: '12px', background: '#FAF9F6' }}>
            <Users size={40} color="#D4AA45" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#3C0815' }}>No Customers Found</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search query.'
                : 'Customer registrations will automatically appear here.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #EAE5D9', color: '#6B7280', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '12px 14px' }}>Customer</th>
                  <th style={{ padding: '12px 14px' }}>Contact</th>
                  <th style={{ padding: '12px 14px' }}>Orders</th>
                  <th style={{ padding: '12px 14px' }}>Total Spent</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Account Status</th>
                  <th style={{ padding: '12px 14px' }}>Joined Date</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(cust => {
                  const joinDate = new Date(cust.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={cust._id} style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' }}>
                      {/* Name & Avatar */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#3C0815', color: '#F0C74E', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
                            {cust.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1A0A0F', fontSize: '13.5px' }}>{cust.name}</div>
                            <span style={{ fontSize: '11px', color: '#881337', background: '#FFF1F2', padding: '1px 5px', borderRadius: '4px', display: 'inline-block', marginTop: '2px', fontWeight: 600 }}>
                              Customer
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ color: '#4B5563', fontSize: '12.5px' }}>{cust.email}</div>
                        {cust.phone ? (
                          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{cust.phone}</div>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>No phone</div>
                        )}
                      </td>

                      {/* Orders Count */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FAF6EF', color: '#3C0815', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '12px' }}>
                          <ShoppingBag size={12} color="#D4AA45" /> {cust.orderCount} Orders
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td style={{ padding: '14px', verticalAlign: 'top', fontWeight: 800, color: '#059669', fontSize: '13.5px' }}>
                        ₹{cust.totalSpent.toLocaleString('en-IN')}
                      </td>

                      {/* Active Status */}
                      <td style={{ padding: '14px', verticalAlign: 'top', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleCustomerActive(cust._id, cust.active)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: cust.active ? '#D1FAE5' : '#FEE2E2',
                            color: cust.active ? '#065F46' : '#991B1B',
                            border: 'none',
                            padding: '3px 9px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title="Click to toggle status"
                        >
                          {cust.active ? <Eye size={11} /> : <EyeOff size={11} />}
                          <span>{cust.active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: '14px', verticalAlign: 'top', color: '#6B7280', fontSize: '12.5px' }}>
                        {joinDate}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px', verticalAlign: 'top', textAlign: 'right' }}>
                        <button
                          onClick={() => openCustomerDetails(cust)}
                          style={{
                            background: '#F8F6F2',
                            border: '1px solid #EAE3D2',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            color: '#3C0815',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={13} />
                          <span>Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Customer Profile & Orders History Modal */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '820px', width: '100%', margin: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', background: '#3C0815', color: '#FFF9EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#F0C74E', color: '#3C0815', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '16px' }}>
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{selectedCustomer.name}</h2>
                  <div style={{ fontSize: '12px', color: 'rgba(255,248,236,0.7)', marginTop: '2px' }}>
                    Member since {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', maxHeight: 'calc(85vh - 100px)', overflowY: 'auto', display: 'grid', gap: '22px' }}>
              {actionMsg && (
                <div
                  style={{
                    background: actionMsg.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                    color: actionMsg.type === 'success' ? '#065F46' : '#991B1B',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{actionMsg.text}</span>
                </div>
              )}

              {/* Quick Analytics Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#F8F6F2', border: '1px solid #EAE3D2', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Lifetime Purchases</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                    ₹{selectedCustomer.totalSpent.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: '#F8F6F2', border: '1px solid #EAE3D2', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Orders Count</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#3C0815', marginTop: '4px' }}>
                    {selectedCustomer.orderCount}
                  </div>
                </div>
                <div style={{ background: '#F8F6F2', border: '1px solid #EAE3D2', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Account Status</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: selectedCustomer.active ? '#059669' : '#DC2626', marginTop: '6px' }}>
                    {selectedCustomer.active ? '● Active & Authorized' : '● Deactivated'}
                  </div>
                </div>
              </div>

              {/* Contact & Profile Details */}
              <div style={{ background: '#FFFFFF', border: '1px solid #EAE5D9', borderRadius: '10px', padding: '18px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', letterSpacing: '0.06em' }}>
                  Contact Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '13.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={15} color="#881337" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  {selectedCustomer.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={15} color="#881337" />
                      <span>{selectedCustomer.phone}</span>
                      <a
                        href={`https://wa.me/${selectedCustomer.phone.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#059669', fontSize: '11.5px', fontWeight: 700, textDecoration: 'none', marginLeft: '6px' }}
                      >
                        WhatsApp ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Saved Delivery Addresses */}
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', letterSpacing: '0.06em' }}>
                  Saved Addresses ({selectedCustomer.addresses?.length || 0})
                </h4>

                {!selectedCustomer.addresses || selectedCustomer.addresses.length === 0 ? (
                  <div style={{ padding: '16px', background: '#F9FAFB', borderRadius: '8px', border: '1px dashed #E5E7EB', fontSize: '12.5px', color: '#6B7280' }}>
                    No saved address book entries found for this customer profile yet.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    {selectedCustomer.addresses.map((addr, i) => (
                      <div key={i} style={{ background: '#FAF6EF', border: '1px solid #EAE3D2', borderRadius: '8px', padding: '12px', fontSize: '13px' }}>
                        <div style={{ fontWeight: 700, color: '#1A0A0F', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{addr.name}</span>
                          {addr.isDefault && (
                            <span style={{ fontSize: '10px', background: '#3C0815', color: '#F0C74E', padding: '1px 5px', borderRadius: '3px' }}>
                              Default
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#4B5563', marginTop: '4px', lineHeight: 1.4 }}>
                          {addr.addressLine1}
                          {addr.addressLine2 && `, ${addr.addressLine2}`}
                          <br />
                          {addr.city}, {addr.state} – {addr.pincode}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Phone: {addr.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order History */}
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', letterSpacing: '0.06em' }}>
                  Order History ({selectedCustomer.orders?.length || 0})
                </h4>

                {loadingDetails ? (
                  <div style={{ padding: '30px 0', display: 'grid', placeItems: 'center' }}>
                    <Spinner />
                  </div>
                ) : !selectedCustomer.orders || selectedCustomer.orders.length === 0 ? (
                  <div style={{ padding: '20px', background: '#F9FAFB', borderRadius: '8px', border: '1px dashed #E5E7EB', textAlign: 'center', fontSize: '13px', color: '#6B7280' }}>
                    No orders placed yet.
                  </div>
                ) : (
                  <div style={{ border: '1px solid #EAE5D9', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                      <thead>
                        <tr style={{ background: '#FAF6EF', borderBottom: '1px solid #EAE3D2', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '8px 12px' }}>Order #</th>
                          <th style={{ padding: '8px 12px' }}>Date</th>
                          <th style={{ padding: '8px 12px' }}>Items Summary</th>
                          <th style={{ padding: '8px 12px' }}>Status</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCustomer.orders.map(o => (
                          <tr key={o._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#3C0815' }}>
                              #{o.orderNumber}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#6B7280' }}>
                              {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#4B5563' }}>
                              {o.items?.map(it => `${it.quantity}x ${it.productName}`).join(', ') || 'Delicacy items'}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: '#1D4ED8', background: '#EBF4FF', padding: '2px 6px', borderRadius: '4px' }}>
                                {o.orderStatus}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                              ₹{o.total.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Account Controls Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid #E5E7EB' }}>
                <button
                  type="button"
                  onClick={() => handleToggleCustomerActive(selectedCustomer._id, selectedCustomer.active)}
                  style={{
                    background: selectedCustomer.active ? '#FFF1F2' : '#D1FAE5',
                    color: selectedCustomer.active ? '#991B1B' : '#065F46',
                    border: `1px solid ${selectedCustomer.active ? '#FEE2E2' : '#A7F3D0'}`,
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {selectedCustomer.active ? 'Deactivate Customer Account' : 'Reactivate Customer Account'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  style={{ background: '#3C0815', color: '#FFF9EF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
