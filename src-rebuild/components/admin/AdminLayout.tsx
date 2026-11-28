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
  Image as ImageIcon,
} from 'lucide-react';
import type { AdminUser } from '../../lib/adminApi.ts';
import SEOHead from '../seo/SEOHead.tsx';

const BASE_NAV_ITEMS = [
  { to: '/admin/dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/admin/products',    label: 'Products',        icon: Package },
  { to: '/admin/categories',  label: 'Categories',      icon: FolderTree },
  { to: '/admin/banners',     label: 'Hero Banners',    icon: ImageIcon },
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
        ...BASE_NAV_ITEMS.slice(0, BASE_NAV_ITEMS.length - 1),
        { to: '/admin/staff', label: 'Staff & Roles', icon: UserCheck },
        BASE_NAV_ITEMS[BASE_NAV_ITEMS.length - 1],
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
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id?.disableAutoSelect) {
      try {
        (window as any).google.accounts.id.disableAutoSelect();
      } catch (e) {
        console.warn('[Admin GSI disableAutoSelect]', e);
      }
    }
    localStorage.removeItem('malwa_admin_token');
    localStorage.removeItem('malwa_auth_token');
    localStorage.removeItem('malwa-customer-session');
    try {
      sessionStorage.clear();
      document.cookie = 'malwa_auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;';
    } catch {}
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        keepalive: true,
      });
    } catch {
      // Ignore errors during logout
    } finally {
      navigate('/admin/login', { replace: true });
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
          width: calc(100% - 256px);
          max-width: 100%;
          overflow-x: hidden;
          box-sizing: border-box;
        }
        .adm-topbar {
          background: #FFFFFF;
          border-bottom: 1px solid #EAE5D9;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          gap: 12px;
          position: sticky;
          top: 0;
          z-index: 50;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          box-sizing: border-box;
          width: 100%;
        }
        .adm-content {
          flex: 1;
          padding: 32px;
          max-width: 1320px;
          width: 100%;
          margin-inline: auto;
          box-sizing: border-box;
          overflow-x: hidden;
        }
        .adm-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          color: #3C0815;
          flex-shrink: 0;
        }
        .adm-card {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07);
          padding: 20px 24px;
          box-sizing: border-box;
          max-width: 100%;
          min-width: 0;
        }
        .adm-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
          width: 100%;
          box-sizing: border-box;
        }
        .adm-quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          width: 100%;
          box-sizing: border-box;
        }
        .adm-split-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
          width: 100%;
          box-sizing: border-box;
        }
        .adm-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          gap: 8px;
          flex-wrap: wrap;
          width: 100%;
        }
        .adm-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 12px;
          flex-wrap: wrap;
          width: 100%;
          box-sizing: border-box;
        }
        .adm-filter-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F8F6F2;
          border: 1px solid #EAE3D2;
          padding: 8px 14px;
          border-radius: 8px;
          flex: 1;
          min-width: 240px;
          max-width: 380px;
          box-sizing: border-box;
        }
        .adm-filter-selects {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .adm-table-desktop {
          display: block;
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .adm-cards-mobile {
          display: none;
          width: 100%;
        }

        /* Banner Card Styles */
        .banner-admin-card {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          width: 100%;
          box-sizing: border-box;
        }
        .banner-admin-top {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .banner-admin-order {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .banner-admin-thumb {
          width: 240px;
          aspect-ratio: 1024 / 385;
          border-radius: 8px;
          overflow: hidden;
          background: #FAF6F0;
          border: 1px solid #E2DACB;
          flex-shrink: 0;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .banner-admin-info {
          flex: 1;
          min-width: 220px;
        }
        .banner-admin-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
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
            width: 100%;
          }
          .adm-hamburger {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .adm-topbar {
            padding: 0 12px;
            height: 58px;
          }
          .adm-content {
            padding: 14px 10px;
          }
          .adm-overlay {
            display: block !important;
          }
          .adm-split-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
        }

        @media (max-width: 768px) {
          .adm-card {
            padding: 14px 12px !important;
            border-radius: 10px !important;
          }
          .adm-stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .adm-quick-actions {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .adm-quick-actions > a {
            padding: 10px 10px !important;
            font-size: 12px !important;
          }
          .adm-quick-actions > a span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .adm-table-desktop {
            display: none !important;
          }
          .adm-cards-mobile {
            display: grid !important;
            gap: 12px !important;
          }
          .adm-filter-bar {
            gap: 10px !important;
          }
          .adm-filter-search {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
          }
          .adm-filter-selects {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .adm-filter-selects select {
            width: 100% !important;
            min-width: 0 !important;
            font-size: 12px !important;
          }

          /* Banner mobile restructuring */
          .banner-admin-card {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .banner-admin-top {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
          }
          .banner-admin-order {
            flex-direction: row !important;
            gap: 8px !important;
          }
          .banner-admin-thumb {
            width: 100% !important;
            max-width: 100% !important;
            aspect-ratio: 1024 / 385 !important;
          }
          .banner-admin-info {
            min-width: 0 !important;
            width: 100% !important;
          }
          .banner-admin-actions {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .banner-admin-actions button {
            width: 100% !important;
            justify-content: center !important;
            padding: 9px 8px !important;
            box-sizing: border-box !important;
          }
        }

        @media (max-width: 480px) {
          .adm-topbar-role {
            display: none !important;
          }
          .adm-topbar-title {
            font-size: 15px !important;
            max-width: 140px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .adm-page-header {
            margin-bottom: 16px !important;
            gap: 10px !important;
          }
          .adm-page-header h1 {
            font-size: 18px !important;
          }
          .adm-page-header p {
            font-size: 12px !important;
          }
          .adm-page-header-action {
            width: 100% !important;
            justify-content: flex-start !important;
          }
          .adm-page-header-action button,
          .adm-page-header-action a,
          .adm-page-header-action select {
            flex: 1 1 auto;
          }
        }

        @media (max-width: 360px) {
          .adm-stat-grid {
            grid-template-columns: 1fr !important;
          }
          .adm-quick-actions {
            grid-template-columns: 1fr !important;
          }
          .adm-filter-selects {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`adm-sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Brand Header */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(240, 199, 78, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#F0C74E', fontWeight: 800, fontSize: '15px', letterSpacing: '0.04em', lineHeight: 1.2 }}>
              MALWA NAMKEEN HOUSE
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
              <h1 className="adm-topbar-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#2D0813', letterSpacing: '-0.02em' }}>
                {currentTitle}
              </h1>
            </div>
          </div>

          {/* Right Header Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="adm-topbar-role" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F4F1EA', padding: '5px 10px', borderRadius: '999px', fontSize: '12px', color: '#55000A', fontWeight: 600 }}>
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
