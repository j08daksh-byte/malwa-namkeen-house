import React from 'react';
import { SkeletonStyles, SkeletonNavbar, SkeletonBox, SkeletonCircle } from './SkeletonBase';

export default function AccountSkeleton() {
  return (
    <div className="malwa-skeleton-page" aria-label="Loading account portal…">
      <SkeletonStyles />
      <SkeletonNavbar />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px, 6vw, 64px) 16px' }}>
        <div
          style={{
            maxWidth: '440px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: 'clamp(24px, 5vw, 40px)',
            boxShadow: '0 16px 48px rgba(42, 0, 5, 0.08)',
            border: '1px solid rgba(200, 154, 61, 0.22)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box',
          }}
          aria-hidden="true"
        >
          {/* Logo / Crest Shimmer */}
          <SkeletonCircle size={56} style={{ marginBottom: '16px' }} />
          <SkeletonBox width="180px" height="24px" style={{ marginBottom: '8px' }} />
          <SkeletonBox width="260px" height="14px" style={{ marginBottom: '28px' }} />

          {/* Mode Tabs Shimmer */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              background: '#F6EFE3',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '24px',
              boxSizing: 'border-box',
            }}
          >
            <SkeletonBox width="50%" height="36px" borderRadius="8px" />
            <SkeletonBox width="50%" height="36px" borderRadius="8px" style={{ background: 'transparent' }} />
          </div>

          {/* Input Fields Shimmer */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            <div>
              <SkeletonBox width="80px" height="12px" style={{ marginBottom: '6px' }} />
              <SkeletonBox width="100%" height="46px" borderRadius="10px" />
            </div>
            <div>
              <SkeletonBox width="70px" height="12px" style={{ marginBottom: '6px' }} />
              <SkeletonBox width="100%" height="46px" borderRadius="10px" />
            </div>
          </div>

          {/* Remember me & Forgot row */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <SkeletonBox width="110px" height="14px" />
            <SkeletonBox width="110px" height="14px" />
          </div>

          {/* Primary Action Button */}
          <SkeletonBox width="100%" height="48px" borderRadius="10px" style={{ marginBottom: '18px' }} />

          {/* Divider */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0 20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(200, 154, 61, 0.25)' }} />
            <SkeletonBox width="30px" height="12px" />
            <div style={{ flex: 1, height: '1px', background: 'rgba(200, 154, 61, 0.25)' }} />
          </div>

          {/* Social Sign In Button */}
          <SkeletonBox width="100%" height="46px" borderRadius="10px" />
        </div>
      </main>

      <div className="malwa-skeleton-footer" />
    </div>
  );
}
