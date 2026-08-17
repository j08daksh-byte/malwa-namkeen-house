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
      {/* Background Image with Rich Appetite-Driven Lighting */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1920&q=85"
          alt="Authentic Malwa Ratlami Sev and Namkeen spread"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-75 transition-transform duration-1000 scale-105"
        />
        {/* Controlled gradient overlay: dark left for crisp text contrast, open right for luminous food texture */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950/95 via-dark-950/65 to-dark-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-dark-950/30" />
      </div>

      {/* Content */}
      <div className="container-brand relative z-10 py-20 lg:py-32 flex flex-col justify-center min-h-[90vh] lg:min-h-screen">
        <div className="max-w-2xl mt-8 sm:mt-0">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6 animate-fade-up">
            <div className="h-px w-10 bg-saffron-500" />
            <span className="font-body text-xs sm:text-sm font-semibold text-saffron-400 uppercase tracking-[0.25em]">
              Authentic Taste of Malwa
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[4.75rem] font-medium text-white leading-[1.08] mb-7 animate-fade-up delay-100">
            A Taste of{' '}
            <span className="font-serif italic text-saffron-400 font-normal">
              Malwa,
            </span>
            <br />
            Made to Share.
          </h1>

          {/* Description */}
          <p className="font-body text-base sm:text-lg md:text-xl text-cream-200/90 leading-relaxed mb-10 max-w-xl font-light tracking-wide animate-fade-up delay-200">
            Traditional namkeen and snacks, freshly packed with the flavour, crunch
            and warmth you grew up loving.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 animate-fade-up delay-300">
            <Button variant="secondary" size="lg" asChild className="text-base tracking-wide px-8 shadow-glow">
              <Link href="/shop" className="flex items-center justify-center gap-2 group">
                Shop Namkeen
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              asChild
              className="text-base tracking-wide px-8 border-cream-100/30 text-cream-100 hover:bg-white/10 hover:text-white hover:border-cream-100/60 transition-all duration-300"
            >
              <Link href="/categories" className="flex items-center justify-center">
                Explore Categories
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4 mt-12 sm:mt-16 animate-fade-up delay-400">
            <div className="flex -space-x-2.5">
              {['P', 'R', 'K', 'M'].map((letter, i) => (
                <div
                  key={i}
                  className="h-9 w-9 sm:h-11 sm:w-11 rounded-full border-2 border-dark-950 bg-gradient-to-br from-saffron-500 to-maroon-900 flex items-center justify-center text-xs sm:text-sm font-semibold text-white shadow-md"
                >
                  {letter}
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1 mb-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-gold-400 text-sm sm:text-base leading-none">★</span>
                ))}
                <span className="font-body text-sm sm:text-base font-bold text-white ml-1.5 leading-none">4.9</span>
              </div>
              <p className="font-body text-xs sm:text-sm text-cream-200/70 tracking-wide">
                Loved by 10,000+ authentic snack lovers across India
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade into section break */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-cream-100 to-transparent z-10 pointer-events-none" />
    </section>
  );
}
