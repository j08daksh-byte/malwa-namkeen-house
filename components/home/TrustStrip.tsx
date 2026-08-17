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
    <section className="bg-white border-b border-cream-200 py-8" aria-label="Our promises">
      <div className="container-brand">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {TRUST_ITEMS.map((item, index) => {
            const Icon = icons[item.icon as keyof typeof icons] ?? Package;
            return (
              <div
                key={item.label}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left"
              >
                <div className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-full bg-maroon-50">
                  <Icon className="h-5 w-5 text-maroon-900" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-dark-900">{item.label}</p>
                  <p className="font-body text-xs text-dark-500 mt-0.5">{item.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
