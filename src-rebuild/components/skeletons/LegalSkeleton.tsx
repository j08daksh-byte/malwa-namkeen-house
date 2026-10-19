import React from 'react';
import { SkeletonStyles, SkeletonNavbar, SkeletonBox } from './SkeletonBase';

export default function LegalSkeleton() {
  return (
    <div className="malwa-skeleton-page" aria-label="Loading policy document…">
      <SkeletonStyles />
      <SkeletonNavbar />

      <main style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: 'clamp(28px, 4vw, 56px) clamp(16px, 3vw, 32px)', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px', borderBottom: '1px solid rgba(200, 154, 61, 0.25)', paddingBottom: '24px' }}>
          <SkeletonBox width="100px" height="20px" borderRadius="999px" style={{ marginBottom: '12px' }} />
          <SkeletonBox width="60%" height="36px" style={{ marginBottom: '10px' }} />
          <SkeletonBox width="200px" height="14px" />
        </div>

        {/* 2-Column Legal Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '36px',
            alignItems: 'start',
          }}
        >
          {/* Left: Table of Contents */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid rgba(200, 154, 61, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <SkeletonBox width="120px" height="18px" style={{ marginBottom: '6px' }} />
            <SkeletonBox width="90%" height="14px" />
            <SkeletonBox width="80%" height="14px" />
            <SkeletonBox width="85%" height="14px" />
            <SkeletonBox width="70%" height="14px" />
          </div>

          {/* Right: Body Text Blocks */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: 'clamp(24px, 4vw, 40px)',
              border: '1px solid rgba(200, 154, 61, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              flex: 2,
            }}
          >
            <SkeletonBox width="45%" height="22px" style={{ marginBottom: '4px' }} />
            <SkeletonBox width="100%" height="15px" />
            <SkeletonBox width="98%" height="15px" />
            <SkeletonBox width="92%" height="15px" />
            <SkeletonBox width="70%" height="15px" style={{ marginBottom: '16px' }} />

            <SkeletonBox width="40%" height="22px" style={{ marginBottom: '4px' }} />
            <SkeletonBox width="100%" height="15px" />
            <SkeletonBox width="96%" height="15px" />
            <SkeletonBox width="88%" height="15px" />
          </div>
        </div>
      </main>

      <div className="malwa-skeleton-footer" />
    </div>
  );
}
