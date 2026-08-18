/** Shared admin UI primitives. */
import type { CSSProperties, ReactNode } from 'react';

// ── Status badges ─────────────────────────────────────────────────────────────

const RESERVATION_COLOURS: Record<string, { bg: string; text: string }> = {
  new:       { bg: '#EBF4FF', text: '#1D4ED8' },
  contacted: { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#D1FAE5', text: '#065F46' },
  declined:  { bg: '#FEE2E2', text: '#991B1B' },
  cancelled: { bg: '#F3F4F6', text: '#374151' },
  completed: { bg: '#D1FAE5', text: '#065F46' },
  no_show:   { bg: '#FEE2E2', text: '#991B1B' },
};
const ENQUIRY_COLOURS: Record<string, { bg: string; text: string }> = {
  new:         { bg: '#EBF4FF', text: '#1D4ED8' },
  in_progress: { bg: '#FEF3C7', text: '#92400E' },
  resolved:    { bg: '#D1FAE5', text: '#065F46' },
  closed:      { bg: '#F3F4F6', text: '#374151' },
  spam:        { bg: '#FEE2E2', text: '#991B1B' },
};

export function StatusBadge({ status, type = 'enquiry' }: { status: string; type?: 'reservation' | 'enquiry' }) {
  const map = type === 'reservation' ? RESERVATION_COLOURS : ENQUIRY_COLOURS;
  const c = map[status] ?? { bg: '#F3F4F6', text: '#374151' };
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', padding: '20px 24px', ...style }}>
      {children}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

export function StatCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) {
  return (
    <Card style={{ minWidth: 0 }}>
      <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: 800, color: accent ?? '#1A0A0F', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px' }}>{sub}</div>}
    </Card>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px', gap: '16px', flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1A0A0F' }}>{title}</h1>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#6B7280' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Input / Select / Textarea ─────────────────────────────────────────────────

const inputBase: CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 12px', borderRadius: '8px',
  border: '1px solid #E5E7EB', fontSize: '13.5px',
  fontFamily: 'Inter, system-ui, sans-serif',
  color: '#111827', background: '#fff',
  outline: 'none',
};

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputBase, ...props.style }} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputBase, ...props.style }} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inputBase, resize: 'vertical', ...props.style }} />;
}

// ── Button ────────────────────────────────────────────────────────────────────

export function Btn({
  children, variant = 'primary', size = 'md', disabled, onClick, style, type = 'button',
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  disabled?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  type?: 'button' | 'submit';
}) {
  const colours: Record<string, CSSProperties> = {
    primary:   { background: '#3C0815', color: '#FFF8EC' },
    secondary: { background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' },
    danger:    { background: '#FEE2E2', color: '#991B1B' },
    ghost:     { background: 'transparent', color: '#6B7280' },
  };
  const sizes: Record<string, CSSProperties> = {
    sm: { padding: '6px 14px', fontSize: '12px' },
    md: { padding: '9px 18px', fontSize: '13.5px' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        border: 'none', borderRadius: '8px', fontWeight: 600,
        fontFamily: 'Inter, system-ui, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
        transition: 'opacity 0.15s', whiteSpace: 'nowrap',
        ...colours[variant], ...sizes[size], ...style,
      } as CSSProperties}
    >
      {children}
    </button>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────

export function Table({ children }: { children: ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #E8ECF2' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: '#fff' }}>
        {children}
      </table>
    </div>
  );
}
export function Th({ children }: { children: ReactNode }) {
  return <th style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', borderBottom: '1px solid #E8ECF2', whiteSpace: 'nowrap', background: '#FAFAFA' }}>{children}</th>;
}
export function Td({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <td style={{ padding: '12px 14px', color: '#374151', borderBottom: '1px solid #F3F4F6', verticalAlign: 'top', ...style }}>{children}</td>;
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function Empty({ message }: { message: string }) {
  return <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF', fontSize: '14px' }}>{message}</div>;
}

// ── Spinner ───────────────────────────────────────────────────────────────────

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #E5E7EB', borderTopColor: '#3C0815', borderRadius: '50%', animation: 'adm-spin 0.7s linear infinite' }} />
      <style>{`@keyframes adm-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

export function Pagination({ page, pages, total, onChange }: { page: number; pages: number; total: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', fontSize: '13px', color: '#6B7280', flexWrap: 'wrap', gap: '8px' }}>
      <span>{total} total</span>
      <div style={{ display: 'flex', gap: '6px' }}>
        <Btn variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Prev</Btn>
        <span style={{ padding: '6px 12px', fontSize: '12px' }}>Page {page} / {pages}</span>
        <Btn variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next →</Btn>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 201, background: '#fff', borderRadius: '16px', padding: '28px', width: 'min(560px, calc(100vw - 32px))', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1A0A0F' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </>
  );
}

// ── Alert ─────────────────────────────────────────────────────────────────────

export function Alert({ type, message }: { type: 'success' | 'error' | 'info'; message: string }) {
  const colours = { success: { bg: '#D1FAE5', text: '#065F46' }, error: { bg: '#FEE2E2', text: '#991B1B' }, info: { bg: '#EBF4FF', text: '#1D4ED8' } };
  const c = colours[type];
  return <div style={{ background: c.bg, color: c.text, padding: '10px 16px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 500 }}>{message}</div>;
}

// ── Date formatter ────────────────────────────────────────────────────────────

export function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function fmtDateTime(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── WA URL builder ────────────────────────────────────────────────────────────

export function waLink(phone: string, name = '') {
  const clean = phone.replace(/\D/g, '');
  const num = clean.startsWith('91') ? clean : `91${clean}`;
  const text = name ? `Hello ${name}, this is MishtiChaat reaching out.` : 'Hello, this is MishtiChaat.';
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
