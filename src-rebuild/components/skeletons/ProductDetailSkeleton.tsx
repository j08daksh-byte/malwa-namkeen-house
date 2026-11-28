import React from 'react';
import { SkeletonStyles, SkeletonNavbar, SkeletonBox } from './SkeletonBase';

export default function ProductDetailSkeleton() {
  return (
    <div className="malwa-skeleton-page" aria-label="Loading delicacy details…">
      <SkeletonStyles />
      <SkeletonNavbar />

      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: 'clamp(24px, 4vw, 48px) clamp(16px, 3vw, 32px)', boxSizing: 'border-box' }}>
        {/* Breadcrumb shimmer */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <SkeletonBox width="60px" height="14px" />
          <SkeletonBox width="14px" height="14px" />
          <SkeletonBox width="90px" height="14px" />
          <SkeletonBox width="14px" height="14px" />
          <SkeletonBox width="120px" height="14px" />
        </div>

        {/* 2-Column Product Detail Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(28px, 5vw, 56px)',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Gallery */}
          <div>
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1 / 1',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#FFFFFF',
                border: '1px solid rgba(200, 154, 61, 0.2)',
                boxShadow: '0 8px 30px rgba(42, 0, 5, 0.06)',
              }}
            >
              <SkeletonBox width="100%" height="100%" borderRadius="0px" />
            </div>

            {/* Thumbnail Row */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(200, 154, 61, 0.2)',
                  }}
                >
                  <SkeletonBox width="100%" height="100%" borderRadius="0px" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Details & Purchase */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Category tag & Badge */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <SkeletonBox width="90px" height="24px" borderRadius="999px" />
              <SkeletonBox width="110px" height="24px" borderRadius="999px" />
            </div>

            {/* Title & Tagline */}
            <SkeletonBox width="75%" height="38px" style={{ margin: '4px 0' }} />
            <SkeletonBox width="50%" height="22px" />
            <SkeletonBox width="95%" height="16px" />
            <SkeletonBox width="85%" height="16px" />

            {/* Price Row */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', margin: '8px 0' }}>
              <SkeletonBox width="90px" height="36px" />
              <SkeletonBox width="60px" height="20px" />
              <SkeletonBox width="70px" height="22px" borderRadius="6px" />
            </div>

            {/* Weight selector pills */}
            <div style={{ marginTop: '8px' }}>
              <SkeletonBox width="120px" height="14px" style={{ marginBottom: '10px' }} />
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <SkeletonBox width="95px" height="42px" borderRadius="10px" />
                <SkeletonBox width="95px" height="42px" borderRadius="10px" />
                <SkeletonBox width="95px" height="42px" borderRadius="10px" />
              </div>
            </div>

            {/* Quantity Stepper & Add to Bag CTA */}
            <div style={{ display: 'flex', gap: '14px', marginTop: '14px', alignItems: 'center' }}>
              <SkeletonBox width="110px" height="48px" borderRadius="10px" />
              <SkeletonBox width="200px" height="48px" borderRadius="10px" />
            </div>

            {/* Trust Badges Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                padding: '16px',
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid rgba(200, 154, 61, 0.16)',
                marginTop: '16px',
              }}
            >
              <SkeletonBox width="100%" height="40px" borderRadius="8px" />
              <SkeletonBox width="100%" height="40px" borderRadius="8px" />
              <SkeletonBox width="100%" height="40px" borderRadius="8px" />
            </div>

            {/* Accordion Shimmers */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SkeletonBox width="100%" height="52px" borderRadius="8px" />
              <SkeletonBox width="100%" height="52px" borderRadius="8px" />
              <SkeletonBox width="100%" height="52px" borderRadius="8px" />
            </div>
          </div>
        </div>
      </main>

      <div className="malwa-skeleton-footer" />
    </div>
  );
}
