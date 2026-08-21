import { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  Search,
  RefreshCw,
  X,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Percent,
  IndianRupee,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Card, PageHeader, Spinner } from '../../components/admin/ui.tsx';

export type DiscountType = 'percentage' | 'fixed';

interface DiscountRecord {
  _id: string;
  code: string;
  type: DiscountType;
  value: number;
  minimumOrder: number;
  maximumDiscount?: number | null;
  active: boolean;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number;
  usedCount: number;
  createdAt: string;
}

interface DiscountStats {
  totalCoupons: number;
  activeCoupons: number;
  totalRedemptions: number;
}

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState<DiscountRecord[]>([]);
  const [stats, setStats] = useState<DiscountStats>({ totalCoupons: 0, activeCoupons: 0, totalRedemptions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed'>('all');

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<DiscountType>('percentage');
  const [formValue, setFormValue] = useState<number | ''>(15);
  const [formMinOrder, setFormMinOrder] = useState<number | ''>(499);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | ''>('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formUsageLimit, setFormUsageLimit] = useState<number | ''>('');
  const [formUsageLimitPerUser, setFormUsageLimitPerUser] = useState<number | ''>(1);
  const [formActive, setFormActive] = useState(true);

  // Live Coupon Tester Widget State
  const [testSubtotal, setTestSubtotal] = useState<number>(1000);
  const [testResult, setTestResult] = useState<{ discount: number; finalTotal: number } | null>(null);

  // Fetch Token Helper
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('malwa_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Fetch Discounts
  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        type: typeFilter,
      });

      const res = await fetch(`/api/admin/discounts?${params.toString()}`, {
        headers: getAuthHeader(),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to fetch discounts (${res.status})`);
      }

      const data = await res.json();
      if (data.success) {
        setDiscounts(data.discounts || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading discounts.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingDiscount(null);
    setFormCode('');
    setFormType('percentage');
    setFormValue(15);
    setFormMinOrder(499);
    setFormMaxDiscount(200);
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormEndDate('');
    setFormUsageLimit('');
    setFormUsageLimitPerUser(1);
    setFormActive(true);
    setFormError(null);
    setTestResult(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (d: DiscountRecord) => {
    setEditingDiscount(d);
    setFormCode(d.code);
    setFormType(d.type);
    setFormValue(d.value);
    setFormMinOrder(d.minimumOrder);
    setFormMaxDiscount(d.maximumDiscount ?? '');
    setFormStartDate(d.startDate ? new Date(d.startDate).toISOString().slice(0, 10) : '');
    setFormEndDate(d.endDate ? new Date(d.endDate).toISOString().slice(0, 10) : '');
    setFormUsageLimit(d.usageLimit ?? '');
    setFormUsageLimitPerUser(d.usageLimitPerUser ?? 1);
    setFormActive(d.active);
    setFormError(null);
    setTestResult(null);
    setModalOpen(true);
  };

  // Calculate live test discount
  const calculateTestDiscount = () => {
    const val = Number(formValue) || 0;
    const minOrd = Number(formMinOrder) || 0;
    const maxCap = Number(formMaxDiscount) || 0;

    if (testSubtotal < minOrd) {
      setTestResult({ discount: 0, finalTotal: testSubtotal });
      return;
    }

    let disc = 0;
    if (formType === 'percentage') {
      disc = (testSubtotal * val) / 100;
      if (maxCap > 0) disc = Math.min(disc, maxCap);
    } else {
      disc = Math.min(testSubtotal, val);
    }

    disc = Math.round(disc * 100) / 100;
    setTestResult({ discount: disc, finalTotal: Math.max(0, testSubtotal - disc) });
  };

  // Toggle Active Status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/discounts/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        credentials: 'include',
      });
      if (res.ok) {
        setDiscounts(prev =>
          prev.map(d => (d._id === id ? { ...d, active: !currentStatus } : d))
        );
      }
    } catch {
      // Ignore
    }
  };

  // Delete Discount
  const handleDeleteDiscount = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
        credentials: 'include',
      });
      if (res.ok) {
        setDiscounts(prev => prev.filter(d => d._id !== id));
        setDeleteConfirmId(null);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete coupon.');
    }
  };

  // Form Submit (Create / Edit)
  const handleSubmitDiscountForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = formCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      setFormError('Coupon Code is required.');
      return;
    }

    const numericVal = Number(formValue);
    if (isNaN(numericVal) || numericVal <= 0) {
      setFormError('Discount Value must be greater than 0.');
      return;
    }

    if (formType === 'percentage' && numericVal > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    setFormSubmitting(true);

    const payload = {
      code: cleanCode,
      type: formType,
      value: numericVal,
      minimumOrder: formMinOrder !== '' ? Number(formMinOrder) : 0,
      maximumDiscount: formType === 'percentage' && formMaxDiscount !== '' ? Number(formMaxDiscount) : null,
      startDate: formStartDate ? new Date(formStartDate).toISOString() : null,
      endDate: formEndDate ? new Date(formEndDate).toISOString() : null,
      usageLimit: formUsageLimit !== '' ? Number(formUsageLimit) : null,
      usageLimitPerUser: formUsageLimitPerUser !== '' ? Number(formUsageLimitPerUser) : 1,
      active: formActive,
    };

    try {
      const url = editingDiscount
        ? `/api/admin/discounts/${editingDiscount._id}`
        : '/api/admin/discounts';
      const method = editingDiscount ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save coupon.');
      }

      setModalOpen(false);
      fetchDiscounts();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving coupon.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '22px' }}>
      {/* Page Header */}
      <PageHeader
        title="Promotions & Coupons"
        subtitle="Manage coupon codes, minimum order criteria, percentage caps & redemption limits"
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={fetchDiscounts}
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

            <button
              onClick={openCreateModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#3C0815',
                color: '#FFF9EF',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(60,8,21,0.25)',
              }}
            >
              <Plus size={16} /> Create Coupon
            </button>
          </div>
        }
      />

      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Total Coupons</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#3C0815', marginTop: '6px' }}>{stats.totalCoupons}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Campaign codes configured</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Active Coupons</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>{stats.activeCoupons}</div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>Ready for checkout redemption</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Total Redemptions</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#D4AA45', marginTop: '6px' }}>
            {stats.totalRedemptions}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Times coupons were used by patrons</div>
        </Card>
      </div>

      {/* Main Filter & Table Card */}
      <Card>
        {/* Filters Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8F6F2', border: '1px solid #EAE3D2', padding: '8px 14px', borderRadius: '8px', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
            <Search size={16} color="#9CA3AF" />
            <input
              placeholder="Search coupon code..."
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
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', color: '#374151', outline: 'none' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active & Valid</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', color: '#374151', outline: 'none' }}
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
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

        {/* Coupons Table */}
        {loading ? (
          <div style={{ padding: '60px 0', display: 'grid', placeItems: 'center' }}>
            <Spinner />
            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '12px' }}>Loading discounts from MongoDB...</div>
          </div>
        ) : discounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #E5E7EB', borderRadius: '12px', background: '#FAF9F6' }}>
            <Tag size={40} color="#D4AA45" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#3C0815' }}>No Coupons Found</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
              Create your first promotional discount coupon for Malwa Namkeen patrons.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #EAE5D9', color: '#6B7280', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '12px 14px' }}>Coupon Code</th>
                  <th style={{ padding: '12px 14px' }}>Benefit</th>
                  <th style={{ padding: '12px 14px' }}>Conditions</th>
                  <th style={{ padding: '12px 14px' }}>Validity</th>
                  <th style={{ padding: '12px 14px' }}>Redemptions</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map(d => {
                  const isExpired = d.endDate && new Date(d.endDate) < new Date();

                  return (
                    <tr key={d._id} style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' }}>
                      {/* Code */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FAF6EF', border: '1px dashed #D4AA45', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, color: '#3C0815', letterSpacing: '0.05em', fontFamily: 'monospace', fontSize: '13px' }}>
                          <Tag size={13} color="#D4AA45" />
                          <span>{d.code}</span>
                        </div>
                      </td>

                      {/* Benefit */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: '#059669', fontSize: '14px' }}>
                          {d.type === 'percentage' ? `${d.value}% OFF` : `₹${d.value} OFF`}
                        </div>
                        {d.maximumDiscount && d.type === 'percentage' && (
                          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '1px' }}>
                            Up to ₹{d.maximumDiscount}
                          </div>
                        )}
                      </td>

                      {/* Conditions */}
                      <td style={{ padding: '14px', verticalAlign: 'top', color: '#4B5563', fontSize: '12px' }}>
                        <div>Min. Order: <strong>₹{d.minimumOrder}</strong></div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                          {d.usageLimitPerUser ? `${d.usageLimitPerUser} use per user` : 'Multiple uses'}
                        </div>
                      </td>

                      {/* Validity */}
                      <td style={{ padding: '14px', verticalAlign: 'top', fontSize: '12px' }}>
                        {d.startDate && d.endDate ? (
                          <div>
                            <div>{new Date(d.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(d.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            {isExpired && (
                              <span style={{ fontSize: '10.5px', color: '#DC2626', fontWeight: 700 }}>
                                Expired
                              </span>
                            )}
                          </div>
                        ) : d.endDate ? (
                          <div>Until {new Date(d.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        ) : (
                          <span style={{ color: '#059669', fontWeight: 600 }}>No Expiry (Ongoing)</span>
                        )}
                      </td>

                      {/* Redemptions */}
                      <td style={{ padding: '14px', verticalAlign: 'top', fontSize: '12px' }}>
                        <span style={{ fontWeight: 700, color: '#3C0815' }}>{d.usedCount}</span>
                        <span style={{ color: '#9CA3AF' }}> / {d.usageLimit ? d.usageLimit : '∞'} used</span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px', verticalAlign: 'top', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleActive(d._id, d.active)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: d.active && !isExpired ? '#D1FAE5' : '#FEE2E2',
                            color: d.active && !isExpired ? '#065F46' : '#991B1B',
                            border: 'none',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title="Click to toggle active state"
                        >
                          {d.active && !isExpired ? <Eye size={11} /> : <EyeOff size={11} />}
                          <span>{d.active && !isExpired ? 'Active' : isExpired ? 'Expired' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => openEditModal(d)}
                            style={{ background: '#F8F6F2', border: '1px solid #EAE3D2', borderRadius: '6px', padding: '5px 8px', color: '#3C0815', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                            title="Edit coupon"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(d._id)}
                            style={{ background: '#FFF1F2', border: '1px solid #FEE2E2', borderRadius: '6px', padding: '5px 7px', color: '#DC2626', cursor: 'pointer' }}
                            title="Delete coupon"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'grid', placeItems: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px', color: '#991B1B', fontSize: '17px', fontWeight: 700 }}>Delete Coupon?</h3>
            <p style={{ margin: '0 0 20px', color: '#6B7280', fontSize: '13px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this discount coupon? Patrons will no longer be able to apply it.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDiscount(deleteConfirmId)}
                style={{ background: '#DC2626', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
              >
                Delete Coupon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '640px', width: '100%', margin: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', background: '#3C0815', color: '#FFF9EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                  {editingDiscount ? 'Edit Promotional Coupon' : 'Create Promotional Coupon'}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: 'rgba(255,248,236,0.7)' }}>
                  Configure discount percentages, caps, minimum spend and expiration dates
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitDiscountForm} style={{ padding: '22px', display: 'grid', gap: '16px', maxHeight: '78vh', overflowY: 'auto' }}>
              {formError && (
                <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Row 1: Code & Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Coupon Code *</label>
                  <input
                    required
                    value={formCode}
                    onChange={e => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MALWA15, FESTIVE50"
                    style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Discount Type *</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as DiscountType)}
                    style={inputStyle}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Value, Min Order & Max Discount */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>
                    {formType === 'percentage' ? 'Percentage Value (%) *' : 'Fixed Discount (₹) *'}
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={formType === 'percentage' ? 100 : undefined}
                    value={formValue}
                    onChange={e => setFormValue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={formType === 'percentage' ? '15' : '100'}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Minimum Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formMinOrder}
                    onChange={e => setFormMinOrder(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="499"
                    style={inputStyle}
                  />
                </div>

                {formType === 'percentage' && (
                  <div>
                    <label style={labelStyle}>Max Discount Cap (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formMaxDiscount}
                      onChange={e => setFormMaxDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 200 (Optional)"
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>

              {/* Row 3: Validity Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Expiration Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Row 4: Usage Limits */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Total Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formUsageLimit}
                    onChange={e => setFormUsageLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Leave empty for unlimited"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Usage Limit Per User</label>
                  <input
                    type="number"
                    min="1"
                    value={formUsageLimitPerUser}
                    onChange={e => setFormUsageLimitPerUser(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="1"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={e => setFormActive(e.target.checked)}
                    style={{ accentColor: '#3C0815', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontWeight: 600, color: '#374151' }}>Active & Ready for Checkout</span>
                </label>
              </div>

              {/* Live Coupon Calculator Widget */}
              <div style={{ background: '#FAF6EF', border: '1px solid #EAE3D2', borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#881337' }}>
                    <Sparkles size={14} color="#D4AA45" /> Live Discount Simulator
                  </div>
                  <button
                    type="button"
                    onClick={calculateTestDiscount}
                    style={{ background: '#3C0815', color: '#FFF9EF', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Test Apply
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
                  <span>For Cart Subtotal: ₹</span>
                  <input
                    type="number"
                    value={testSubtotal}
                    onChange={e => setTestSubtotal(Number(e.target.value))}
                    style={{ width: '100px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #D4AA45', outline: 'none', fontWeight: 700 }}
                  />
                  {testResult && (
                    <div style={{ marginLeft: 'auto', fontWeight: 800, color: testResult.discount > 0 ? '#059669' : '#DC2626' }}>
                      {testResult.discount > 0
                        ? `→ Discount: -₹${testResult.discount} (Final: ₹${testResult.finalTotal})`
                        : '→ Min Order Not Met (₹0 Discount)'}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #E5E7EB' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={formSubmitting}
                  style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{
                    background: '#3C0815',
                    color: '#FFF9EF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: formSubmitting ? 'wait' : 'pointer',
                    boxShadow: '0 2px 6px rgba(60,8,21,0.25)',
                  }}
                >
                  {formSubmitting ? 'Saving…' : editingDiscount ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  color: '#374151',
  marginBottom: '5px',
  letterSpacing: '0.02em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1.5px solid #E5E7EB',
  fontSize: '13.5px',
  color: '#111827',
  outline: 'none',
  background: '#FFFFFF',
  fontFamily: 'inherit',
};
