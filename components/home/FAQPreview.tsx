import { getHomepageFAQs } from '@/data/faq';
import { Accordion } from '@/components/ui/Accordion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function FAQPreview() {
  const faqs = getHomepageFAQs();
  const items = faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }));

  return (
    <section className="section-padding bg-white" aria-label="Frequently asked questions">
      <div className="container-brand">
        <div className="max-w-3xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-10">
            <p className="font-body text-xs font-semibold text-saffron-600 uppercase tracking-[0.2em] mb-3">
              Got Questions?
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-dark-900 leading-tight">
              We&apos;ve Got
              <br />
              <span className="gradient-text">Answers.</span>
            </h2>
          </div>

          {/* Accordion */}
          <Accordion items={items} />

          {/* View all link */}
          <div className="text-center mt-8">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 font-body text-sm font-semibold text-maroon-900 hover:text-saffron-600 transition-colors"
            >
              View all FAQs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
