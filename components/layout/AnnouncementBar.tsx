'use client';

import { useEffect, useState } from 'react';
import { ANNOUNCEMENTS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
        setVisible(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="bg-dark-900 text-cream-200 py-2 px-4 text-center"
      role="banner"
      aria-live="polite"
    >
      <p
        className={cn(
          'font-body text-[11px] font-medium tracking-wider transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      >
        {ANNOUNCEMENTS[currentIndex]}
      </p>
    </div>
  );
}
