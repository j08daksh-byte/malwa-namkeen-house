import Link from 'next/link';
import { FOOTER_LINKS, SITE_NAME, SITE_EMAIL, SITE_PHONE, SITE_WHATSAPP, TRUST_ITEMS } from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialIcons = {
    instagram: Instagram,
    facebook: Facebook,
    youtube: Youtube,
    'message-circle': MessageCircle,
  };

  return (
    <footer className="bg-dark-900 text-cream-100" aria-label="Site footer">
      {/* Trust Strip */}
      <div className="border-b border-dark-700">
        <div className="container-brand py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {TRUST_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-maroon-900/40 text-saffron-400">
                  <span className="text-lg">
                    {item.label === 'Freshly Packed' ? '📦' :
                     item.label === 'Authentic Taste' ? '⭐' :
                     item.label === 'Quality Ingredients' ? '🌿' : '🛡️'}
                  </span>
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-cream-100">{item.label}</p>
                  <p className="font-body text-xs text-dark-300">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-brand py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <div className="flex flex-col leading-none">
                <span className="font-display text-2xl font-bold text-white">Malwa</span>
                <span className="font-body text-xs font-semibold text-saffron-400 uppercase tracking-[0.15em]">
                  Namkeen House
                </span>
              </div>
            </Link>
            <p className="font-body text-sm text-dark-300 leading-relaxed max-w-xs mb-6">
              Traditional namkeen and snacks from the heart of Malwa. Authentic flavours, freshly packed, delivered across India.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { href: 'https://instagram.com/malwanamkeenhouse', label: 'Instagram', emoji: '📸' },
                { href: 'https://facebook.com/malwanamkeenhouse', label: 'Facebook', emoji: '👥' },
                { href: 'https://youtube.com/@malwanamkeenhouse', label: 'YouTube', emoji: '▶️' },
                { href: `https://wa.me/${SITE_WHATSAPP}`, label: 'WhatsApp', emoji: '💬' },
              ].map(({ href, label, emoji }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-dark-700 text-dark-300 hover:bg-maroon-900 hover:text-cream-100 transition-all duration-200 text-sm"
                >
                  {emoji}
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-display text-sm font-bold text-white mb-4 uppercase tracking-wide">Shop</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-dark-300 hover:text-saffron-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-display text-sm font-bold text-white mb-4 uppercase tracking-wide">Support</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-dark-300 hover:text-saffron-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-display text-sm font-bold text-white mb-4 uppercase tracking-wide">Company</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-dark-300 hover:text-saffron-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Contact */}
            <div className="mt-6 space-y-2">
              <h4 className="font-display text-xs font-bold text-white uppercase tracking-wide">Contact</h4>
              <a
                href={`mailto:${SITE_EMAIL}`}
                className="block font-body text-sm text-dark-300 hover:text-saffron-400 transition-colors"
              >
                {SITE_EMAIL}
              </a>
              <a
                href={`tel:${SITE_PHONE}`}
                className="block font-body text-sm text-dark-300 hover:text-saffron-400 transition-colors"
              >
                {SITE_PHONE}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-dark-700">
        <div className="container-brand py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-dark-400">
            © {currentYear} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="font-body text-xs text-dark-400 hover:text-saffron-400 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-body text-xs text-dark-500">FSSAI Lic. No.</span>
            <span className="font-body text-xs text-dark-400">23724001000001</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
