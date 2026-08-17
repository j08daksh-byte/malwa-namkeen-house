import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-maroon-900 py-20 lg:py-28" aria-label="Call to action">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1920&q=70"
          alt="Rich colourful namkeen spread"
          fill
          sizes="100vw"
          className="object-cover opacity-15"
        />
      </div>

      {/* Decorative glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-saffron-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #FFF8F0 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="container-brand relative z-10 text-center">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-10 bg-saffron-400/60" />
          <span className="font-body text-xs font-semibold text-saffron-400 uppercase tracking-[0.25em]">
            Ready to Taste Malwa?
          </span>
          <div className="h-px w-10 bg-saffron-400/60" />
        </div>

        {/* Headline */}
        <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 max-w-3xl mx-auto">
          Bring Home the
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #E8851C 0%, #C8972F 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Taste of Malwa.
          </span>
        </h2>

        {/* Description */}
        <p className="font-body text-base sm:text-lg text-cream-300 leading-relaxed mb-10 max-w-xl mx-auto">
          Fresh. Authentic. Delivered across India.
          Order today and taste the difference of real Malwa namkeen.
        </p>

        {/* CTA */}
        <Button variant="secondary" size="xl" asChild>
          <Link href="/shop" className="inline-flex items-center gap-2">
            Shop Namkeen <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 mt-12 flex-wrap">
          {[
            { value: '10,000+', label: 'Happy Customers' },
            { value: '4.9★', label: 'Average Rating' },
            { value: 'Free', label: 'Shipping ₹499+' },
            { value: 'Same Day', label: 'Dispatch' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-2xl font-bold text-saffron-400">{stat.value}</p>
              <p className="font-body text-xs text-cream-300/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
