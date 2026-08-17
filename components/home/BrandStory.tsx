import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function BrandStory() {
  return (
    <section
      className="section-padding bg-cream-100/90 overflow-hidden border-t border-cream-200/80"
      aria-label="Our story"
    >
      <div className="container-brand">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image side with Heritage Framing */}
          <div className="relative order-2 lg:order-1">
            <div className="relative h-[440px] sm:h-[520px] rounded-3xl overflow-hidden shadow-float border border-gold-500/20">
              <Image
                src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=900&q=85"
                alt="Traditional Ratlami Sev preparation by hand"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950/60 via-transparent to-transparent" />
              
              {/* Floating Heritage Badge */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-gold-500/30 shadow-lg flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-dark-900 text-sm">Chappan Dukan Heritage</p>
                  <p className="font-body text-xs text-dark-600 mt-0.5">Hand-blended spices & groundnut oil since 1987</p>
                </div>
                <span className="font-display text-2xl font-bold text-maroon-900">1987</span>
              </div>
            </div>
          </div>

          {/* Text side */}
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-10 bg-saffron-500" />
              <span className="section-heading">Our Heritage</span>
            </div>

            <h2 className="font-display text-4xl sm:text-5xl font-bold text-dark-900 leading-tight mb-8">
              More Than Namkeen.
              <br />
              <span className="font-serif italic font-normal text-maroon-900">It&apos;s a Part of Home.</span>
            </h2>

            <div className="space-y-5 font-body text-dark-700 leading-relaxed text-base sm:text-lg font-light">
              <p>
                It started with a small stall in Indore&apos;s bustling Chappan Dukan —
                our grandfather, Shri Ramprasad Ji, frying the perfect Ratlami Sev
                from a recipe he learned from his father in Ratlam.
              </p>
              <p>
                Three generations later, the recipe remains uncompromised. The oil is strictly
                groundnut. The spices are hand-blended in small batches. The sev is fried
                fresh every single morning.
              </p>
              <p className="font-normal text-dark-900">
                <span className="font-bold text-maroon-900">Malwa Namkeen House</span>{' '}
                brings the warmth of childhood chai-time and festive gatherings straight to your doorstep across India.
              </p>
            </div>

            <div className="mt-9 pt-2 flex flex-col sm:flex-row sm:items-center gap-6">
              <Button variant="outline" size="lg" className="border-maroon-900 text-maroon-900 hover:bg-maroon-900 hover:text-white transition-all duration-300" asChild>
                <Link href="/about" className="flex items-center gap-2 group">
                  Read Our Full Story <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <span className="font-body text-xs text-dark-500 uppercase tracking-widest font-semibold border-l-2 border-saffron-500 pl-4">
                3 Generations · Est. 1987 · Indore, MP
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
