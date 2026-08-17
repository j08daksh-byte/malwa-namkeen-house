'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionItem {
  id: string;
  question: string;
  answer: string | ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({ items, allowMultiple = false, className }: AccordionProps) {
  const [openIds, setOpenIds] = useState<string[]>([]);

  function toggle(id: string) {
    setOpenIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      return allowMultiple ? [...prev, id] : [id];
    });
  }

  return (
    <div className={cn('divide-y divide-cream-200', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left font-display font-semibold text-dark-900 hover:text-maroon-900 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-500 rounded-sm"
            >
              <span className="text-base leading-snug">{item.question}</span>
              <ChevronDown
                className={cn(
                  'h-5 w-5 flex-shrink-0 text-maroon-700 transition-transform duration-300',
                  isOpen && 'rotate-180'
                )}
              />
            </button>

            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="pb-5 pr-8 font-body text-dark-600 leading-relaxed text-[15px]">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
