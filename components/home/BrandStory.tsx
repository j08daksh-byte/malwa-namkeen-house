import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function BrandStory() {
  return (
    <section
      className="section-padding bg-cream-50 overflow-hidden"
      aria-label="Our story"
    >
      <div className="container-brand">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image side */}
          <div className="relative order-2 lg:order-1">
            {/* Main image */}
            <div className="relative h-[420px] sm:h-[500px] rounded-2xl overflow-hidden shadow-sm border border-cream-100">
              <Image
                src="https://images.unsplash.com/photo-1607116667981-3d0d59f3fa53?w=900&q=85"
                alt="Traditional Indian namkeen being prepared by hand"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Text side */}
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-maroon-800/30" />
              <span className="font-body text-xs font-semibold text-dark-600 uppercase tracking-widest">
                Our Story
              </span>
            </div>

            <h2 className="font-display text-4xl sm:text-5xl font-bold text-dark-900 leading-tight mb-8">
              More Than Namkeen.
              <br />
              <span className="italic font-normal text-maroon-900">It&apos;s a Part of Home.</span>
            </h2>

            <div className="space-y-5 font-body text-dark-600 leading-relaxed text-[15px]">
              <p>
                It started with a small stall in Indore&apos;s bustling Chappan Dukan —
                our grandfather, Shri Ramprasad Ji, frying the perfect Ratlami Sev
                from a recipe he had learned from his own father in Ratlam.
              </p>
              <p>
                Three generations later, the recipe hasn&apos;t changed. The oil is still
                groundnut. The spices are still hand-blended. The sev is still
                fried fresh every morning. What has changed is that now we can
                bring it to your doorstep, wherever in India you are.
              </p>
              <p>
                <span className="font-semibold text-dark-900">Malwa Namkeen House</span>{' '}
                is more than a snack brand. It is the taste of every childhood
                chai-time, every festive gathering, every moment worth sharing.
              </p>
            </div>

            <div className="mt-8 pt-2">
              <p className="font-body text-[11px] text-dark-500 uppercase tracking-widest mb-6 font-semibold">
                3 Generations · Est. 1987 · Indore, MP
              </p>
              <Button variant="outline" size="lg" className="border-dark-200 text-dark-900 hover:bg-dark-50" asChild>
                <Link href="/about" className="flex items-center gap-2">
                  Read Our Full Story <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
