import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function BrandStory() {
  return (
    <section
      className="section-padding bg-cream-100 overflow-hidden"
      aria-label="Our story"
    >
      <div className="container-brand">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image side */}
          <div className="relative order-2 lg:order-1">
            {/* Main image */}
            <div className="relative h-[420px] sm:h-[500px] rounded-3xl overflow-hidden img-zoom">
              <Image
                src="https://images.unsplash.com/photo-1607116667981-3d0d59f3fa53?w=900&q=85"
                alt="Traditional Indian namkeen being prepared by hand"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Floating accent card */}
            <div className="absolute -bottom-6 -right-4 sm:-right-8 glass rounded-2xl px-6 py-4 shadow-float border border-cream-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon-50">
                  <Heart className="h-5 w-5 text-maroon-900 fill-maroon-900" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-dark-900">3 Generations</p>
                  <p className="font-body text-xs text-dark-500">Of authentic recipes</p>
                </div>
              </div>
            </div>

            {/* Year badge */}
            <div className="absolute -top-4 -left-4 sm:-left-6 bg-maroon-900 text-cream-100 rounded-2xl px-5 py-3 shadow-float">
              <p className="font-display text-3xl font-bold">Est.</p>
              <p className="font-display text-3xl font-bold text-saffron-400">1987</p>
            </div>
          </div>

          {/* Text side */}
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-10 bg-saffron-500" />
              <span className="font-body text-xs font-semibold text-saffron-600 uppercase tracking-[0.2em]">
                Our Story
              </span>
            </div>

            <h2 className="font-display text-4xl sm:text-5xl font-bold text-dark-900 leading-tight mb-6">
              More Than Namkeen.
              <br />
              <span className="gradient-text">It&apos;s a Part of Home.</span>
            </h2>

            <div className="space-y-4 font-body text-dark-600 leading-relaxed">
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

            <div className="mt-8">
              <Button variant="outline" size="lg" asChild>
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
