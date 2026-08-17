'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  emoji,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-20 px-6',
        className
      )}
    >
      {/* Illustration */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-cream-100">
        {emoji ? (
          <span className="text-5xl">{emoji}</span>
        ) : icon ? (
          <span className="text-maroon-300">{icon}</span>
        ) : null}
      </div>

      <h3 className="font-display text-xl font-bold text-dark-900 mb-2">{title}</h3>
      {description && (
        <p className="font-body text-dark-500 text-sm max-w-xs">{description}</p>
      )}

      {action && (
        <div className="mt-6">
          {action.href ? (
            <Button variant="primary" size="md" asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
