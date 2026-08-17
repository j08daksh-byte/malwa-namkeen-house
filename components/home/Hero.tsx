'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden bg-dark-950"
      aria-label="Hero section"
    >
      {/* Background Image with Premium Editorial Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1920&q=85"
          alt="Colorful Indian namkeen and snacks spread"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-50"
        />
        {/* Soft elegant gradient overlays for text legibility and editorial mood */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950/90 via-dark-950/70 to-dark-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/60 via-transparent to-dark-950/30" />
      </div>

      {/* Content */}
      <div className="container-brand relative z-10 py-24 lg:py-32 flex flex-col justify-center min-h-screen">
        <div className="max-w-2xl mt-12 sm:mt-0">
          {/* Eyebrow */}
          <div className="flex items-center gap-4 mb-8 animate-fade-up">
            <div className="h-px w-12 bg-saffron-500" />
            <span className="font-body text-xs sm:text-sm font-semibold text-saffron-400 uppercase tracking-[0.3em]">
              Authentic Taste of Malwa
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-medium text-white leading-[1.1] mb-8 animate-fade-up delay-100">
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
          <p className="font-body text-base sm:text-lg md:text-xl text-white/80 leading-relaxed mb-12 max-w-xl font-light tracking-wide animate-fade-up delay-200">
            Traditional namkeen and snacks, freshly packed with the flavour, crunch
            and warmth you grew up loving.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 animate-fade-up delay-300">
            <Button variant="secondary" size="lg" asChild className="w-full sm:w-auto text-base tracking-wide px-8">
              <Link href="/shop" className="flex items-center justify-center gap-2">
                Shop Namkeen
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              asChild
              className="w-full sm:w-auto text-base tracking-wide px-8 border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/60 transition-all duration-300"
            >
              <Link href="/categories" className="flex items-center justify-center">
                Explore Categories
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-5 mt-16 animate-fade-up delay-400">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-dark-950 bg-gradient-to-br from-saffron-500 to-maroon-800 flex items-center justify-center text-xs sm:text-sm font-medium text-white shadow-lg"
                >
                  {['P', 'R', 'K', 'M'][i - 1]}
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-gold-500 text-sm sm:text-base leading-none">★</span>
                ))}
                <span className="font-body text-sm sm:text-base font-medium text-white ml-1.5 leading-none mt-0.5">4.9</span>
              </div>
              <p className="font-body text-xs sm:text-sm text-white/70 tracking-wide mt-1">
                Loved by 10,000+ customers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade to seamlessly blend into the next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream-100 to-transparent z-10 pointer-events-none" />
    </section>
  );
}
