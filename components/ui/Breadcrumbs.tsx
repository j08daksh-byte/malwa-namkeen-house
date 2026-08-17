'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 font-body text-sm', className)}
    >
      <Link
        href="/"
        className="flex items-center text-dark-400 hover:text-maroon-900 transition-colors"
        aria-label="Home"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-dark-300 flex-shrink-0" />
            {isLast || !item.href ? (
              <span
                className={cn(
                  'font-medium',
                  isLast ? 'text-maroon-900' : 'text-dark-400'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-dark-400 hover:text-maroon-900 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
