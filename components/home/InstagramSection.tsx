import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const journalImages = [
  { src: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80', alt: 'Fresh namkeen in artisanal bowl', label: 'Chai Time Rituals' },
  { src: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&q=80', alt: 'Crispy bhujia close-up texture', label: 'Golden Crunch' },
  { src: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', alt: 'Festive colourful Indian snack spread', label: 'Festive Spreads' },
  { src: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80', alt: 'Freshly fried sev in hands', label: 'Handcrafted Daily' },
  { src: 'https://images.unsplash.com/photo-1607116667981-3d0d59f3fa53?w=600&q=80', alt: 'Traditional spice blending and food prep', label: 'Indore Kitchen' },
  { src: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80', alt: 'Aromatic spiced Malwa dalmoth and snacks', label: 'Aromatic Spices' },
];

export function InstagramSection() {
  return (
    <section className="section-padding bg-white" aria-label="Visual journal">
      <div className="container-brand">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8 bg-saffron-600" />
              <p className="font-body text-xs font-semibold text-saffron-700 uppercase tracking-[0.25em]">
                The Malwa Journal
              </p>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-dark-900 leading-tight">
              Moments, Traditions & Daily Craft
            </h2>
          </div>
          <a
            href="https://instagram.com/malwanamkeenhouse"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 font-body text-xs font-semibold text-maroon-900 uppercase tracking-widest hover:text-saffron-600 transition-colors"
          >
            <span>@malwanamkeenhouse</span>
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        {/* Visual Journal Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {journalImages.map((img, i) => (
            <a
              key={i}
              href="https://instagram.com/malwanamkeenhouse"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View on Instagram: ${img.alt}`}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-cream-100 border border-cream-200/60 shadow-2xs"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              {/* Overlay with subtle branding */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-dark-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5">
                <div className="self-end">
                  <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    <InstagramIcon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div>
                  <p className="font-body text-[11px] font-medium text-cream-100 leading-tight">
                    {img.label}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
