import { useState, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Tag,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import type { AdminUser } from '../../lib/adminApi.ts';
import SEOHead from '../seo/SEOHead.tsx';

const BASE_NAV_ITEMS = [
  { to: '/admin/dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/admin/products',    label: 'Products',        icon: Package },
  { to: '/admin/categories',  label: 'Categories',      icon: FolderTree },
  { to: '/admin/orders',      label: 'Orders',          icon: ShoppingBag },
  { to: '/admin/customers',   label: 'Customers',       icon: Users },
  { to: '/admin/discounts',   label: 'Discounts',       icon: Tag },
  { to: '/admin/inquiries',   label: 'Inquiries',       icon: MessageSquare },
  { to: '/admin/settings',    label: 'Store Settings',  icon: Settings },
];

interface Props {
  admin: AdminUser;
  children: React.ReactNode;
}

export default function AdminLayout({ admin, children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperAdmin = admin.role === 'super_admin';

  const navItems = useMemo(() => {
    if (isSuperAdmin) {
      return [
        ...BASE_NAV_ITEMS.slice(0, 7),
        { to: '/admin/staff', label: 'Staff & Roles', icon: UserCheck },
        BASE_NAV_ITEMS[7],
      ];
    }
    return BASE_NAV_ITEMS;
  }, [isSuperAdmin]);

  // Compute active page title
  const currentTitle = useMemo(() => {
    const matched = navItems.find(n => location.pathname.startsWith(n.to));
    if (matched) return matched.label;
    if (location.pathname.includes('/admin/enquiries')) return 'Inquiries';
    if (location.pathname.includes('/admin/reservations')) return 'Reservations';
    return 'Admin Management';
  }, [location.pathname, navItems]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      localStorage.removeItem('malwa_admin_token');
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore errors during logout
    } finally {
      navigate('/admin');
    }
  }

  const roleLabel = (admin.role || 'admin').replace('_', ' ').toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F6F2', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <SEOHead title={`Admin — ${currentTitle}`} noIndex={true} />
      <style>{`
        .adm-sidebar {
          width: 256px;
          background: #2D0813;
          background: linear-gradient(180deg, #2D0813 0%, #1A040A 100%);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 100;
          box-shadow: 2px 0 16px rgba(0,0,0,0.18);
          transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .adm-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          color: rgba(255, 248, 236, 0.70);
          font-size: 13.5px;
          font-weight: 500;
          text-decoration: none;
          border-radius: 8px;
          margin: 3px 12px;
          transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
        }
        .adm-nav-link:hover {
          background: rgba(240, 199, 78, 0.10);
          color: #FFF9EF;
          transform: translateX(2px);
        }
        .adm-nav-link.active {
          background: rgba(240, 199, 78, 0.18);
          color: #F0C74E;
          font-weight: 700;
          box-shadow: inset 3px 0 0 #F0C74E;
        }
        .adm-main {
          margin-left: 256px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .adm-topbar {
          background: #FFFFFF;
          border-bottom: 1px solid #EAE5D9;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 50;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .adm-content {
          flex: 1;
          padding: 32px;
          max-width: 1320px;
          width: 100%;
          margin-inline: auto;
          box-sizing: border-box;
        }
        .adm-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          color: #3C0815;
        }
        @media (max-width: 900px) {
          .adm-sidebar {
            transform: translateX(-100%);
          }
          .adm-sidebar.open {
            transform: translateX(0);
          }
          .adm-main {
            margin-left: 0;
          }
          .adm-hamburger {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .adm-topbar {
            padding: 0 16px;
          }
          .adm-content {
            padding: 18px 16px;
          }
          .adm-overlay {
            display: block !important;
          }
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`adm-sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Brand Header */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(240, 199, 78, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#F0C74E', fontWeight: 800, fontSize: '15px', letterSpacing: '0.04em', lineHeight: 1.2 }}>
              MALWA NAMKEEN
            </div>
            <div style={{ color: 'rgba(255, 248, 236, 0.50)', fontSize: '10.5px', marginTop: '3px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Admin Portal
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ display: sidebarOpen ? 'flex' : 'none', background: 'transparent', border: 'none', color: '#FFF8EC', cursor: 'pointer', padding: '4px' }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Storefront Quick Link */}
        <div style={{ padding: '12px 14px 4px' }}>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(240, 199, 78, 0.15)',
              borderRadius: '6px',
              color: 'rgba(255,248,236,0.65)',
              fontSize: '11.5px',
              textDecoration: 'none',
            }}
          >
            <span>Visit Live Store</span>
            <ExternalLink size={12} color="#F0C74E" />
          </a>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, paddingTop: '10px', overflowY: 'auto' }}>
          {navItems.map(n => {
            const Icon = n.icon;
            const isMatch = location.pathname.startsWith(n.to) ||
              (n.to === '/admin/inquiries' && location.pathname.startsWith('/admin/enquiries'));

            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={`adm-nav-link${isMatch ? ' active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                <span>{n.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Admin Identity & Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(240, 199, 78, 0.15)', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F0C74E', color: '#2D0813', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>
              {(admin.full_name || admin.email || 'A')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#FFF8EC', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {admin.full_name || 'Admin'}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,248,236,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {admin.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.08em', background: 'rgba(240,199,78,0.18)', color: '#F0C74E', padding: '2px 7px', borderRadius: '4px' }}>
              {roleLabel}
            </span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'transparent',
                border: 'none',
                color: '#FDA4AF',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <LogOut size={13} />
              <span>{loggingOut ? 'Exiting…' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="adm-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 99, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Main Content Area */}
      <div className="adm-main">
        {/* Top Header */}
        <header className="adm-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button className="adm-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle navigation">
              <Menu size={22} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#2D0813', letterSpacing: '-0.02em' }}>
                {currentTitle}
              </h1>
            </div>
          </div>

          {/* Right Header Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F4F1EA', padding: '5px 10px', borderRadius: '999px', fontSize: '12px', color: '#55000A', fontWeight: 600 }}>
              <ShieldCheck size={14} color="#D4AA45" />
              <span>{roleLabel}</span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FAF6EE',
                border: '1px solid #EAE3D2',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#881337',
                cursor: 'pointer',
              }}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="adm-content">
          {children}
        </main>
      </div>
    </div>
  );
}
