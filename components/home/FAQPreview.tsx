import { getHomepageFAQs } from '@/data/faq';
import { Accordion } from '@/components/ui/Accordion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function FAQPreview() {
  const faqs = getHomepageFAQs();
  const items = faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }));

  return (
    <section className="section-padding bg-cream-50/50" aria-label="Frequently asked questions">
      <div className="container-brand">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-3 mb-3">
              <span className="h-px w-8 bg-saffron-600" />
              <p className="font-body text-xs font-semibold text-saffron-700 uppercase tracking-[0.25em]">
                Common Inquiries
              </p>
              <span className="h-px w-8 bg-saffron-600" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-dark-900 leading-tight">
              Frequently Asked Questions
            </h2>
          </div>

          {/* Accordion */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-200/80 shadow-2xs">
            <Accordion items={items} />
          </div>

          {/* View all link */}
          <div className="text-center mt-10">
            <Link
              href="/faq"
              className="group inline-flex items-center gap-2 font-body text-xs font-semibold text-maroon-900 uppercase tracking-widest hover:text-saffron-600 transition-colors"
            >
              <span>View All Questions</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
