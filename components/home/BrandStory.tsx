import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function BrandStory() {
  return (
    <section
      className="section-padding bg-cream-100/40 relative overflow-hidden"
      aria-label="Our story"
    >
      <div className="container-brand relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Visual Side (5 cols on lg) */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Primary Image Container with Editorial Border */}
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl shadow-maroon-950/10 border-4 border-white">
                <Image
                  src="https://images.unsplash.com/photo-1607116667981-3d0d59f3fa53?w=900&q=85"
                  alt="Traditional Indian namkeen being prepared by hand in Indore"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover transition-transform duration-700 ease-out hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/60 via-transparent to-transparent opacity-60" />
              </div>

              {/* Heritage Stamp / Badge */}
              <div className="absolute -bottom-6 -right-4 sm:-right-6 bg-dark-950 text-cream-50 p-5 rounded-2xl border border-saffron-500/30 shadow-2xl backdrop-blur-md max-w-[200px]">
                <p className="font-display text-2xl font-bold text-saffron-400 leading-none">
                  Est. 1987
                </p>
                <div className="h-px w-8 bg-saffron-500/40 my-2" />
                <p className="font-body text-[11px] text-cream-200/80 font-light leading-snug">
                  Chappan Dukan, Indore · 3 Generations of Authentic Recipes
                </p>
              </div>
            </div>
          </div>

          {/* Narrative Side (7 cols on lg) */}
          <div className="lg:col-span-7 order-1 lg:order-2 lg:pl-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-10 bg-saffron-600" />
              <span className="font-body text-xs font-semibold text-saffron-700 uppercase tracking-[0.25em]">
                Our Heritage & Craft
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-normal text-dark-900 leading-[1.12] mb-8">
              More Than Namkeen.
              <br />
              <span className="italic font-normal text-maroon-900">
                It&apos;s a Part of Home.
              </span>
            </h2>

            <div className="space-y-5 font-body text-dark-600 text-sm sm:text-base font-light leading-relaxed">
              <p>
                It started with a humble stall in Indore&apos;s bustling Chappan Dukan —
                our grandfather, <strong className="font-semibold text-dark-900">Shri Ramprasad Ji</strong>,
                frying the perfect Ratlami Sev from a treasured family recipe learned from his own father in Ratlam.
              </p>
              <p>
                Three generations later, the craft remains unchanged. The oil is strictly 100% pure groundnut. The spices are hand-pounded and blended in-house. Every batch of sev and bhujia is fried fresh daily with unwavering attention to aroma, texture, and crunch.
              </p>
              <p>
                <strong className="font-semibold text-dark-900">Malwa Namkeen House</strong> brings the unmistakable warmth of traditional Malwa hospitality directly to your doorstep, anywhere across India.
              </p>
            </div>

            {/* Micro Metadata Strip & CTA */}
            <div className="mt-10 pt-8 border-t border-cream-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <p className="font-body text-[11px] font-semibold text-dark-400 uppercase tracking-widest">
                  Heritage Standard
                </p>
                <p className="font-display text-base font-medium text-dark-900 mt-0.5">
                  100% Pure Groundnut Oil · No Artificial Preservatives
                </p>
              </div>

              <Button
                variant="outline"
                size="md"
                asChild
                className="group border-dark-900/20 text-dark-900 hover:bg-dark-900 hover:text-cream-50 transition-all duration-300"
              >
                <Link href="/about" className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                  <span>Read Full Story</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
