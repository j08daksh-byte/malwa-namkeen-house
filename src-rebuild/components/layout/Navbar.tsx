import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, UserRound, ShoppingBag, Heart, ShieldCheck, X, Minus, Plus, ArrowRight } from 'lucide-react';
import { NAV_LINKS, MOBILE_LINKS } from '../../data/nav-links';
import { ACTIVE_MENU, type MenuItem } from '../../data/menu';
import { useCart } from './CartContext';
import { useWishlist } from '../../lib/wishlistContext';
import { useCustomerSession } from './CustomerSessionContext';

function scrollTo(href: string) {
  if (href === '/' || href === '#hero' || href === '/#hero') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const cleanId = href.replace(/^(\/)?#/, '');
  const el = document.getElementById(cleanId);
  if (el) {
    const navbarHeight = 68;
    const topPos = el.getBoundingClientRect().top + window.scrollY - navbarHeight;
    window.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
  }
}

function price(value: MenuItem['price']) {
  return typeof value === 'number' ? `₹${value}` : value ?? 'Price on request';
}

function HamburgerIcon({ open }: { open: boolean }) {
  const bar: CSSProperties = {
    display: 'block',
    width: '22px',
    height: '2px',
    backgroundColor: '#FFF9EF',
    borderRadius: '2px',
    transition: 'transform .24s ease, opacity .24s ease',
    transformOrigin: 'center',
  };
  return (
    <div style={{ width: '22px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <span style={{ ...bar, transform: open ? 'translateY(7px) rotate(45deg)' : 'none' }} />
      <span style={{ ...bar, opacity: open ? 0 : 1 }} />
      <span style={{ ...bar, transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isHashLink = href.includes('#');
  const targetHash = isHashLink ? `#${href.split('#')[1]}` : '';
  const isActive = isHashLink
    ? location.pathname === '/' && location.hash === targetHash
    : location.pathname === href;

  return (
    <a
      href={href}
      className={`nav-link${isActive ? ' nav-link--active' : ''}`}
      onClick={e => {
        e.preventDefault();
        if (href === '/') {
          if (location.pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            navigate('/');
          }
        } else if (isHashLink) {
          if (location.pathname === '/') {
            scrollTo(href);
            window.history.pushState(null, '', href);
          } else {
            navigate(href);
          }
        } else {
          navigate(href);
        }
      }}
    >
      {children}
    </a>
  );
}

export default function Navbar({ onReserve: _onReserve }: { onReserve?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer } = useCustomerSession();
  const { items, itemCount, subtotal, addItem, updateQuantity, removeItem } = useCart();
  const { wishlistCount } = useWishlist();

  const openCustomerAccount = () => navigate(customer ? '/dashboard' : '/account');

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInput = useRef<HTMLInputElement>(null);

  const navbarLinks = NAV_LINKS;
  const mobileLinks = MOBILE_LINKS;

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? ACTIVE_MENU.filter(p => [p.name, p.description, p.category, ...p.keywords].join(' ').toLowerCase().includes(term)).slice(0, 6)
      : [];
  }, [query]);

  const closeMenu = useCallback(() => setOpen(false), []);
  const closePanels = useCallback(() => {
    setCartOpen(false);
    setSearchOpen(false);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return;
    const timer = window.setTimeout(() => scrollTo(location.hash), 0);
    return () => window.clearTimeout(timer);
  }, [location.hash, location.pathname]);

  useEffect(() => {
    const fn = () => {
      if (window.innerWidth >= 900) setOpen(false);
    };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = window.setTimeout(() => searchInput.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [searchOpen]);

  useEffect(() => {
    if (!open && !cartOpen && !searchOpen) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
        closePanels();
      }
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [open, cartOpen, searchOpen, closeMenu, closePanels]);

  useEffect(() => {
    document.body.style.overflow = open || cartOpen || searchOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, cartOpen, searchOpen]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-nav]')) closeMenu();
    };
    document.addEventListener('click', fn);
    return () => document.removeEventListener('click', fn);
  }, [open, closeMenu]);

  const go = (href: string) => {
    closeMenu();
    const isHashLink = href.includes('#');
    if (href === '/') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
    } else if (isHashLink) {
      if (location.pathname === '/') {
        scrollTo(href);
        window.history.pushState(null, '', href);
      } else {
        navigate(href);
      }
    } else {
      navigate(href);
    }
  };

  const showSearch = () => {
    closeMenu();
    setCartOpen(false);
    setSearchOpen(true);
  };

  const showCart = () => {
    closeMenu();
    setSearchOpen(false);
    setCartOpen(true);
  };

  const addFromSearch = (product: MenuItem) => {
    addItem(product);
    setSearchOpen(false);
    setCartOpen(true);
  };

  return (
    <>
      <style>{`
        .nav-desktop-links {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          justify-content: center;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }
        .nav-hamburger,
        .nav-drawer {
          display: none !important;
        }
        .nav-link {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14px;
          font-weight: 500;
          letter-spacing: .01em;
          white-space: nowrap;
          color: rgba(255, 249, 239, .8);
          text-decoration: none;
          padding: 6px 16px;
          border-radius: 3px;
          transition: color .15s, background-color .15s;
        }
        .nav-link:hover,
        .nav-link--active {
          color: #D4AA45;
          background-color: rgba(212, 170, 69, .12);
        }
        .nav-action {
          position: relative;
          display: inline-grid;
          place-items: center;
          width: 38px;
          height: 40px;
          border: 0;
          border-radius: 50%;
          color: #FFF8EC;
          background: transparent;
          cursor: pointer;
          transition: color .18s, background-color .18s, transform .18s;
        }
        .nav-action:hover {
          color: #D4AA45;
          background: rgba(212, 170, 69, .12);
          transform: translateY(-1px);
        }
        .nav-action__count {
          position: absolute;
          top: 4px;
          right: 1px;
          min-width: 15px;
          height: 15px;
          padding: 0 3px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #D4AA45;
          color: #3D0007;
          font: 700 9px/1 var(--font-primary, 'DM Sans', sans-serif);
        }
        .shop-overlay {
          position: fixed;
          inset: 0;
          z-index: 500;
          background: rgba(42, 0, 5, .46);
          opacity: 0;
          transition: opacity .28s;
          pointer-events: none;
        }
        .shop-overlay--open {
          opacity: 1;
          pointer-events: auto;
        }
        .cart-panel {
          position: fixed;
          z-index: 501;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(100%, 430px);
          display: flex;
          flex-direction: column;
          background: #FFFDF8;
          box-shadow: -18px 0 52px rgba(42, 0, 5, .22);
          transform: translateX(104%);
          transition: transform .34s cubic-bezier(.22, .8, .25, 1);
        }
        .cart-panel--open {
          transform: translateX(0);
        }
        .cart-panel__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 25px 25px 19px;
          border-bottom: 1px solid var(--border-soft);
        }
        .cart-panel__title {
          color: var(--brand-maroon);
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 26px;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -.02em;
        }
        .panel-close {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border-soft);
          border-radius: 50%;
          color: var(--brand-maroon);
          background: transparent;
          cursor: pointer;
          transition: background .18s, color .18s, border-color .18s;
        }
        .panel-close:hover {
          background: var(--brand-maroon);
          color: var(--text-on-dark);
          border-color: var(--brand-maroon);
        }
        .cart-panel__body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .cart-empty {
          min-height: 260px;
          display: grid;
          place-content: center;
          text-align: center;
          color: var(--text-muted);
        }
        .cart-empty svg {
          margin: 0 auto 16px;
          color: var(--gold);
          stroke-width: 1.25;
        }
        .cart-empty h3 {
          margin: 0 0 7px;
          color: var(--brand-maroon);
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -.01em;
        }
        .cart-empty p {
          max-width: 230px;
          font-size: 13px;
          line-height: 1.6;
        }
        .cart-line {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 14px;
          padding: 0 0 19px;
          margin: 0 0 19px;
          border-bottom: 1px solid var(--border-soft);
        }
        .cart-line__name {
          color: var(--text-dark);
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 15px;
          font-weight: 600;
          line-height: 1.25;
        }
        .cart-line__meta {
          margin-top: 5px;
          color: var(--text-muted);
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11px;
          letter-spacing: .04em;
          text-transform: uppercase;
        }
        .cart-line__price {
          color: var(--brand-maroon);
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14px;
          font-weight: 700;
          text-align: right;
        }
        .quantity-control {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 12px;
          padding: 3px;
          border: 1px solid var(--border-soft);
          border-radius: 999px;
        }
        .quantity-control button {
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: var(--brand-maroon);
          cursor: pointer;
        }
        .quantity-control button:hover {
          background: var(--maroon-light);
        }
        .quantity-control span {
          min-width: 18px;
          text-align: center;
          color: var(--text-dark);
          font: 700 12px var(--font-primary, 'DM Sans', sans-serif);
        }
        .cart-panel__footer {
          padding: 20px 24px 25px;
          border-top: 1px solid var(--border-soft);
          background: var(--bg-card-alt);
        }
        .cart-subtotal {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          color: var(--brand-maroon);
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14px;
          font-weight: 700;
        }
        .checkout-btn {
          width: 100%;
          padding: 14px;
          border: 0;
          border-radius: 999px;
          background: var(--brand-maroon);
          color: var(--text-on-dark);
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background .18s, transform .18s;
        }
        .checkout-btn:hover {
          background: var(--maroon-hover);
          transform: translateY(-1px);
        }
        .mobile-link {
          display: flex;
          align-items: center;
          width: 100%;
          text-align: left;
          padding: 13px 10px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: #FFF8EC;
          background: transparent;
          border: 0;
          cursor: pointer;
          transition: background-color .15s, color .15s;
        }
        .mobile-link:hover {
          color: #D4AA45;
          background-color: rgba(212, 170, 69, .08);
        }
        .search-shell {
          position: fixed;
          z-index: 501;
          top: 0;
          left: 0;
          right: 0;
          max-height: 100dvh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: calc(68px + clamp(16px, 4vw, 40px)) clamp(16px, 4vw, 40px) 32px;
          background: var(--bg-parchment);
          transform: translateY(-105%);
          transition: transform .34s cubic-bezier(.22, .8, .25, 1);
          box-shadow: 0 16px 40px rgba(42, 0, 5, .16);
        }
        .search-shell--open {
          transform: translateY(0);
        }
        .search-shell__inner {
          width: min(100%, 900px);
          margin: 0 auto;
        }
        .search-shell__top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }
        .search-shell__eyebrow {
          color: var(--gold);
          font: 800 10px Inter, sans-serif;
          letter-spacing: .18em;
          text-transform: uppercase;
        }
        .search-field {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 16px;
          border: 1px solid var(--border-warm);
          background: var(--bg-ivory);
          box-shadow: 0 8px 20px rgba(61, 0, 7, .06);
          border-radius: 6px;
        }
        .search-field:focus-within {
          border-color: var(--gold);
        }
        .search-field svg {
          color: var(--gold);
          flex: none;
        }
        .search-field input {
          width: 100%;
          height: 52px;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text-dark);
          font: 500 16px Inter, sans-serif;
        }
        .search-results {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 16px;
        }
        .search-result {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 15px;
          border: 1px solid var(--border-soft);
          background: var(--bg-ivory);
          text-align: left;
          cursor: pointer;
          border-radius: 4px;
          transition: border-color .18s, transform .18s;
        }
        .search-result:hover {
          border-color: var(--gold);
          transform: translateY(-2px);
        }
        .search-result__name {
          display: block;
          color: var(--brand-maroon);
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14.5px;
          font-weight: 700;
          line-height: 1.25;
        }
        .search-result__info {
          display: block;
          margin-top: 4px;
          color: var(--text-muted);
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11.5px;
        }
        .search-result__price {
          color: var(--gold);
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }
        .search-status {
          margin: 16px 2px 0;
          color: var(--text-muted);
          font-size: 13px;
        }
        @media (max-width: 899px) {
          .nav-desktop-links { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-drawer { display: block !important; }
          .nav-actions { gap: 1px; }
          .nav-action { width: 34px; height: 40px; }
          .nav-action svg { width: 18px; height: 18px; }
          .nav-action__count { top: 4px; right: 0; }
          .search-results { grid-template-columns: 1fr; }
          .search-shell { padding-top: 84px; }
          .cart-panel { width: min(100%, 390px); }
          .cart-panel__footer { padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px)); }
        }
        @media (max-width: 420px) {
          .nav-action { width: 32px; height: 38px; }
          .nav-action svg { width: 17px; height: 17px; }
          .cart-panel__head { padding: 18px 16px 14px; }
          .cart-panel__body { padding: 16px; }
          .cart-panel__footer { padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px)); }
          .search-shell { padding-inline: 14px; }
          .search-field input { font-size: 15px; height: 46px; }
          .search-result { padding: 12px; }
          .brand-logo__img { height: 32px !important; }
        }
        @media (max-width: 360px) {
          .nav-action { width: 28px; height: 36px; }
          .nav-action svg { width: 15px; height: 15px; }
          .brand-logo__img { height: 28px !important; }
          .nav-hamburger { padding: 4px !important; min-width: 36px !important; }
        }
      `}</style>

      <header
        data-nav
        role="banner"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          height: '68px',
          backgroundColor: 'var(--brand-nav)',
          borderBottom: scrolled ? '1px solid rgba(200,154,61,.28)' : 'none',
          boxShadow: scrolled ? '0 6px 18px rgba(35,3,10,.16)' : 'none',
          transition: 'box-shadow .3s, border-color .3s',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '0 clamp(16px,3vw,48px)',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Logo */}
          <a
            href="/"
            className="brand-logo"
            aria-label="MALWA NAMKEEN HOUSE — return to top"
            onClick={e => {
              e.preventDefault();
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <img
              src="/logo-nav.png"
              alt="MALWA NAMKEEN HOUSE"
              className="brand-logo__img"
              style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
            />
          </a>

          {/* Desktop nav links */}
          <nav className="nav-desktop-links" aria-label="Main navigation">
            {navbarLinks.map(l => (
              <NavLink key={l.href} href={l.href}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Action buttons (Search, Account, Cart, Mobile Menu) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <div className="nav-actions" aria-label="Utility navigation">
              <button className="nav-action" onClick={showSearch} aria-label="Search products">
                <Search size={19} strokeWidth={1.7} />
              </button>
              {(customer?.role === 'admin' || customer?.role === 'super_admin') && (
                <button
                  className="nav-action"
                  onClick={() => navigate('/admin/dashboard')}
                  aria-label="Open Admin Portal"
                  title="Admin Portal"
                  style={{ color: '#F0C74E' }}
                >
                  <ShieldCheck size={19} strokeWidth={1.8} />
                </button>
              )}
              <button
                className="nav-action"
                onClick={openCustomerAccount}
                aria-label={customer ? 'Open customer dashboard' : 'Sign in to your account'}
              >
                <UserRound size={19} strokeWidth={1.7} />
              </button>
              <button
                className="nav-action"
                onClick={() => navigate('/shop')}
                aria-label={`Wishlist, ${wishlistCount} items`}
                title="Wishlist"
              >
                <Heart size={19} strokeWidth={1.7} />
                {wishlistCount > 0 && <span className="nav-action__count">{wishlistCount > 9 ? '9+' : wishlistCount}</span>}
              </button>
              <button className="nav-action" onClick={showCart} aria-label={`Cart, ${itemCount} items`}>
                <ShoppingBag size={19} strokeWidth={1.7} />
                {itemCount > 0 && <span className="nav-action__count">{itemCount > 9 ? '9+' : itemCount}</span>}
              </button>
            </div>

            <button
              className="nav-hamburger"
              data-nav
              onClick={() => setOpen(o => !o)}
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={open}
              aria-controls="mobile-nav"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '11px',
                lineHeight: 0,
                borderRadius: '4px',
                minWidth: '44px',
                minHeight: '44px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HamburgerIcon open={open} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        id="mobile-nav"
        data-nav
        className="nav-drawer"
        role="navigation"
        aria-label="Mobile navigation"
        style={{
          position: 'fixed',
          top: '68px',
          left: 0,
          right: 0,
          zIndex: 199,
          backgroundColor: 'var(--brand-nav)',
          borderTop: '1px solid rgba(200,154,61,.22)',
          boxShadow: '0 6px 18px rgba(35,3,10,.16)',
          transform: open ? 'translateY(0)' : 'translateY(-110%)',
          opacity: open ? 1 : 0,
          transition: 'transform .28s ease, opacity .24s ease',
          padding: '8px 18px calc(24px + env(safe-area-inset-bottom, 0px))',
          maxHeight: 'calc(100dvh - 68px)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {(customer?.role === 'admin' || customer?.role === 'super_admin') && (
          <button
            type="button"
            className="mobile-link"
            onClick={() => {
              setOpen(false);
              navigate('/admin/dashboard');
            }}
            style={{ color: '#F0C74E', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,.08)' }}
          >
            <ShieldCheck size={16} /> Admin Portal
          </button>
        )}
        <button
          type="button"
          className="mobile-link"
          onClick={() => {
            setOpen(false);
            openCustomerAccount();
          }}
          style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}
        >
          {customer ? 'Your Account' : 'Sign In'}
        </button>
        {mobileLinks.map((link, i) => (
          <a
            key={link.href}
            href={link.href}
            onClick={e => {
              e.preventDefault();
              go(link.href);
            }}
            style={{
              display: 'block',
              padding: '13px 10px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 500,
              color: '#FFF8EC',
              textDecoration: 'none',
              borderBottom: i < mobileLinks.length - 1 ? '1px solid rgba(255,255,255,.08)' : 'none',
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      <div style={{ height: '68px' }} aria-hidden="true" />

      {/* Overlays for Cart & Search */}
      <div
        className={`shop-overlay ${cartOpen || searchOpen ? 'shop-overlay--open' : ''}`}
        onClick={closePanels}
        aria-hidden="true"
      />

      {/* Navbar Slide-out Cart Panel */}
      <aside
        className={`cart-panel ${cartOpen ? 'cart-panel--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!cartOpen}
      >
        <div className="cart-panel__head">
          <h2 className="cart-panel__title">Cart</h2>
          <button className="panel-close" onClick={() => setCartOpen(false)} aria-label="Close cart">
            <X size={19} />
          </button>
        </div>

        <div className="cart-panel__body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={38} />
              <h3>Your cart is empty</h3>
              <p>Add something delicious from our menu or shop to begin your order.</p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div className="cart-line" key={product.id}>
                <div>
                  <div className="cart-line__name">{product.name}</div>
                  <div className="cart-line__meta">{product.category}</div>
                  <div className="quantity-control">
                    <button onClick={() => updateQuantity(product.id, quantity - 1)} aria-label={`Remove one ${product.name}`}>
                      <Minus size={13} />
                    </button>
                    <span>{quantity}</span>
                    <button onClick={() => updateQuantity(product.id, quantity + 1)} aria-label={`Add one ${product.name}`}>
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
                <div className="cart-line__price">
                  {price(typeof product.price === 'number' ? product.price * quantity : product.price)}
                  <button
                    onClick={() => removeItem(product.id)}
                    style={{
                      display: 'block',
                      margin: '12px 0 0 auto',
                      border: 0,
                      padding: 0,
                      color: 'var(--text-muted)',
                      background: 'none',
                      font: '500 11px Inter, sans-serif',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-panel__footer">
            <div className="cart-subtotal">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <button className="checkout-btn" onClick={() => navigate('/shop')}>
              Proceed to checkout <ArrowRight size={14} style={{ verticalAlign: '-2px', marginLeft: 5 }} />
            </button>
          </div>
        )}
      </aside>

      {/* Global Search Shell */}
      <section
        className={`search-shell ${searchOpen ? 'search-shell--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Search our menu"
        aria-hidden={!searchOpen}
      >
        <div className="search-shell__inner">
          <div className="search-shell__top">
            <span className="search-shell__eyebrow">Search the menu</span>
            <button className="panel-close" onClick={() => setSearchOpen(false)} aria-label="Close search">
              <X size={19} />
            </button>
          </div>
          <label className="search-field">
            <Search size={20} strokeWidth={1.7} />
            <input
              ref={searchInput}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && query.trim()) {
                  setSearchOpen(false);
                  navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
                }
              }}
              placeholder="Search for a favourite delicacy…"
              aria-label="Search delicacies"
            />
          </label>
          {query.trim() && (
            <>
              {results.length ? (
                <div className="search-results">
                  {results.map(product => (
                    <button className="search-result" key={product.id} onClick={() => addFromSearch(product)}>
                      <span>
                        <span className="search-result__name">{product.name}</span>
                        <span className="search-result__info">{product.description || product.category}</span>
                      </span>
                      <span className="search-result__price">{price(product.price)} +</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="search-status">No menu items match “{query.trim()}”. Try another flavour or dish.</p>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
