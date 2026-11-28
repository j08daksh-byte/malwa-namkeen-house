import React from 'react';
import { SkeletonStyles, SkeletonNavbar, SkeletonBox } from './SkeletonBase';

export function WishlistGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '24px',
      }}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid rgba(200, 154, 61, 0.2)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Square Image Shimmer with Heart */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1' }}>
            <SkeletonBox width="100%" height="100%" borderRadius="0px" />
            <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
              <SkeletonBox width="34px" height="34px" borderRadius="50%" />
            </div>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <SkeletonBox width="80%" height="20px" />
            <SkeletonBox width="50%" height="15px" />

            {/* Options shimmer */}
            <div style={{ display: 'flex', gap: '6px', margin: '8px 0' }}>
              <SkeletonBox width="60px" height="28px" borderRadius="6px" />
              <SkeletonBox width="60px" height="28px" borderRadius="6px" />
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <SkeletonBox width="60px" height="22px" />
              <SkeletonBox width="100px" height="36px" borderRadius="8px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WishlistSkeleton() {
  return (
    <div className="malwa-skeleton-page" aria-label="Loading wishlist…">
      <SkeletonStyles />
      <SkeletonNavbar />

      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: 'clamp(24px, 4vw, 48px) clamp(16px, 3vw, 40px)', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', borderBottom: '1px solid rgba(200, 154, 61, 0.25)', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <SkeletonBox width="240px" height="36px" />
            <SkeletonBox width="60px" height="24px" borderRadius="999px" />
          </div>
          <SkeletonBox width="450px" height="16px" />
        </div>

        {/* Saved Cards Grid */}
        <WishlistGridSkeleton count={6} />
      </main>

      <div className="malwa-skeleton-footer" />
    </div>
  );
}
