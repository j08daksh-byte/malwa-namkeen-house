'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Hero() {
  return (
    <section
      className="relative min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden bg-dark-950"
      aria-label="Hero section"
    >
      {/* Background Image with Controlled Editorial Lighting */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1920&q=85"
          alt="Authentic Malwa Ratlami Sev and Namkeen spread"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center sm:object-right opacity-70 scale-100 transition-transform duration-1000 ease-out"
        />
        {/* Layered directional gradients: deep contrast for text on left, rich food visibility on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/80 to-dark-950/30 lg:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-dark-950/40" />
        {/* Subtle warm ambient radial highlight */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Content Container */}
      <div className="container-brand relative z-10 py-28 lg:py-36 flex flex-col justify-center min-h-[90vh] lg:min-h-screen">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-3.5 px-3.5 py-1.5 rounded-full bg-dark-900/80 border border-saffron-500/30 backdrop-blur-md mb-8 animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-saffron-400 animate-pulse" />
            <span className="font-body text-xs font-semibold text-saffron-300 uppercase tracking-[0.25em]">
              Authentic Taste of Malwa
            </span>
          </div>

          {/* Editorial Headline */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] font-normal text-white leading-[1.08] tracking-tight mb-7 animate-fade-up delay-100">
            A Taste of{' '}
            <span className="italic font-normal text-saffron-300 underline decoration-saffron-500/40 decoration-1 underline-offset-8">
              Malwa,
            </span>
            <br />
            Made to Share.
          </h1>

          {/* Supporting Editorial Paragraph */}
          <p className="font-body text-base sm:text-lg md:text-xl text-cream-200/85 leading-relaxed mb-10 max-w-xl font-light tracking-wide animate-fade-up delay-200">
            Traditional namkeen and snacks, freshly packed with the authentic flavour,
            artisanal crunch, and warmth you grew up loving.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5 animate-fade-up delay-300">
            <Button
              variant="secondary"
              size="lg"
              asChild
              className="group text-sm font-semibold tracking-wider uppercase px-8 shadow-lg shadow-saffron-900/20 hover:shadow-saffron-500/20"
            >
              <Link href="/shop" className="flex items-center justify-center gap-2.5">
                Shop Namkeen
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="text-sm font-semibold tracking-wider uppercase px-8 border-cream-200/40 text-cream-100 bg-dark-900/40 backdrop-blur-sm hover:bg-white/10 hover:border-white hover:text-white transition-all duration-300"
            >
              <Link href="/categories" className="flex items-center justify-center">
                Explore Categories
              </Link>
            </Button>
          </div>

          {/* Editorial Social Proof Badging */}
          <div className="flex items-center gap-5 mt-14 pt-8 border-t border-white/10 max-w-lg animate-fade-up delay-400">
            <div className="flex -space-x-2.5">
              {[
                { initial: 'P', bg: 'from-saffron-500 to-amber-700' },
                { initial: 'R', bg: 'from-amber-600 to-maroon-700' },
                { initial: 'K', bg: 'from-maroon-600 to-dark-900' },
                { initial: 'M', bg: 'from-saffron-600 to-maroon-800' },
              ].map((avatar, i) => (
                <div
                  key={i}
                  className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-dark-950 bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-xs font-semibold text-white shadow-md`}
                >
                  {avatar.initial}
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-gold-400 text-sm leading-none">★</span>
                ))}
                <span className="font-body text-sm font-bold text-white ml-1.5 leading-none">4.9 / 5.0</span>
              </div>
              <p className="font-body text-xs text-cream-300/70 tracking-wide mt-0.5">
                Loved by 10,000+ namkeen enthusiasts across India
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seamless bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream-100 via-cream-100/40 to-transparent z-10 pointer-events-none" />
    </section>
  );
}
