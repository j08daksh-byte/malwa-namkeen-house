import React from 'react';
import { SkeletonStyles, SkeletonNavbar, SkeletonBox } from './SkeletonBase';

export default function AboutSkeleton() {
  return (
    <div className="malwa-skeleton-page" aria-label="Loading our story…">
      <SkeletonStyles />
      <SkeletonNavbar />

      <main style={{ maxWidth: '1160px', width: '100%', margin: '0 auto', padding: 'clamp(28px, 4vw, 56px) clamp(16px, 3vw, 32px)', boxSizing: 'border-box' }}>
        {/* Editorial Heritage Banner */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
          <SkeletonBox width="100px" height="14px" borderRadius="999px" style={{ margin: '0 auto 14px' }} />
          <SkeletonBox width="85%" height="38px" style={{ margin: '0 auto 16px' }} />
          <SkeletonBox width="95%" height="18px" style={{ margin: '0 auto 8px' }} />
          <SkeletonBox width="70%" height="18px" style={{ margin: '0 auto' }} />
        </div>

        {/* 2-Column Story Section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(28px, 5vw, 56px)',
            alignItems: 'center',
            marginBottom: '64px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SkeletonBox width="120px" height="14px" />
            <SkeletonBox width="85%" height="30px" />
            <SkeletonBox width="100%" height="16px" />
            <SkeletonBox width="98%" height="16px" />
            <SkeletonBox width="90%" height="16px" />
            <SkeletonBox width="100%" height="16px" />
            <SkeletonBox width="75%" height="16px" />
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <SkeletonBox width="100px" height="30px" borderRadius="999px" />
              <SkeletonBox width="110px" height="30px" borderRadius="999px" />
              <SkeletonBox width="90px" height="30px" borderRadius="999px" />
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              aspectRatio: '0.85 / 1',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#FFFFFF',
              border: '8px solid #FFF9EF',
              boxShadow: '0 12px 40px rgba(42, 0, 5, 0.12)',
            }}
          >
            <SkeletonBox width="100%" height="100%" borderRadius="0px" />
          </div>
        </div>

        {/* 3 Pillars / Values Shimmer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                padding: '28px',
                border: '1px solid rgba(200, 154, 61, 0.18)',
              }}
            >
              <SkeletonBox width="44px" height="44px" borderRadius="10px" style={{ marginBottom: '16px' }} />
              <SkeletonBox width="60%" height="20px" style={{ marginBottom: '10px' }} />
              <SkeletonBox width="100%" height="14px" style={{ marginBottom: '6px' }} />
              <SkeletonBox width="80%" height="14px" />
            </div>
          ))}
        </div>
      </main>

      <div className="malwa-skeleton-footer" />
    </div>
  );
}
