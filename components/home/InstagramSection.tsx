import Image from 'next/image';

const instagramImages = [
  { src: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80', alt: 'Namkeen in bowl' },
  { src: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&q=80', alt: 'Bhujia close-up' },
  { src: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', alt: 'Colourful snacks' },
  { src: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80', alt: 'Sev in hands' },
  { src: 'https://images.unsplash.com/photo-1607116667981-3d0d59f3fa53?w=600&q=80', alt: 'Traditional food prep' },
  { src: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80', alt: 'Spiced snacks' },
];

export function InstagramSection() {
  return (
    <section className="section-padding bg-cream-50 border-t border-cream-200/80" aria-label="Instagram gallery">
      <div className="container-brand">
        {/* Heading */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="section-heading">@malwanamkeenhouse</span>
            <div className="h-px w-8 bg-saffron-500" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-dark-900 leading-tight">
            Visual Journal — <span className="font-serif italic text-maroon-900 font-normal">Chai & Crunch</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {instagramImages.map((img, i) => (
            <a
              key={i}
              href="https://instagram.com/malwanamkeenhouse"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View on Instagram: ${img.alt}`}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-cream-200 shadow-card hover:shadow-float transition-all duration-300 hover:-translate-y-1 border border-cream-300/50"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 640px) 50vw, 16vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Subtle Dark Overlay on Hover */}
              <div className="absolute inset-0 bg-dark-950/0 group-hover:bg-dark-950/40 transition-all duration-300 flex items-center justify-center">
                <span className="text-white text-xs font-body font-bold opacity-0 group-hover:opacity-100 transition-opacity tracking-wider uppercase bg-maroon-900/90 px-3 py-1.5 rounded-full border border-gold-500/30">
                  View Story ↗
                </span>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="https://instagram.com/malwanamkeenhouse"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-body text-xs font-bold uppercase tracking-widest text-maroon-900 hover:text-saffron-600 border border-maroon-900/20 px-6 py-3 rounded-xl bg-white hover:bg-cream-100 transition-all shadow-sm"
          >
            Follow @malwanamkeenhouse on Instagram ↗
          </a>
        </div>
      </div>
    </section>
  );
}
