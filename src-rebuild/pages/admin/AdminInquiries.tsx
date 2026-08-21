import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  X,
  Phone,
  Mail,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  User,
  Tag,
  MessageCircle,
} from 'lucide-react';
import { Card, PageHeader, Spinner } from '../../components/admin/ui.tsx';

export type InquiryStatus = 'new' | 'in_progress' | 'resolved' | 'closed' | 'spam';

interface InquiryRecord {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  category?: string;
  message: string;
  status: InquiryStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InquiryStats {
  totalInquiries: number;
  newInquiries: number;
  inProgressInquiries: number;
  resolvedInquiries: number;
}

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [stats, setStats] = useState<InquiryStats>({ totalInquiries: 0, newInquiries: 0, inProgressInquiries: 0, resolvedInquiries: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Detail Modal
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null);
  const [editStatus, setEditStatus] = useState<InquiryStatus>('new');
  const [editNotes, setEditNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch Token Helper
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('malwa_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Fetch Inquiries List
  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        category: categoryFilter,
      });

      const res = await fetch(`/api/admin/inquiries?${params.toString()}`, {
        headers: getAuthHeader(),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to fetch inquiries (${res.status})`);
      }

      const data = await res.json();
      if (data.success) {
        setInquiries(data.inquiries || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading inquiries.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, search, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Open Details Modal
  const openInquiryDetails = (inq: InquiryRecord) => {
    setSelectedInquiry(inq);
    setEditStatus(inq.status);
    setEditNotes(inq.notes || '');
    setStatusMsg(null);
  };

  // Save Status & Notes Update
  const handleSaveInquiryUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;

    setSavingStatus(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/admin/inquiries/${selectedInquiry._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes.trim(),
        }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update inquiry.');
      }

      setStatusMsg({ type: 'success', text: 'Inquiry status and notes saved successfully.' });
      setSelectedInquiry(data.inquiry);
      fetchInquiries();
    } catch (err: unknown) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error saving updates.' });
    } finally {
      setSavingStatus(false);
    }
  };

  // Delete Inquiry
  const handleDeleteInquiry = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
        credentials: 'include',
      });

      if (res.ok) {
        setInquiries(prev => prev.filter(i => i._id !== id));
        setDeleteConfirmId(null);
        if (selectedInquiry?._id === id) setSelectedInquiry(null);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete inquiry.');
    }
  };

  // Badge Color Styles
  const getStatusBadgeStyle = (st: InquiryStatus) => {
    switch (st) {
      case 'new':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'in_progress':
        return { bg: '#EBF4FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'resolved':
        return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
      case 'closed':
        return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
      case 'spam':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
      default:
        return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
    }
  };

  return (
    <div style={{ display: 'grid', gap: '22px' }}>
      {/* Top Header */}
      <PageHeader
        title="Customer Inquiries & Leads"
        subtitle="Manage bulk orders, catering enquiries, gifting requests and support tickets"
        action={
          <button
            onClick={fetchInquiries}
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
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Total Inquiries</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#3C0815', marginTop: '6px' }}>{stats.totalInquiries}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>All received communications</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>New Unread</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#D4AA45', marginTop: '6px' }}>{stats.newInquiries}</div>
          <div style={{ fontSize: '12px', color: '#D4AA45', marginTop: '4px' }}>Awaiting initial response</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>In Progress</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#1D4ED8', marginTop: '6px' }}>{stats.inProgressInquiries}</div>
          <div style={{ fontSize: '12px', color: '#1D4ED8', marginTop: '4px' }}>Active leads under discussion</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Resolved</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>{stats.resolvedInquiries}</div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>Successfully concluded</div>
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
              placeholder="Search name, email, phone or message..."
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
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', color: '#374151', outline: 'none' }}
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="spam">Spam</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', color: '#374151', outline: 'none' }}
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="catering">Catering</option>
              <option value="bulk-order">Bulk / Wholesale</option>
              <option value="event">Event</option>
              <option value="gifting">Festive Gifting</option>
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

        {/* Inquiries Table */}
        {loading ? (
          <div style={{ padding: '60px 0', display: 'grid', placeItems: 'center' }}>
            <Spinner />
            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '12px' }}>Loading inquiries from MongoDB...</div>
          </div>
        ) : inquiries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #E5E7EB', borderRadius: '12px', background: '#FAF9F6' }}>
            <MessageSquare size={40} color="#D4AA45" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#3C0815' }}>No Inquiries Found</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
              Customer contact form submissions and bulk inquiries will appear here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #EAE5D9', color: '#6B7280', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '12px 14px' }}>Sender & Type</th>
                  <th style={{ padding: '12px 14px' }}>Contact</th>
                  <th style={{ padding: '12px 14px' }}>Message Preview</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Received</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map(inq => {
                  const sStyle = getStatusBadgeStyle(inq.status);
                  const dateStr = new Date(inq.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={inq._id} style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' }}>
                      {/* Sender & Category */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, color: '#1A0A0F', fontSize: '13.5px' }}>{inq.name}</div>
                        <span style={{ display: 'inline-block', background: '#FAF6EF', color: '#881337', border: '1px solid #EAE3D2', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, marginTop: '3px', textTransform: 'capitalize' }}>
                          {inq.category || 'General'}
                        </span>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ color: '#4B5563', fontSize: '12.5px' }}>{inq.email}</div>
                        {inq.phone ? (
                          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{inq.phone}</div>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>No phone</div>
                        )}
                      </td>

                      {/* Message Preview */}
                      <td style={{ padding: '14px', verticalAlign: 'top', maxWidth: '300px' }}>
                        <div style={{ color: '#374151', fontSize: '12.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inq.message}
                        </div>
                        {inq.notes && (
                          <div style={{ fontSize: '11px', color: '#D4AA45', marginTop: '2px', fontWeight: 600 }}>
                            Note: {inq.notes}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <span
                          style={{
                            background: sStyle.bg,
                            color: sStyle.text,
                            border: `1px solid ${sStyle.border}`,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            display: 'inline-block',
                          }}
                        >
                          {inq.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px', verticalAlign: 'top', color: '#6B7280', fontSize: '12px' }}>
                        {dateStr}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => openInquiryDetails(inq)}
                            style={{
                              background: '#F8F6F2',
                              border: '1px solid #EAE3D2',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              color: '#3C0815',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Eye size={12} />
                            <span>Respond</span>
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(inq._id)}
                            style={{ background: '#FFF1F2', border: '1px solid #FEE2E2', borderRadius: '6px', padding: '5px 7px', color: '#DC2626', cursor: 'pointer' }}
                            title="Delete inquiry"
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
            <h3 style={{ margin: '0 0 10px', color: '#991B1B', fontSize: '17px', fontWeight: 700 }}>Delete Inquiry?</h3>
            <p style={{ margin: '0 0 20px', color: '#6B7280', fontSize: '13px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this customer inquiry record?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteInquiry(deleteConfirmId)}
                style={{ background: '#DC2626', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inquiry Detail & Status Update Modal */}
      {selectedInquiry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '680px', width: '100%', margin: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', background: '#3C0815', color: '#FFF9EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Inquiry from {selectedInquiry.name}</h2>
                  <span style={{ background: '#F0C74E', color: '#3C0815', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>
                    {selectedInquiry.category || 'General'}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255,248,236,0.7)', marginTop: '2px' }}>
                  Received on {new Date(selectedInquiry.createdAt).toLocaleString('en-IN')}
                </div>
              </div>

              <button
                onClick={() => setSelectedInquiry(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', display: 'grid', gap: '18px', maxHeight: '78vh', overflowY: 'auto' }}>
              {statusMsg && (
                <div
                  style={{
                    background: statusMsg.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                    color: statusMsg.type === 'success' ? '#065F46' : '#991B1B',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* Inquirer Contact Information */}
              <div style={{ background: '#F8F6F2', border: '1px solid #EAE3D2', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} color="#881337" />
                    <a href={`mailto:${selectedInquiry.email}`} style={{ color: '#881337', fontWeight: 600, textDecoration: 'none' }}>
                      {selectedInquiry.email}
                    </a>
                  </div>
                  {selectedInquiry.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} color="#881337" />
                      <span style={{ fontWeight: 600 }}>{selectedInquiry.phone}</span>
                      <a
                        href={`https://wa.me/${selectedInquiry.phone.replace(/[^\d]/g, '')}`}
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

              {/* Inquiry Message */}
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', letterSpacing: '0.06em' }}>
                  Inquiry Message
                </h4>
                <div style={{ background: '#FAF9F6', border: '1px solid #EAE5D9', borderRadius: '8px', padding: '14px', fontSize: '13.5px', lineHeight: 1.6, color: '#1A0A0F', whiteSpace: 'pre-wrap' }}>
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Workflow & Status Update Form */}
              <form onSubmit={handleSaveInquiryUpdate} style={{ background: '#F8F6F2', border: '1px solid #EAE3D2', borderRadius: '10px', padding: '16px', display: 'grid', gap: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#881337' }}>
                  Update Inquiry Workflow Status & Notes
                </div>

                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as InquiryStatus)}
                    style={inputStyle}
                  >
                    <option value="new">New (Awaiting Review)</option>
                    <option value="in_progress">In Progress (Discussion Underway)</option>
                    <option value="resolved">Resolved (Quote/Answer Provided)</option>
                    <option value="closed">Closed</option>
                    <option value="spam">Spam</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Admin Notes / Internal Follow-up</label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Enter quotes discussed, follow-up dates, or customer preferences..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                  <button
                    type="submit"
                    disabled={savingStatus}
                    style={{
                      background: '#3C0815',
                      color: '#FFF9EF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '9px 18px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: savingStatus ? 'wait' : 'pointer',
                    }}
                  >
                    {savingStatus ? 'Saving…' : 'Save Status & Notes'}
                  </button>
                </div>
              </form>
            </div>
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
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1.5px solid #E5E7EB',
  fontSize: '13.5px',
  color: '#111827',
  outline: 'none',
  background: '#FFFFFF',
  fontFamily: 'inherit',
};
