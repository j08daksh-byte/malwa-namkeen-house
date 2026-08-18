import { useState, useEffect, useCallback } from 'react';
import { adminApi, type EnquiryRow } from '../../lib/adminApi.ts';
import {
  PageHeader, Table, Th, Td, StatusBadge, Btn, Modal, Select, Input, Textarea,
  Pagination, Empty, Spinner, Alert, fmtDate, fmtDateTime, waLink, Card,
} from '../../components/admin/ui.tsx';

const STATUSES  = ['new', 'in_progress', 'resolved', 'closed', 'spam'];
const CATEGORIES: Record<string, string> = {
  general_enquiry:         'General Enquiries',
  catering:                'Catering',
  bulk_orders:             'Bulk Orders',
  corporate_gifting:       'Corporate Gifting',
  birthday_parties_events: 'Birthday Parties & Events',
};

export default function AdminEnquiries() {
  const [rows,    setRows]    = useState<EnquiryRow[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);

  const [search,   setSearch]   = useState('');
  const [catF,     setCatF]     = useState('');
  const [statusF,  setStatusF]  = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const [selected,   setSelected]   = useState<EnquiryRow | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes,  setEditNotes]  = useState('');
  const [saving,     setSaving]     = useState(false);
  const [alert,      setAlert]      = useState<{ type: 'success'|'error'; msg: string } | null>(null);

  const load = useCallback((p: number) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(p) };
    if (search)   params.search   = search;
    if (catF)     params.category = catF;
    if (statusF)  params.status   = statusF;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo)   params.dateTo   = dateTo;
    adminApi.enquiries(params)
      .then(r => {
        setRows(r.data);
        setTotal(r.pagination.total);
        setPages(r.pagination.pages);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, catF, statusF, dateFrom, dateTo]);

  useEffect(() => { setPage(1); load(1); }, [search, catF, statusF, dateFrom, dateTo]);
  useEffect(() => { load(page); }, [page, load]);

  function openDetail(e: EnquiryRow) {
    setSelected(e);
    setEditStatus(e.status);
    setEditNotes(e.admin_notes ?? '');
    setAlert(null);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      await adminApi.updateEnquiry(selected.id, { status: editStatus, admin_notes: editNotes });
      setAlert({ type: 'success', msg: 'Enquiry updated.' });
      setRows(r => r.map(x => x.id === selected.id ? { ...x, status: editStatus, admin_notes: editNotes } : x));
      setSelected(prev => prev ? { ...prev, status: editStatus, admin_notes: editNotes } : prev);
    } catch (e: unknown) {
      setAlert({ type: 'error', msg: e instanceof Error ? e.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  }

  const hasFilters = search || catF || statusF || dateFrom || dateTo;

  return (
    <>
      <PageHeader title="Enquiries" subtitle={`${total} total`} />

      <Card style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={lblStyle}>Search</label>
            <Input placeholder="Name, email, message…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ flex: '0 1 180px' }}>
            <label style={lblStyle}>Category</label>
            <Select value={catF} onChange={e => setCatF(e.target.value)}>
              <option value="">All categories</option>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
          <div style={{ flex: '0 1 150px' }}>
            <label style={lblStyle}>Status</label>
            <Select value={statusF} onChange={e => setStatusF(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </Select>
          </div>
          <div style={{ flex: '0 1 140px' }}>
            <label style={lblStyle}>From</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div style={{ flex: '0 1 140px' }}>
            <label style={lblStyle}>To</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {hasFilters && (
            <Btn variant="ghost" onClick={() => { setSearch(''); setCatF(''); setStatusF(''); setDateFrom(''); setDateTo(''); }}>Clear</Btn>
          )}
        </div>
      </Card>

      {loading ? <Spinner /> : rows.length === 0 ? <Empty message="No enquiries found." /> : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Category</Th>
                <Th>Message</Th>
                <Th>Status</Th>
                <Th>Submitted</Th>
                <Th>{''}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(e => (
                <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(e)}>
                  <Td>
                    <div style={{ fontWeight: 600 }}>{e.customer_name || e.name}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{e.email}</div>
                    {e.phone && <div style={{ fontSize: '12px', color: '#6B7280' }}>{e.phone}</div>}
                  </Td>
                  <Td>{CATEGORIES[e.category] ?? e.category}</Td>
                  <Td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.message}</Td>
                  <Td><StatusBadge status={e.status} /></Td>
                  <Td style={{ fontSize: '12px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(e.created_at)}</Td>
                  <Td>
                    <Btn variant="ghost" size="sm" onClick={() => openDetail(e)}>View</Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pages={pages} total={total} onChange={setPage} />
        </>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Enquiry Detail">
        {selected && (
          <>
            {alert && <div style={{ marginBottom: '14px' }}><Alert type={alert.type} message={alert.msg} /></div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: '18px' }}>
              <Detail label="Name"      value={selected.customer_name || selected.name} />
              <Detail label="Email"     value={selected.email} />
              {selected.phone && <Detail label="Phone" value={selected.phone} />}
              <Detail label="Category"  value={CATEGORIES[selected.category] ?? selected.category} />
              <Detail label="Submitted" value={fmtDateTime(selected.created_at)} />
            </div>

            <div style={{ margin: '14px 0' }}>
              <div style={lblStyle}>Message</div>
              <div style={{ fontSize: '13.5px', color: '#374151', background: '#F9FAFB', borderRadius: '8px', padding: '10px 14px', whiteSpace: 'pre-wrap' }}>{selected.message}</div>
            </div>

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
