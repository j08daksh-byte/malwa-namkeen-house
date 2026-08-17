'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Hero() {
  return (
    <section
      className="relative min-h-[90vh] flex items-center overflow-hidden bg-dark-950"
      aria-label="Hero section"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1920&q=85"
          alt="Colorful Indian namkeen and snacks spread"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/60 via-transparent to-transparent" />
      </div>

      {/* Decorative pattern */}
      <div
        className="absolute inset-0 z-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #E8851C 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Content */}
      <div className="container-brand relative z-10 py-20 lg:py-28">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6 animate-fade-up">
            <div className="h-px w-10 bg-saffron-500" />
            <span className="font-body text-xs font-semibold text-saffron-400 uppercase tracking-[0.25em]">
              Authentic Taste of Malwa
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6 animate-fade-up delay-100">
            A Taste of{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #E8851C 0%, #C8972F 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Malwa,
            </span>
            <br />
            Made to Share.
          </h1>

          {/* Description */}
          <p className="font-body text-base sm:text-lg text-dark-200 leading-relaxed mb-10 max-w-xl animate-fade-up delay-200">
            Traditional namkeen and snacks, freshly packed with the flavour, crunch
            and warmth you grew up loving.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 animate-fade-up delay-300">
            <Button variant="secondary" size="lg" asChild>
              <Link href="/shop" className="flex items-center gap-2">
                Shop Namkeen
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild
              className="border-white/40 text-white hover:bg-white/10 hover:text-white hover:border-white/60"
            >
              <Link href="/categories">
                Explore Categories
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-6 mt-12 animate-fade-up delay-400">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-9 w-9 rounded-full border-2 border-dark-900 bg-gradient-to-br from-saffron-400 to-maroon-700 flex items-center justify-center text-xs font-bold text-white"
                >
                  {['P', 'R', 'K', 'M'][i - 1]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-gold-500 text-sm">★</span>
                ))}
                <span className="font-body text-sm font-semibold text-white ml-1">4.9</span>
              </div>
              <p className="font-body text-xs text-dark-300">
                Loved by 10,000+ customers across India
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-cream-100 to-transparent z-10" />
    </section>
  );
}
