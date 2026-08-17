import { getHomepageFAQs } from '@/data/faq';
import { Accordion } from '@/components/ui/Accordion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function FAQPreview() {
  const faqs = getHomepageFAQs();
  const items = faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }));

  return (
    <section className="section-padding bg-cream-100/70 border-t border-cream-200/80" aria-label="Frequently asked questions">
      <div className="container-brand">
        <div className="max-w-3xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="section-heading">Answers & Details</span>
              <div className="h-px w-8 bg-saffron-500" />
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-dark-900 leading-tight">
              Frequently Asked <span className="font-serif italic text-maroon-900 font-normal">Questions</span>
            </h2>
          </div>

          {/* Accordion */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-200/80 shadow-card">
            <Accordion items={items} />
          </div>

          {/* View all link */}
          <div className="text-center mt-10">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 font-body text-xs font-bold uppercase tracking-widest text-maroon-900 hover:text-saffron-600 transition-colors group"
            >
              View Full Help Center <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
