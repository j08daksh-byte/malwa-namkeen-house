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
    <section className="bg-white border-t border-cream-200 py-6" aria-label="Our promises">
      <div className="container-brand">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
          {TRUST_ITEMS.map((item, index) => {
            const Icon = icons[item.icon as keyof typeof icons] ?? Package;
            return (
              <div
                key={item.label}
                className={`flex flex-col sm:flex-row items-center sm:items-start gap-2.5 text-center sm:text-left ${
                  index > 0 ? 'lg:border-l lg:border-cream-200 lg:pl-8' : ''
                }`}
              >
                <Icon className="h-5 w-5 text-maroon-900 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="font-display text-[13px] font-bold text-dark-900">{item.label}</p>
                  <p className="font-body text-[11px] text-dark-500 mt-0.5">{item.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
