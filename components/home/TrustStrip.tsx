import { Package, Award, Leaf, ShieldCheck } from 'lucide-react';
import { TRUST_ITEMS } from '@/lib/constants';

const icons = {
  package:      Package,
  award:        Award,
  leaf:         Leaf,
  'shield-check': ShieldCheck,
};

export function TrustStrip() {
  return (
    <section className="bg-cream-50 border-y border-cream-300/60 py-7" aria-label="Our promises">
      <div className="container-brand">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
          {TRUST_ITEMS.map((item, index) => {
            const Icon = icons[item.icon as keyof typeof icons] ?? Package;
            return (
              <div
                key={item.label}
                className={`flex flex-col sm:flex-row items-center sm:items-start gap-3.5 text-center sm:text-left ${
                  index > 0 ? 'lg:border-l lg:border-cream-300/70 lg:pl-8' : ''
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-cream-200/70 flex items-center justify-center shrink-0 border border-gold-500/20">
                  <Icon className="h-4 w-4 text-maroon-900" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-dark-900 tracking-wide">{item.label}</p>
                  <p className="font-body text-xs text-dark-600 mt-0.5 font-light">{item.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
