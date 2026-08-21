import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Shield,
  Search,
  RefreshCw,
  Mail,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  X,
  Lock,
} from 'lucide-react';
import { Card, PageHeader, Spinner } from '../../components/admin/ui.tsx';

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin';
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  invitedAt: string | null;
  invitationAcceptedAt: string | null;
  isPendingInvitation: boolean;
}

export default function AdminStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [superAdminCount, setSuperAdminCount] = useState(1);
  const [currentAdminId, setCurrentAdminId] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'super_admin'>('admin');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'super_admin'>('admin');
  const [editActive, setEditActive] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('malwa_admin_token');
      const res = await fetch('/api/admin/staff', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStaff(data.staff || []);
        setSuperAdminCount(data.superAdminCount || 1);
        setCurrentAdminId(data.currentAdminId || '');
      } else {
        showToast('error', data.message || 'Failed to load staff list.');
      }
    } catch {
      showToast('error', 'Network error loading staff.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Modal Escape & Scroll Locking
  useEffect(() => {
    const isModalOpen = showInviteModal || showEditModal || showDeleteModal;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowInviteModal(false);
          setShowEditModal(false);
          setShowDeleteModal(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showInviteModal, showEditModal, showDeleteModal]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('malwa_admin_token');
      const res = await fetch('/api/admin/staff/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          role: inviteRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', `Invitation successfully dispatched to ${inviteEmail}.`);
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteName('');
        setInviteRole('admin');
        fetchStaff();
      } else {
        showToast('error', data.message || 'Failed to send invitation.');
      }
    } catch {
      showToast('error', 'Network error while sending invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('malwa_admin_token');
      const res = await fetch(`/api/admin/staff/${selectedStaff._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: editName.trim(),
          role: editRole,
          active: editActive,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Staff member updated successfully.');
        setShowEditModal(false);
        fetchStaff();
      } else {
        showToast('error', data.message || 'Failed to update staff member.');
      }
    } catch {
      showToast('error', 'Network error updating staff member.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('malwa_admin_token');
      const res = await fetch(`/api/admin/staff/${selectedStaff._id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Administrator account removed.');
        setShowDeleteModal(false);
        setSelectedStaff(null);
        fetchStaff();
      } else {
        showToast('error', data.message || 'Failed to delete administrator account.');
      }
    } catch {
      showToast('error', 'Network error removing staff member.');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (member: StaffMember) => {
    setSelectedStaff(member);
    setEditName(member.name);
    setEditRole(member.role);
    setEditActive(member.active);
    setShowEditModal(true);
  };

  const openDeleteModal = (member: StaffMember) => {
    setSelectedStaff(member);
    setShowDeleteModal(true);
  };

  const filteredStaff = staff.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'all' || m.role === roleFilter;

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = m.active && !m.isPendingInvitation;
    if (statusFilter === 'pending') matchesStatus = m.isPendingInvitation;
    if (statusFilter === 'inactive') matchesStatus = !m.active;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title="Admin Staff & Access Control"
        subtitle="Manage administrator roles, invite team members, and oversee access privileges."
        action={
          <button
            onClick={() => setShowInviteModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#3C0815',
              color: '#FFF8EC',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '13.5px',
              cursor: 'pointer',
            }}
          >
            <UserPlus size={16} />
            <span>Invite Administrator</span>
          </button>
        }
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: toastMessage.type === 'success' ? '#065F46' : '#991B1B',
            color: '#FFF8EC',
            padding: '14px 20px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 600,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Quick Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            Total Administrators
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#1A0A0F' }}>
            {staff.length}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            Super Administrators
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#B45309' }}>
            {staff.filter(s => s.role === 'super_admin').length}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            Active Staff
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857' }}>
            {staff.filter(s => s.active && !s.isPendingInvitation).length}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            Pending Invitations
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#4338CA' }}>
            {staff.filter(s => s.isPendingInvitation).length}
          </div>
        </Card>
      </div>

      {/* Filter and Search Controls */}
      <Card style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
            <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search staff by name or email..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '13.5px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '13px',
                background: '#fff',
                color: '#374151',
                outline: 'none',
              }}
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admins</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '13px',
                background: '#fff',
                color: '#374151',
                outline: 'none',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending Invite</option>
              <option value="inactive">Deactivated</option>
            </select>

            <button
              onClick={fetchStaff}
              title="Refresh Staff List"
              style={{
                padding: '9px 14px',
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: '#374151',
              }}
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Staff Table */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Spinner />
            <p style={{ marginTop: '12px', color: '#6B7280', fontSize: '13.5px' }}>Loading staff roster...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Shield size={40} color="#D1D5DB" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#1A0A0F' }}>No staff members found</h3>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>
              Try adjusting your search criteria or invite a new administrator.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '12px 18px', color: '#4B5563', fontWeight: 600 }}>Administrator</th>
                  <th style={{ padding: '12px 18px', color: '#4B5563', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: '12px 18px', color: '#4B5563', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 18px', color: '#4B5563', fontWeight: 600 }}>Last Login</th>
                  <th style={{ padding: '12px 18px', color: '#4B5563', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(member => {
                  const isCurrent = member._id === currentAdminId;
                  const isLastSuperAdmin = member.role === 'super_admin' && superAdminCount <= 1;

                  return (
                    <tr key={member._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{member.name}</span>
                          {isCurrent && (
                            <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: '4px' }}>
                              You
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Mail size={12} />
                          <span>{member.email}</span>
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: member.role === 'super_admin' ? '#FEF3C7' : '#EFF6FF',
                            color: member.role === 'super_admin' ? '#92400E' : '#1E40AF',
                          }}
                        >
                          {member.role === 'super_admin' ? <ShieldCheck size={13} /> : <Shield size={13} />}
                          <span>{member.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        {member.isPendingInvitation ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F5F3FF', color: '#5B21B6', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 500 }}>
                            <Clock size={12} />
                            <span>Pending Invite</span>
                          </span>
                        ) : member.active ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ECFDF5', color: '#065F46', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 500 }}>
                            <CheckCircle2 size={12} />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEE2E2', color: '#991B1B', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 500 }}>
                            <XCircle size={12} />
                            <span>Deactivated</span>
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px', color: '#6B7280', fontSize: '12.5px' }}>
                        {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never logged in'}
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => openEditModal(member)}
                            title="Edit Administrator"
                            style={{
                              padding: '6px 10px',
                              background: '#F3F4F6',
                              border: '1px solid #E5E7EB',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#374151',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                            }}
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => openDeleteModal(member)}
                            disabled={isCurrent || isLastSuperAdmin}
                            title={isCurrent ? 'You cannot delete yourself' : isLastSuperAdmin ? 'Cannot delete the only Super Admin' : 'Delete Administrator'}
                            style={{
                              padding: '6px 10px',
                              background: isCurrent || isLastSuperAdmin ? '#F9FAFB' : '#FEF2F2',
                              border: '1px solid',
                              borderColor: isCurrent || isLastSuperAdmin ? '#E5E7EB' : '#FCA5A5',
                              borderRadius: '6px',
                              cursor: isCurrent || isLastSuperAdmin ? 'not-allowed' : 'pointer',
                              color: isCurrent || isLastSuperAdmin ? '#9CA3AF' : '#DC2626',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              opacity: isCurrent || isLastSuperAdmin ? 0.6 : 1,
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '460px', width: '100%', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1A0A0F' }}>Invite Administrator</h3>
              <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} color="#6B7280" />
              </button>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6B7280' }}>
              Generate a secure invitation link for a new staff member to activate their administrative account.
            </p>

            <form onSubmit={handleInvite}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Staff Member Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Staff Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="staff@malwanamkeen.com"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Access Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as any)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13.5px', background: '#fff', outline: 'none' }}
                >
                  <option value="admin">Administrator (Products, Orders, Discounts, Inquiries)</option>
                  <option value="super_admin">Super Administrator (Full Access + Staff Management)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  style={{ flex: 1, padding: '11px', background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ flex: 2, padding: '11px', background: '#3C0815', color: '#FFF8EC', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13.5px', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Send size={15} />
                  <span>{actionLoading ? 'Sending…' : 'Dispatch Invitation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedStaff && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '460px', width: '100%', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1A0A0F' }}>Edit Administrator Profile</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} color="#6B7280" />
              </button>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6B7280' }}>
              Modifying permissions for: <strong>{selectedStaff.email}</strong>
            </p>

            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Assigned Role</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as any)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13.5px', background: '#fff', outline: 'none' }}
                >
                  <option value="admin">Administrator</option>
                  <option value="super_admin">Super Administrator</option>
                </select>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={e => setEditActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#3C0815' }}
                  />
                  <span style={{ fontSize: '13.5px', color: '#374151', fontWeight: 600 }}>Account Active</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ flex: 1, padding: '11px', background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ flex: 2, padding: '11px', background: '#3C0815', color: '#FFF8EC', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13.5px', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}
                >
                  {actionLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedStaff && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#1A0A0F' }}>
              Remove Administrator Account?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#4B5563', lineHeight: 1.5 }}>
              Are you sure you want to permanently revoke administrative access for <strong>{selectedStaff.name}</strong> ({selectedStaff.email})? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ flex: 1, padding: '11px', background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                disabled={actionLoading}
                style={{ flex: 1, padding: '11px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13.5px', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}
              >
                {actionLoading ? 'Removing…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
