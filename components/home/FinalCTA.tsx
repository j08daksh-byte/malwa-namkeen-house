import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function FinalCTA() {
  return (
    <section
      className="relative overflow-hidden bg-maroon-950 py-24 lg:py-32 border-t border-maroon-900/40"
      aria-label="Call to action"
    >
      {/* Background image with cinematic mood */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1920&q=70"
          alt="Rich colourful namkeen spread"
          fill
          sizes="100vw"
          className="object-cover opacity-20 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-maroon-950/90 via-maroon-950/95 to-maroon-950" />
      </div>

      <div className="container-brand relative z-10 text-center max-w-3xl mx-auto">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-3 px-3.5 py-1 rounded-full bg-saffron-500/10 border border-saffron-400/20 backdrop-blur-sm mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-saffron-400 animate-pulse" />
          <span className="font-body text-xs font-semibold text-saffron-300 uppercase tracking-[0.25em]">
            Ready to Taste Malwa?
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal text-white leading-[1.1] mb-6">
          Bring Home the
          <br />
          <span className="italic text-saffron-300">Taste of Malwa.</span>
        </h2>

        {/* Description */}
        <p className="font-body text-base sm:text-lg text-cream-200/80 font-light leading-relaxed mb-10 max-w-xl mx-auto">
          Freshly fried in pure groundnut oil. Packaged crisp. Delivered to your doorstep across India.
        </p>

        {/* Primary CTA */}
        <div className="flex justify-center mb-16">
          <Button
            variant="secondary"
            size="lg"
            asChild
            className="group px-10 py-6 text-sm font-semibold tracking-widest uppercase shadow-xl shadow-saffron-950/40 hover:shadow-saffron-500/30"
          >
            <Link href="/shop" className="inline-flex items-center gap-3">
              <span>Shop Namkeen</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Quiet Trust Signals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 border-t border-white/10">
          {[
            { value: '10,000+', label: 'Happy Customers' },
            { value: '4.9★', label: 'Average Rating' },
            { value: 'Free', label: 'Shipping ₹499+' },
            { value: 'Same Day', label: 'Dispatch' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-2xl sm:text-3xl font-bold text-saffron-400">
                {stat.value}
              </p>
              <p className="font-body text-xs text-cream-300/70 mt-1 font-light tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

