import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/adminApi.ts';
import type { DashboardData } from '../../lib/adminApi.ts';
import { StatCard, Card, PageHeader, Spinner, StatusBadge, fmtDateTime, Select } from '../../components/admin/ui.tsx';

const CATEGORY_LABELS: Record<string, string> = {
  general_enquiry:          'General Enquiries',
  catering:                 'Catering',
  bulk_orders:              'Bulk Orders',
  corporate_gifting:        'Corporate Gifting',
  birthday_parties_events:  'Birthday Parties & Events',
};

export default function AdminDashboard() {
  const [range, setRange] = useState('30d');
  const [data,  setData]  = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null); setError('');
    adminApi.dashboard(range)
      .then(r => setData(r))
      .catch(e => setError(e.message));
  }, [range]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of enquiries and reservations."
        action={
          <Select value={range} onChange={e => setRange(e.target.value)} style={{ width: '160px' }}>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </Select>
        }
      />

      {error && <div style={{ color: '#991B1B', marginBottom: '16px' }}>{error}</div>}

      {!data ? <Spinner /> : (
        <>
          {/* ── Reservation stats ── */}
          <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', margin: '0 0 12px' }}>Reservations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            <StatCard label="Total"     value={data.reservations.total}     />
            <StatCard label="New"       value={data.reservations.new}       accent="#1D4ED8" />
            <StatCard label="Confirmed" value={data.reservations.confirmed} accent="#065F46" />
            <StatCard label="Declined"  value={data.reservations.declined}  accent="#991B1B" />
          </div>

          {/* ── Enquiry stats ── */}
          <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', margin: '0 0 12px' }}>Enquiries</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            <StatCard label="Total"       value={data.contacts.total}       />
            <StatCard label="New"         value={data.contacts.new}         accent="#1D4ED8" />
            <StatCard label="In Progress" value={data.contacts.in_progress} accent="#92400E" />
            <StatCard label="Resolved"    value={data.contacts.resolved}    accent="#065F46" />
          </div>

          {/* ── By category ── */}
          {Object.keys(data.contacts.byCategory).length > 0 && (
            <Card style={{ marginBottom: '28px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: '#1A0A0F' }}>Enquiries by Category</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(data.contacts.byCategory).map(([cat, count]) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, fontSize: '13px', color: '#374151' }}>{CATEGORY_LABELS[cat] ?? cat}</div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1A0A0F', minWidth: '28px', textAlign: 'right' }}>{count}</div>
                    <div style={{ width: '140px', height: '8px', background: '#F3F4F6', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((count / (data.contacts.total || 1)) * 100)}%`, background: '#C89A3D', borderRadius: '999px', transition: 'width 0.4s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── Recent ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 480px), 1fr))', gap: '20px' }}>
            <Card>
              <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700 }}>Recent Reservations</h3>
              {data.recent.reservations.length === 0 ? <p style={{ color: '#9CA3AF', fontSize: '13px' }}>None in this period.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.recent.reservations.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', padding: '10px', background: '#FAFAFA', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.customer_name ?? r.name}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{r.reservation_date} · {r.preferred_time} · {r.guest_count} guests</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{fmtDateTime(r.created_at)}</div>
                      </div>
                      <StatusBadge status={r.status} type="reservation" />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700 }}>Recent Enquiries</h3>
              {data.recent.contacts.length === 0 ? <p style={{ color: '#9CA3AF', fontSize: '13px' }}>None in this period.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.recent.contacts.map(e => (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', padding: '10px', background: '#FAFAFA', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{e.customer_name ?? e.name}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{CATEGORY_LABELS[e.category] ?? e.category}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.message}</div>
                      </div>
                      <StatusBadge status={e.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
