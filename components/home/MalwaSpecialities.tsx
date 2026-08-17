import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

const specialities = [
  {
    name: 'Ratlami Sev',
    description:
      'The crown jewel of Malwa. Bold, thick, spiced with black pepper and cloves — a taste unique to Ratlam that has conquered India.',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
    href: '/product/ratlami-sev',
    badge: '#1 Bestseller',
    origin: 'Ratlam Heritage',
  },
  {
    name: 'Indore Mixture',
    description:
      'A riot of textures and flavours — sev, dal, peanuts, curry leaves — balanced with the signature Indori masala that has no equal.',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
    href: '/product/indori-mixture',
    badge: 'City Classic',
    origin: 'Indore Recipe',
  },
  {
    name: 'Classic Bhujia',
    description:
      'Moth bean flour fried into hair-thin golden strands that melt on the tongue. Light yet deeply satisfying. The perfect everyday snack.',
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&q=80',
    href: '/product/classic-bhujia',
    badge: '1000+ Reviews',
    origin: 'Traditional Blend',
  },
];

export function MalwaSpecialities() {
  return (
    <section
      className="relative section-padding overflow-hidden bg-[#180407] border-y border-maroon-950/60"
      aria-label="The flavours that define us"
    >
      {/* Subtle warm glow background effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-maroon-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-saffron-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-brand relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 lg:mb-16">
          <div className="inline-flex items-center gap-3 px-3.5 py-1 rounded-full bg-saffron-500/10 border border-saffron-400/20 backdrop-blur-sm mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-saffron-400" />
            <span className="font-body text-xs font-semibold text-saffron-300 uppercase tracking-[0.25em]">
              The Taste of Malwa
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-normal text-white leading-tight mb-4">
            The Flavours That{' '}
            <span className="italic text-saffron-300">Define Us</span>
          </h2>
          <p className="font-body text-sm sm:text-base text-cream-200/75 font-light leading-relaxed">
            Three iconic creations carrying decades of culinary pride from the streets of Ratlam and Indore to your family table.
          </p>
        </div>

        {/* Signature Campaign Showcase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {specialities.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group relative flex flex-col rounded-2xl overflow-hidden bg-dark-950/80 border border-white/10 hover:border-saffron-500/40 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-maroon-950/70"
            >
              {/* Image Container */}
              <div className="relative aspect-[16/11] overflow-hidden bg-dark-900">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent opacity-85" />

                {/* Top Badge */}
                <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-saffron-500/90 backdrop-blur-md text-white font-body text-[11px] font-bold tracking-wider uppercase shadow-xs">
                    {item.badge}
                  </span>
                </div>

                <div className="absolute top-3.5 right-3.5">
                  <span className="font-body text-[10px] uppercase tracking-widest text-cream-300/80 px-2.5 py-1 rounded-full bg-dark-950/60 backdrop-blur-md border border-white/10">
                    {item.origin}
                  </span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6 sm:p-7 flex flex-col flex-1">
                <h3 className="font-display text-2xl font-normal text-white mb-2.5 group-hover:text-saffron-300 transition-colors">
                  {item.name}
                </h3>
                <p className="font-body text-xs sm:text-sm text-cream-200/70 font-light leading-relaxed mb-6 flex-1">
                  {item.description}
                </p>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between font-body text-xs font-semibold text-saffron-300 uppercase tracking-wider group-hover:text-white transition-colors">
                  <span>Order Fresh Batch</span>
                  <div className="h-7 w-7 rounded-full bg-saffron-500/20 group-hover:bg-saffron-500 group-hover:text-dark-950 flex items-center justify-center transition-all duration-300">
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
