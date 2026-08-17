import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const specialities = [
  {
    name: 'Ratlami Sev',
    description:
      'The crown jewel of Malwa. Bold, thick, spiced with black pepper and cloves — a taste unique to Ratlam that has conquered India.',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
    href: '/product/ratlami-sev',
    badge: '#1 Bestseller',
  },
  {
    name: 'Indore Mixture',
    description:
      'A riot of textures and flavours — sev, dal, peanuts, curry leaves — balanced with the signature Indori masala that has no equal.',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
    href: '/product/indori-mixture',
    badge: 'City Classic',
  },
  {
    name: 'Classic Bhujia',
    description:
      'Moth bean flour fried into hair-thin golden strands that melt on the tongue. Light yet deeply satisfying. The perfect everyday snack.',
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&q=80',
    href: '/product/classic-bhujia',
    badge: '1000+ Reviews',
  },
];

export function MalwaSpecialities() {
  return (
    <section
      className="relative section-padding overflow-hidden bg-dark-950"
      aria-label="The flavours that define us"
    >
      <div className="container-brand relative z-10">
        {/* Heading */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-10 bg-saffron-500" />
            <span className="font-body text-xs font-semibold text-saffron-400 uppercase tracking-[0.2em]">
              The Taste of Malwa
            </span>
            <div className="h-px w-10 bg-saffron-500" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight">
            <span className="text-white">The Flavours That</span>
            <br />
            <span className="text-cream-200">Define Us</span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-7">
          {specialities.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group relative rounded-2xl overflow-hidden bg-dark-800 border border-dark-700 hover:border-dark-500 transition-colors duration-300 card-lift"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />

                {/* Badge */}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-saffron-500/90 text-white font-body text-xs font-semibold">
                    {item.badge}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-saffron-400 transition-colors">
                  {item.name}
                </h3>
                <p className="font-body text-sm text-dark-300 leading-relaxed mb-4">
                  {item.description}
                </p>
                <div className="flex items-center gap-1.5 font-body text-sm font-semibold text-saffron-400 group-hover:gap-3 transition-all duration-200">
                  Order Now <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
