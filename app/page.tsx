import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { TrustStrip } from '@/components/home/TrustStrip';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { Bestsellers } from '@/components/home/Bestsellers';
import { BrandStory } from '@/components/home/BrandStory';
import { MalwaSpecialities } from '@/components/home/MalwaSpecialities';
import { CustomerReviews } from '@/components/home/CustomerReviews';
import { InstagramSection } from '@/components/home/InstagramSection';
import { FAQPreview } from '@/components/home/FAQPreview';
import { FinalCTA } from '@/components/home/FinalCTA';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants';

export const metadata: Metadata = {
  title: `${SITE_NAME} — Authentic Malwa Namkeen & Snacks`,
  description: SITE_DESCRIPTION,
};

export default function HomePage() {
  return (
    <>
      {/* 01 — Hero */}
      <Hero />

      {/* 02 — Trust */}
      <TrustStrip />

      {/* 03 — Shop by Category */}
      <CategoryShowcase />

      {/* 04 — Bestsellers */}
      <Bestsellers />

      {/* 05 — Our Story */}
      <BrandStory />

      {/* 06 — The Taste of Malwa */}
      <MalwaSpecialities />

      {/* 07 — Customer Reviews */}
      <CustomerReviews />

      {/* 08 — Instagram */}
      <InstagramSection />

      {/* 09 — FAQ */}
      <FAQPreview />

      {/* 10 — Final CTA */}
      <FinalCTA />
    </>
  );
}
