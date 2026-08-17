import { Package, Award, Leaf, ShieldCheck } from 'lucide-react';
import { TRUST_ITEMS } from '@/lib/constants';

const icons = {
  package: Package,
  award: Award,
  leaf: Leaf,
  'shield-check': ShieldCheck,
};

export function TrustStrip() {
  return (
    <section
      className="bg-cream-50/80 border-y border-cream-200/70 py-7 lg:py-8"
      aria-label="Our brand standards"
    >
      <div className="container-brand">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-4 lg:gap-0 items-center">
          {TRUST_ITEMS.map((item, index) => {
            const Icon = icons[item.icon as keyof typeof icons] ?? Package;
            return (
              <div
                key={item.label}
                className={`flex items-center gap-3.5 px-3 sm:px-6 ${
                  index !== 0 ? 'lg:border-l lg:border-cream-200/80' : ''
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-cream-100 border border-cream-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <Icon className="h-4.5 w-4.5 text-maroon-850" strokeWidth={1.5} />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-display text-sm font-semibold text-dark-900 tracking-tight leading-snug">
                    {item.label}
                  </p>
                  <p className="font-body text-xs text-dark-500 font-light truncate mt-0.5">
                    {item.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
