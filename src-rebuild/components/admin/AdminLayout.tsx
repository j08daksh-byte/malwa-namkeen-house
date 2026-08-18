import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.ts';
import type { AdminUser } from '../../lib/adminApi.ts';

const NAV = [
  { to: '/admin/dashboard',    label: 'Dashboard',     icon: '⊞' },
  { to: '/admin/reservations', label: 'Reservations',  icon: '📅' },
  { to: '/admin/enquiries',    label: 'Enquiries',     icon: '✉' },
  { to: '/admin/settings',     label: 'Settings',      icon: '⚙' },
];

interface Props { admin: AdminUser; children: React.ReactNode; }

export default function AdminLayout({ admin, children }: Props) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/admin');
  }

  const roleColour: Record<string, string> = {
    super_admin: '#C89A3D',
    admin:       '#7CB9A8',
    staff:       '#A0AEC0',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6FA', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        .adm-sidebar { width: 240px; background: #1A0A0F; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 100; transition: transform 0.26s ease; }
        .adm-nav-link { display: flex; align-items: center; gap: 10px; padding: 11px 20px; color: rgba(255,248,236,0.65); font-size: 13.5px; font-weight: 500; text-decoration: none; border-radius: 8px; margin: 2px 10px; transition: background 0.15s, color 0.15s; }
        .adm-nav-link:hover { background: rgba(200,154,61,0.10); color: #FFF8EC; }
        .adm-nav-link.active { background: rgba(200,154,61,0.18); color: #F0C74E; font-weight: 600; }
        .adm-main { margin-left: 240px; flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .adm-topbar { background: #fff; border-bottom: 1px solid #E8ECF2; height: 58px; display: flex; align-items: center; padding: 0 28px; gap: 16px; position: sticky; top: 0; z-index: 50; }
        .adm-content { flex: 1; padding: 28px; max-width: 1300px; width: 100%; margin-inline: auto; }
        .adm-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 6px; }
        @media (max-width: 800px) {
          .adm-sidebar { transform: translateX(-100%); }
          .adm-sidebar.open { transform: translateX(0); }
          .adm-main { margin-left: 0; }
          .adm-hamburger { display: flex; align-items: center; }
          .adm-content { padding: 16px; }
          .adm-overlay { display: block !important; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`adm-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(200,154,61,0.15)' }}>
          <div style={{ color: '#F0C74E', fontWeight: 800, fontSize: '15px', letterSpacing: '0.04em' }}>MishtiChaat</div>
          <div style={{ color: 'rgba(255,248,236,0.45)', fontSize: '11px', marginTop: '2px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin Panel</div>
        </div>

        <nav style={{ flex: 1, paddingTop: '12px' }}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => `adm-nav-link${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span style={{ fontSize: '15px', lineHeight: 1 }}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(200,154,61,0.15)' }}>
          <div style={{ fontSize: '12px', color: '#FFF8EC', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin.full_name}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,248,236,0.45)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin.email}</div>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: roleColour[admin.role] ?? '#A0AEC0' }}>{admin.role.replace('_', ' ')}</span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{ display: 'block', marginTop: '12px', width: '100%', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', padding: '8px', color: 'rgba(255,248,236,0.6)', fontSize: '12px', cursor: 'pointer' }}
          >
            {loggingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      <div
        className="adm-overlay"
        onClick={() => setSidebarOpen(false)}
        style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 99 }}
      />

      {/* Main */}
      <div className="adm-main">
        <header className="adm-topbar">
          <button className="adm-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle navigation">
            <svg width="20" height="20" fill="none" stroke="#3C0815" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h14M3 12h14M3 18h14"/>
            </svg>
          </button>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: '13px', color: '#6B7280' }}>Welcome, {admin.full_name}</span>
        </header>
        <div className="adm-content">{children}</div>
      </div>
    </div>
  );
}
