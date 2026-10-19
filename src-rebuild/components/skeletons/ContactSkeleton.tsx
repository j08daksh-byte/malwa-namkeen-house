import React from 'react';
import { SkeletonStyles, SkeletonNavbar, SkeletonBox } from './SkeletonBase';

export default function ContactSkeleton() {
  return (
    <div className="malwa-skeleton-page" aria-label="Loading contact details…">
      <SkeletonStyles />
      <SkeletonNavbar />

      <main style={{ maxWidth: '1160px', width: '100%', margin: '0 auto', padding: 'clamp(28px, 4vw, 56px) clamp(16px, 3vw, 32px)', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
          <SkeletonBox width="90px" height="14px" borderRadius="999px" style={{ margin: '0 auto 12px' }} />
          <SkeletonBox width="80%" height="36px" style={{ margin: '0 auto 14px' }} />
          <SkeletonBox width="90%" height="16px" style={{ margin: '0 auto' }} />
        </div>

        {/* 2-Column Contact Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(24px, 4vw, 48px)',
          }}
        >
          {/* Left: Store Info & Map */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: 'clamp(24px, 4vw, 36px)',
              border: '1px solid rgba(200, 154, 61, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <div>
              <SkeletonBox width="140px" height="20px" style={{ marginBottom: '12px' }} />
              <SkeletonBox width="100%" height="15px" style={{ marginBottom: '6px' }} />
              <SkeletonBox width="80%" height="15px" />
            </div>

            <div>
              <SkeletonBox width="100px" height="18px" style={{ marginBottom: '8px' }} />
              <SkeletonBox width="160px" height="22px" />
            </div>

            <div>
              <SkeletonBox width="110px" height="18px" style={{ marginBottom: '8px' }} />
              <SkeletonBox width="180px" height="15px" />
            </div>

            {/* Map Placeholder */}
            <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden' }}>
              <SkeletonBox width="100%" height="100%" borderRadius="0px" />
            </div>
          </div>

          {/* Right: Contact Form */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: 'clamp(24px, 4vw, 36px)',
              border: '1px solid rgba(200, 154, 61, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            <SkeletonBox width="160px" height="22px" style={{ marginBottom: '8px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <SkeletonBox width="60px" height="12px" style={{ marginBottom: '6px' }} />
                <SkeletonBox width="100%" height="44px" borderRadius="8px" />
              </div>
              <div>
                <SkeletonBox width="70px" height="12px" style={{ marginBottom: '6px' }} />
                <SkeletonBox width="100%" height="44px" borderRadius="8px" />
              </div>
            </div>

            <div>
              <SkeletonBox width="80px" height="12px" style={{ marginBottom: '6px' }} />
              <SkeletonBox width="100%" height="44px" borderRadius="8px" />
            </div>

            <div>
              <SkeletonBox width="70px" height="12px" style={{ marginBottom: '6px' }} />
              <SkeletonBox width="100%" height="100px" borderRadius="8px" />
            </div>

            <SkeletonBox width="160px" height="46px" borderRadius="10px" style={{ marginTop: '6px' }} />
          </div>
        </div>
      </main>

      <div className="malwa-skeleton-footer" />
    </div>
  );
}
