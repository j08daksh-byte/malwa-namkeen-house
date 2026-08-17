import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SITE_NAME } from '@/lib/constants';

export const metadata = {
  title: `Page Not Found | ${SITE_NAME}`,
};

export default function NotFound() {
  return (
    <div className="bg-cream-100 min-h-[70vh] flex items-center justify-center py-16">
      <div className="container-brand max-w-xl">
        <EmptyState
          emoji="🥨"
          title="Product or Page Not Found"
          description="The namkeen or page you are looking for doesn't exist or has been moved. Explore our fresh collection!"
          action={{
            label: 'Explore All Namkeen',
            href: '/shop',
          }}
        />
      </div>
    </div>
  );
}
