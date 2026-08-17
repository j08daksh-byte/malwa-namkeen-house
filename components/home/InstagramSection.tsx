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
    <section className="section-padding bg-cream-100" aria-label="Instagram gallery">
      <div className="container-brand">
        {/* Heading */}
        <div className="text-center mb-10">
          <p className="font-body text-xs font-semibold text-saffron-600 uppercase tracking-[0.2em] mb-3">
            Follow Us @malwanamkeenhouse
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-dark-900 leading-tight">
            A Little Namkeen.
            <br />
            <span className="gradient-text">A Lot of Memories.</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {instagramImages.map((img, i) => (
            <a
              key={i}
              href="https://instagram.com/malwanamkeenhouse"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View on Instagram: ${img.alt}`}
              className="group relative aspect-square rounded-xl overflow-hidden bg-cream-200 img-zoom"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-dark-950/0 group-hover:bg-dark-950/30 transition-colors duration-300 flex items-center justify-center">
                <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  📸
                </span>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="https://instagram.com/malwanamkeenhouse"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-maroon-900 hover:text-saffron-600 transition-colors"
          >
            Follow us on Instagram ↗
          </a>
        </div>
      </div>
    </section>
  );
}
