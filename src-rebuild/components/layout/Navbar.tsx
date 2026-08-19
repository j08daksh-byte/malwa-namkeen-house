import { useState, useEffect, useCallback, type ReactNode, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_LINKS, MOBILE_LINKS } from '../../data/nav-links';

function scrollTo(href: string) {
  if (href === '#hero') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
}

function HamburgerIcon({ open }: { open: boolean }) {
  const bar: CSSProperties = {
    display: 'block', width: '22px', height: '2px',
    backgroundColor: '#FFF9EF', borderRadius: '2px',
    transition: 'transform 0.24s ease, opacity 0.24s ease',
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
  return (
    <a
      href={href}
      className="nav-link"
      onClick={e => {
        e.preventDefault();
        if (href === '/') { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        else if (href.startsWith('/')) navigate(href);
        else if (location.pathname === '/') scrollTo(href);
        else navigate(`/${href}`);
      }}
    >
      {children}
    </a>
  );
}

export default function Navbar({ onReserve }: { onReserve?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navbarLinks = NAV_LINKS.map(link => link.label === 'Location' ? { label: 'Shop', href: '/shop' } : link);
  const mobileLinks = MOBILE_LINKS.map(link => link.label === 'Location' ? { label: 'Shop', href: '/shop' } : link);

  /* Scroll shadow */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* Scroll to homepage sections after navigating from another route. */
  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return;
    const timer = window.setTimeout(() => scrollTo(location.hash), 0);
    return () => window.clearTimeout(timer);
  }, [location.hash, location.pathname]);

  /* Close when viewport goes desktop */
  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 900) setOpen(false); };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  /* Escape key */
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [open, close]);

  /* Body scroll lock */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  /* Click outside */
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-nav]')) close();
    };
    document.addEventListener('click', fn);
    return () => document.removeEventListener('click', fn);
  }, [open, close]);

  const handleLink = (href: string) => {
    close();
    if (href === '/') { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else if (href.startsWith('/')) navigate(href);
    else if (location.pathname === '/') scrollTo(href);
    else navigate(`/${href}`);
  };

  return (
    <>
      <style>{`
        /* ── Shared ──────────────────────────────────────────── */
        .nav-desktop-links { display: flex; align-items: center; gap: 6px; flex: 1; justify-content: center; }
        .nav-reserve        { display: inline-flex; }
        .nav-hamburger      { display: none !important; }
        .nav-drawer         { display: none; }

        /* ── Nav link ────────────────────────────────────────── */
        .nav-link {
          font-family: Inter, sans-serif; font-size: 14px; font-weight: 500;
          letter-spacing: 0.03em; white-space: nowrap;
          color: rgba(255,249,239,0.80);
          text-decoration: none;
          padding: 6px 16px; border-radius: 3px;
          background-color: transparent;
          transition: color 0.15s, background-color 0.15s;
        }
        .nav-link:hover {
          color: #D4AA45;
          background-color: rgba(212,170,69,0.10);
        }

        /* ── Mobile < 900px ──────────────────────────────────── */
        @media (max-width: 899px) {
          .nav-desktop-links { display: none !important; }
          .nav-reserve        { display: none !important; }
          .nav-hamburger      { display: flex !important; }
          .nav-drawer         { display: block; }
        }
      `}</style>

      <header
        data-nav
        role="banner"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          height: '68px',
          backgroundColor: 'var(--brand-nav)',
          borderBottom: scrolled ? '1px solid rgba(200,154,61,0.28)' : 'none',
          boxShadow:    scrolled ? '0 6px 18px rgba(35,3,10,0.16)' : 'none',
          transition: 'box-shadow 0.30s, border-color 0.30s',
          display: 'flex', alignItems: 'center',
        }}
      >
        <div style={{
          maxWidth: '1240px', margin: '0 auto',
          padding: '0 clamp(16px, 3vw, 48px)',
          width: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>

          {/* Logo */}
          <a
            href="/"
            aria-label="MishtiChaat — return to top"
            onClick={e => { e.preventDefault(); navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}
          >
            <img
              src="/mishtichaat/logo.svg"
              alt="MishtiChaat"
              style={{ height: '52px', width: 'auto', maxWidth: '220px', objectFit: 'contain', flexShrink: 0 }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </a>

          {/* Desktop nav links */}
          <nav className="nav-desktop-links" aria-label="Main navigation">
            {navbarLinks.map(l => <NavLink key={l.href} href={l.href}>{l.label}</NavLink>)}
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

            {/* Desktop reserve button */}
            <ReserveBtn className="nav-reserve" onClick={onReserve} />

            {/* Hamburger — mobile only */}
            <button
              className="nav-hamburger"
              data-nav
              onClick={() => setOpen(o => !o)}
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={open}
              aria-controls="mobile-nav"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '11px', lineHeight: 0, borderRadius: '4px',
                minWidth: '44px', minHeight: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <HamburgerIcon open={open} />
            </button>
          </div>

        </div>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────── */}
      <div
        id="mobile-nav"
        data-nav
        className="nav-drawer"
        role="navigation"
        aria-label="Mobile navigation"
        style={{
          position: 'fixed',
          top: '68px', left: 0, right: 0,
          zIndex: 199,
          backgroundColor: 'var(--brand-nav)',
          borderTop: '1px solid rgba(200,154,61,0.22)',
          boxShadow: '0 6px 18px rgba(35,3,10,0.16)',
          /* Slide in/out */
          transform: open ? 'translateY(0)' : 'translateY(-110%)',
          opacity:   open ? 1 : 0,
          transition: 'transform 0.28s ease, opacity 0.24s ease',
          padding: '8px 18px 20px',
          maxHeight: 'calc(100dvh - 68px)',
          overflowY: 'auto',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {mobileLinks.map((link, i) => (
          <a
            key={link.href}
            href={link.href}
            onClick={e => { e.preventDefault(); handleLink(link.href); }}
            style={{
              display: 'block',
              padding: '13px 10px',
              fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500,
              color: '#FFF8EC', textDecoration: 'none',
              borderBottom: i < mobileLinks.length - 1
                ? '1px solid rgba(255,255,255,0.08)' : 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#D4AA45')}
            onMouseLeave={e => (e.currentTarget.style.color = '#FFF8EC')}
          >
            {link.label}
          </a>
        ))}

        {/* Reserve CTA */}
        <div style={{ paddingTop: '16px' }}>
          <button
            onClick={() => { close(); onReserve?.(); }}
            style={{
              display: 'block', width: '100%', textAlign: 'center',
              fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 800,
              letterSpacing: '0.10em', textTransform: 'uppercase',
              backgroundColor: '#D4AA45', color: '#2C0612',
              padding: '15px', borderRadius: '999px',
              boxShadow: '0 4px 14px rgba(212,170,69,0.28)',
              border: 'none', cursor: 'pointer',
            }}
          >
            Reservation Enquiry
          </button>
          <p style={{
            textAlign: 'center', marginTop: '8px',
            fontFamily: 'Inter, sans-serif', fontSize: '11px',
            color: 'rgba(255,248,236,0.40)', lineHeight: 1.5,
          }}>
            Requests are manually confirmed by our team.
          </p>
        </div>
      </div>

      {/* Height spacer so content clears fixed header */}
      <div style={{ height: '68px' }} aria-hidden="true" />
    </>
  );
}

function ReserveBtn({ className, onClick }: { className?: string; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      className={className}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        alignItems: 'center',
        fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 800,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        textDecoration: 'none',
        backgroundColor: hov ? '#C99A32' : '#D4AA45',
        color: '#2C0612',
        height: '40px', padding: '0 24px', borderRadius: '999px',
        boxShadow: hov ? '0 6px 18px rgba(201,154,50,0.40)' : '0 4px 14px rgba(212,170,69,0.30)',
        transition: 'background-color 0.20s, box-shadow 0.20s, transform 0.20s',
        transform: hov ? 'translateY(-1px)' : 'none',
        whiteSpace: 'nowrap',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      Reservation Enquiry
    </button>
  );
}
