import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-maroon-950 via-maroon-900 to-dark-950 py-24 lg:py-32 border-t border-maroon-800/50" aria-label="Call to action">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1920&q=70"
          alt="Rich colorful namkeen spread"
          fill
          sizes="100vw"
          className="object-cover opacity-25 object-center mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-maroon-950/80" />
      </div>

      <div className="container-brand relative z-10 text-center">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-10 bg-saffron-500/60" />
          <span className="font-body text-xs font-semibold text-saffron-400 uppercase tracking-[0.25em]">
            Ready to Experience Malwa?
          </span>
          <div className="h-px w-10 bg-saffron-500/60" />
        </div>

        {/* Headline */}
        <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 max-w-3xl mx-auto">
          Bring Home the{' '}
          <span className="font-serif italic font-normal text-saffron-400">
            Taste of Malwa.
          </span>
        </h2>

        {/* Description */}
        <p className="font-body text-base sm:text-xl text-cream-200/90 leading-relaxed mb-12 max-w-xl mx-auto font-light">
          Traditional flavours. Hand-blended spices. Freshly packed and delivered across India.
        </p>

        {/* CTA */}
        <Button variant="secondary" size="xl" asChild className="px-10 py-4 shadow-glow">
          <Link href="/shop" className="inline-flex items-center gap-3 group text-base sm:text-lg">
            Shop Namkeen Collection <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>

        {/* Trust signals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto mt-16 pt-12 border-t border-cream-100/10">
          {[
            { value: '10,000+', label: 'Happy Customers' },
            { value: '4.9 ★', label: 'Average Rating' },
            { value: 'FREE', label: 'Shipping Above ₹499' },
            { value: '24 hrs', label: 'Fresh Dispatch' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-saffron-400">{stat.value}</p>
              <p className="font-body text-xs text-cream-200/80 mt-1 font-light">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
