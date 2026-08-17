'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MAIN_NAV, SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  }

  return (
    <>
      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Main Header */}
      <header
        className={cn(
          'sticky top-0 z-40 w-full bg-white transition-all duration-300',
          isScrolled ? 'header-scrolled' : 'border-b border-cream-200'
        )}
      >
        {/* Search overlay */}
        {isSearchOpen && (
          <div className="absolute inset-0 z-50 bg-white flex items-center px-4 sm:px-8">
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-3 max-w-2xl mx-auto">
              <Search className="h-5 w-5 text-dark-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search namkeen, sev, bhujia…"
                className="flex-1 font-body text-base text-dark-900 placeholder-dark-300 border-0 outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-cream-100 transition-colors"
                aria-label="Close search"
              >
                <X className="h-5 w-5 text-dark-600" />
              </button>
            </form>
          </div>
        )}

        <div className="container-brand">
          <div className="flex h-16 items-center justify-between gap-4 lg:h-18">
            {/* Logo */}
            <Link
              href="/"
              className="flex-shrink-0 flex flex-col leading-none"
              aria-label={`${SITE_NAME} - Home`}
            >
              <span className="font-display text-xl font-bold text-maroon-900 tracking-tight">
                Malwa
              </span>
              <span className="font-body text-[10px] font-semibold text-saffron-500 uppercase tracking-[0.15em]">
                Namkeen House
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
              {MAIN_NAV.map((link) => {
                const isActive = pathname === link.href;
                const hasChildren = link.children && link.children.length > 0;

                return (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => hasChildren && setOpenDropdown(link.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center gap-1 px-4 py-2 rounded-lg font-body text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'text-maroon-900 bg-maroon-50'
                          : 'text-dark-700 hover:text-maroon-900 hover:bg-cream-100'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {link.label}
                      {hasChildren && (
                        <ChevronDown
                          className={cn(
                            'h-3.5 w-3.5 transition-transform duration-200',
                            openDropdown === link.label && 'rotate-180'
                          )}
                        />
                      )}
                    </Link>

                    {/* Dropdown */}
                    {hasChildren && openDropdown === link.label && (
                      <div className="absolute left-0 top-full pt-1 z-50">
                        <div className="bg-white rounded-2xl shadow-float border border-cream-200 py-2 min-w-[200px]">
                          {link.children!.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block px-4 py-2.5 font-body text-sm text-dark-700 hover:text-maroon-900 hover:bg-cream-50 transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-cream-100 transition-colors text-dark-700 hover:text-maroon-900"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                aria-label={`Wishlist (${wishlistCount} items)`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-cream-100 transition-colors text-dark-700 hover:text-maroon-900"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-maroon-900 text-[10px] font-bold text-white">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                aria-label={`Cart (${itemCount} items)`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-cream-100 transition-colors text-dark-700 hover:text-maroon-900"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-maroon-900 text-[10px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* Account */}
              <Link
                href="/account"
                aria-label="My Account"
                className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full hover:bg-cream-100 transition-colors text-dark-700 hover:text-maroon-900"
              >
                <User className="h-5 w-5" />
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                className="flex lg:hidden h-10 w-10 items-center justify-center rounded-full hover:bg-cream-100 transition-colors text-dark-700"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            'lg:hidden border-t border-cream-200 bg-white overflow-hidden transition-all duration-300',
            isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <nav className="container-brand py-4 space-y-1">
            {MAIN_NAV.map((link) => (
              <div key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'flex items-center justify-between px-3 py-3 rounded-xl font-body text-base font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-maroon-50 text-maroon-900'
                      : 'text-dark-800 hover:bg-cream-100'
                  )}
                  onClick={() => !link.children && setIsMobileMenuOpen(false)}
                >
                  {link.label}
                  {link.children && <ChevronDown className="h-4 w-4" />}
                </Link>
                {link.children && (
                  <div className="ml-4 mt-1 space-y-1">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-2.5 rounded-lg font-body text-sm text-dark-600 hover:text-maroon-900 hover:bg-cream-50 transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-3 border-t border-cream-100">
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl font-body text-base text-dark-800 hover:bg-cream-100 transition-colors"
              >
                <User className="h-5 w-5" />
                My Account
              </Link>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
