import Link from 'next/link';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { FOOTER_LINKS, SITE_NAME, SITE_EMAIL, SITE_PHONE, SITE_WHATSAPP, SITE_ADDRESS } from '@/lib/constants';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { href: 'https://instagram.com/malwanamkeenhouse', label: 'Instagram', Icon: InstagramIcon },
    { href: 'https://facebook.com/malwanamkeenhouse', label: 'Facebook', Icon: FacebookIcon },
    { href: 'https://youtube.com/@malwanamkeenhouse', label: 'YouTube', Icon: YoutubeIcon },
    { href: `https://wa.me/${SITE_WHATSAPP}`, label: 'WhatsApp', Icon: WhatsAppIcon },
  ];

  return (
    <footer className="bg-gradient-to-b from-dark-950 via-dark-900 to-black text-cream-100 border-t border-dark-800" aria-label="Site footer">
      {/* Main Footer */}
      <div className="container-brand pt-20 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block mb-6">
              <div className="flex flex-col leading-none">
                <span className="font-display text-3xl font-extrabold text-white tracking-tight">
                  Malwa
                </span>
                <span className="font-body text-[11px] font-semibold text-saffron-400 uppercase tracking-[0.25em] mt-1">
                  Namkeen House
                </span>
              </div>
            </Link>
            <p className="font-body text-sm text-dark-300 leading-relaxed max-w-xs mb-8 font-light">
              Traditional namkeen and snacks from the heart of Malwa. Authentic
              flavours, freshly hand-blended and packed, delivered across India.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-dark-700 bg-dark-900 text-dark-300 hover:bg-saffron-500 hover:border-saffron-500 hover:text-dark-950 transition-all duration-300 shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div className="lg:col-span-2">
            <h3 className="font-body text-xs font-bold text-saffron-400 mb-6 uppercase tracking-[0.2em]">
              Shop
            </h3>
            <ul className="space-y-3.5">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-dark-300 hover:text-white transition-colors duration-200 font-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="lg:col-span-2">
            <h3 className="font-body text-xs font-bold text-saffron-400 mb-6 uppercase tracking-[0.2em]">
              Help
            </h3>
            <ul className="space-y-3.5">
              {FOOTER_LINKS.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-dark-300 hover:text-white transition-colors duration-200 font-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="lg:col-span-2">
            <h3 className="font-body text-xs font-bold text-saffron-400 mb-6 uppercase tracking-[0.2em]">
              Company
            </h3>
            <ul className="space-y-3.5">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-dark-300 hover:text-white transition-colors duration-200 font-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-2">
            <h3 className="font-body text-xs font-bold text-saffron-400 mb-6 uppercase tracking-[0.2em]">
              Connect
            </h3>
            <div className="space-y-4">
              <a
                href={`mailto:${SITE_EMAIL}`}
                className="flex items-start gap-2.5 font-body text-xs text-dark-300 hover:text-white transition-colors duration-200 font-light"
              >
                <Mail className="h-4 w-4 text-saffron-400 shrink-0 mt-0.5" />
                <span>{SITE_EMAIL}</span>
              </a>
              <a
                href={`tel:${SITE_PHONE}`}
                className="flex items-start gap-2.5 font-body text-xs text-dark-300 hover:text-white transition-colors duration-200 font-light"
              >
                <Phone className="h-4 w-4 text-saffron-400 shrink-0 mt-0.5" />
                <span>{SITE_PHONE}</span>
              </a>
              <div className="flex items-start gap-2.5 font-body text-xs text-dark-400 font-light">
                <MapPin className="h-4 w-4 text-dark-500 shrink-0 mt-0.5" />
                <span>{SITE_ADDRESS}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-dark-800/80 bg-black/40">
        <div className="container-brand py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-dark-400 font-light">
            © {currentYear} {SITE_NAME}. Handcrafted in Indore, MP. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="font-body text-xs text-dark-400 hover:text-cream-200 transition-colors duration-200 font-light"
              >
                {item}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-dark-900 px-3 py-1 rounded-full border border-dark-800">
            <span className="font-body text-[11px] font-semibold text-saffron-400">FSSAI Lic:</span>
            <span className="font-body text-[11px] text-dark-300 tracking-wider">23724001000001</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
