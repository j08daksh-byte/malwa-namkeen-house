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
          <div className="absolute inset-0 z-50 bg-white flex items-center px-4 sm:px-8 border-b border-cream-200">
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-3 max-w-2xl mx-auto border-b border-dark-200 pb-2">
              <Search className="h-4 w-4 text-dark-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH NAMKEEN, SEV, BHUJIA…"
                className="flex-1 font-body text-sm uppercase tracking-wide text-dark-900 placeholder-dark-300 border-0 outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-cream-100 transition-colors"
                aria-label="Close search"
              >
                <X className="h-4 w-4 text-dark-600" />
              </button>
            </form>
          </div>
        )}

        <div className="container-brand">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex-shrink-0 flex flex-col items-center justify-center leading-none"
              aria-label={`${SITE_NAME} - Home`}
            >
              <span className="font-display text-2xl font-medium text-maroon-900 tracking-normal">
                Malwa
              </span>
              <span className="font-body text-[9px] font-semibold text-saffron-500 uppercase tracking-[0.25em] mt-1">
                Namkeen House
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
              {MAIN_NAV.map((link) => {
                const isActive = pathname === link.href;
                const hasChildren = link.children && link.children.length > 0;

                return (
                  <div
                    key={link.href}
                    className="relative py-5"
                    onMouseEnter={() => hasChildren && setOpenDropdown(link.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'group flex items-center gap-1 font-body text-[13px] font-medium uppercase tracking-wide transition-colors duration-200',
                        isActive
                          ? 'text-maroon-900'
                          : 'text-dark-700 hover:text-maroon-900'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="relative">
                        {link.label}
                        <span className={cn(
                          "absolute -bottom-1 left-0 w-full h-[1px] bg-maroon-900 transition-transform duration-300 origin-left",
                          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                        )} />
                      </span>
                      {hasChildren && (
                        <ChevronDown
                          className={cn(
                            'h-3 w-3 ml-0.5 transition-transform duration-200',
                            openDropdown === link.label && 'rotate-180'
                          )}
                        />
                      )}
                    </Link>

                    {/* Dropdown */}
                    {hasChildren && openDropdown === link.label && (
                      <div className="absolute left-0 top-full pt-0 z-50">
                        <div className="bg-white rounded-xl shadow-lg border border-cream-200 py-3 min-w-[200px]">
                          {link.children!.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block px-5 py-2 font-body text-[13px] uppercase tracking-wide text-dark-600 hover:text-maroon-900 hover:bg-cream-50 transition-colors"
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
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search"
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-cream-100 transition-colors text-dark-700 hover:text-maroon-900"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                aria-label={`Wishlist (${wishlistCount} items)`}
                className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-cream-100 transition-colors text-dark-700 hover:text-maroon-900"
              >
                <Heart className="h-4 w-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-maroon-900 text-[9px] font-bold text-white">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                aria-label={`Cart (${itemCount} items)`}
                className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-cream-100 transition-colors text-dark-700 hover:text-maroon-900"
              >
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-maroon-900 text-[9px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* Account */}
              <Link
                href="/account"
                aria-label="My Account"
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full hover:bg-cream-100 transition-colors text-dark-700 hover:text-maroon-900"
              >
                <User className="h-4 w-4" />
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                className="flex lg:hidden h-9 w-9 items-center justify-center rounded-full hover:bg-cream-100 transition-colors text-dark-700"
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
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
          <nav className="container-brand py-6 space-y-4">
            {MAIN_NAV.map((link) => (
              <div key={link.href} className="border-b border-cream-100 pb-4 last:border-0 last:pb-0">
                <Link
                  href={link.href}
                  className={cn(
                    'flex items-center justify-between font-body text-[13px] font-medium uppercase tracking-wide transition-colors',
                    pathname === link.href
                      ? 'text-maroon-900'
                      : 'text-dark-800'
                  )}
                  onClick={() => !link.children && setIsMobileMenuOpen(false)}
                >
                  {link.label}
                  {link.children && <ChevronDown className="h-4 w-4 text-dark-400" />}
                </Link>
                {link.children && (
                  <div className="ml-4 mt-4 space-y-3">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block font-body text-[13px] uppercase tracking-wide text-dark-500 hover:text-maroon-900 transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-4 mt-2">
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 font-body text-[13px] font-medium uppercase tracking-wide text-dark-800 transition-colors"
              >
                <User className="h-4 w-4" />
                My Account
              </Link>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
