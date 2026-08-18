import { useState, useEffect, useCallback } from 'react';
import { adminApi, type ReservationRow } from '../../lib/adminApi.ts';
import {
  PageHeader, Table, Th, Td, StatusBadge, Btn, Modal, Select, Input, Textarea,
  Pagination, Empty, Spinner, Alert, fmtDate, fmtDateTime, waLink, Card,
} from '../../components/admin/ui.tsx';

const STATUSES = ['new', 'contacted', 'confirmed', 'declined', 'cancelled', 'completed', 'no_show'];
const OCCASION_LABELS: Record<string, string> = {
  birthday: 'Birthday', anniversary: 'Anniversary', date_night: 'Date Night',
  family_gathering: 'Family Gathering', business_lunch: 'Business', other: 'Other',
};

export default function AdminReservations() {
  const [rows,    setRows]    = useState<ReservationRow[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);

  const [search,     setSearch]     = useState('');
  const [statusF,    setStatusF]    = useState('');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');

  const [selected,   setSelected]   = useState<ReservationRow | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes,  setEditNotes]  = useState('');
  const [saving,     setSaving]     = useState(false);
  const [alert,      setAlert]      = useState<{ type: 'success'|'error'; msg: string } | null>(null);

  const load = useCallback((p: number) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(p) };
    if (search)   params.search   = search;
    if (statusF)  params.status   = statusF;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo)   params.dateTo   = dateTo;
    adminApi.reservations(params)
      .then(r => {
        setRows(r.data);
        setTotal(r.pagination.total);
        setPages(r.pagination.pages);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, statusF, dateFrom, dateTo]);

  useEffect(() => { setPage(1); load(1); }, [search, statusF, dateFrom, dateTo]);
  useEffect(() => { load(page); }, [page, load]);

  function openDetail(r: ReservationRow) {
    setSelected(r);
    setEditStatus(r.status);
    setEditNotes(r.admin_notes ?? '');
    setAlert(null);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await adminApi.updateReservation(selected.id, { status: editStatus, admin_notes: editNotes });
      setAlert({
        type: 'success',
        msg: res.emailSent === false
          ? 'Status updated. Confirmation email could not be sent.'
          : 'Reservation updated.',
      });
      setRows(r => r.map(x => x.id === selected.id ? { ...x, status: editStatus, admin_notes: editNotes } : x));
      setSelected(prev => prev ? { ...prev, status: editStatus, admin_notes: editNotes } : prev);
    } catch (e: unknown) {
      setAlert({ type: 'error', msg: e instanceof Error ? e.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Reservations" subtitle={`${total} total`} />

      {/* Filters */}
      <Card style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={lblStyle}>Search</label>
            <Input placeholder="Name, email, phone…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ flex: '0 1 160px' }}>
            <label style={lblStyle}>Status</label>
            <Select value={statusF} onChange={e => setStatusF(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </Select>
          </div>
          <div style={{ flex: '0 1 150px' }}>
            <label style={lblStyle}>Date from</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div style={{ flex: '0 1 150px' }}>
            <label style={lblStyle}>Date to</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {(search || statusF || dateFrom || dateTo) && (
            <Btn variant="ghost" onClick={() => { setSearch(''); setStatusF(''); setDateFrom(''); setDateTo(''); }}>Clear</Btn>
          )}
        </div>
      </Card>

      {/* Table */}
      {loading ? <Spinner /> : rows.length === 0 ? <Empty message="No reservations found." /> : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Date & Time</Th>
                <Th>Guests</Th>
                <Th>Status</Th>
                <Th>Submitted</Th>
                <Th>{''}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(r)}>
                  <Td>
                    <div style={{ fontWeight: 600 }}>{r.customer_name || r.name}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{r.email}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{r.phone}</div>
                  </Td>
                  <Td>
                    <div>{fmtDate(r.reservation_date)}</div>
                    <div style={{ color: '#6B7280', fontSize: '12px' }}>{r.preferred_time}</div>
                  </Td>
                  <Td>{r.guest_count}</Td>
                  <Td><StatusBadge status={r.status} type="reservation" /></Td>
                  <Td style={{ fontSize: '12px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</Td>
                  <Td>
                    <Btn variant="ghost" size="sm" onClick={() => openDetail(r)}>View</Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pages={pages} total={total} onChange={setPage} />
        </>
      )}

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Reservation Detail">
        {selected && (
          <>
            {alert && <div style={{ marginBottom: '14px' }}><Alert type={alert.type} message={alert.msg} /></div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: '18px' }}>
              <Detail label="Name"       value={selected.customer_name || selected.name} />
              <Detail label="Email"      value={selected.email} />
              <Detail label="Phone"      value={selected.phone} />
              <Detail label="Date"       value={fmtDate(selected.reservation_date)} />
              <Detail label="Time"       value={selected.preferred_time} />
              <Detail label="Guests"     value={String(selected.guest_count)} />
              <Detail label="Submitted"  value={fmtDateTime(selected.created_at)} />
            </div>

            {selected.special_request && (
              <div style={{ marginBottom: '14px' }}>
                <div style={lblStyle}>Special Requests</div>
                <div style={{ fontSize: '13.5px', color: '#374151', background: '#F9FAFB', borderRadius: '8px', padding: '10px 14px' }}>{selected.special_request}</div>
              </div>
            )}

            {selected.phone && (
              <div style={{ marginBottom: '16px' }}>
                <a href={waLink(selected.phone, selected.customer_name || selected.name)} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>
                  💬 Chat on WhatsApp
                </a>
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={lblStyle}>Status</label>
              <Select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </Select>
              {editStatus === 'confirmed' && <p style={{ fontSize: '12px', color: '#065F46', marginTop: '5px' }}>A confirmation email will be sent to the customer.</p>}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={lblStyle}>Admin Notes (internal)</label>
              <Textarea rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Internal notes, not visible to customer…" />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setSelected(null)}>Cancel</Btn>
              <Btn variant="primary" disabled={saving} onClick={handleSave}>{saving ? 'Saving…' : 'Save Changes'}</Btn>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={lblStyle}>{label}</div>
      <div style={{ fontSize: '13.5px', color: '#1A0A0F', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

const lblStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9CA3AF', marginBottom: '4px' };
