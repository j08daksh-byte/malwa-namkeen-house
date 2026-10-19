import React from 'react';
import { SkeletonStyles, SkeletonNavbar, SkeletonBox } from './SkeletonBase';

export default function FAQSkeleton() {
  return (
    <div className="malwa-skeleton-page" aria-label="Loading FAQ answers…">
      <SkeletonStyles />
      <SkeletonNavbar />

      <main style={{ maxWidth: '860px', width: '100%', margin: '0 auto', padding: 'clamp(28px, 4vw, 56px) clamp(16px, 3vw, 32px)', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <SkeletonBox width="110px" height="14px" borderRadius="999px" style={{ margin: '0 auto 12px' }} />
          <SkeletonBox width="75%" height="36px" style={{ margin: '0 auto 14px' }} />
          <SkeletonBox width="85%" height="16px" style={{ margin: '0 auto' }} />
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '36px',
          }}
        >
          <SkeletonBox width="80px" height="34px" borderRadius="999px" />
          <SkeletonBox width="110px" height="34px" borderRadius="999px" />
          <SkeletonBox width="95px" height="34px" borderRadius="999px" />
          <SkeletonBox width="120px" height="34px" borderRadius="999px" />
        </div>

        {/* Accordions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(200, 154, 61, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <SkeletonBox width={`${60 + (i % 3) * 12}%`} height="18px" />
              <SkeletonBox width="20px" height="20px" borderRadius="4px" />
            </div>
          ))}
        </div>
      </main>

      <div className="malwa-skeleton-footer" />
    </div>
  );
}
