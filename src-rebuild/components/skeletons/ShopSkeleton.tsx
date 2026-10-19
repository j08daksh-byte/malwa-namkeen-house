import React from 'react';
import { SkeletonStyles, SkeletonNavbar, SkeletonBox, SkeletonCircle } from './SkeletonBase';

export function ProductCardSkeleton() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid rgba(200, 154, 61, 0.16)',
        boxShadow: '0 4px 16px rgba(42, 0, 5, 0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      aria-hidden="true"
    >
      {/* 1:1 Square Image Shimmer */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1' }}>
        <SkeletonBox width="100%" height="100%" borderRadius="0px" />
        <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
          <SkeletonBox width="64px" height="22px" borderRadius="999px" />
        </div>
      </div>

      {/* Info Block */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <SkeletonBox width="45%" height="13px" />
        <SkeletonBox width="88%" height="20px" />
        <SkeletonBox width="65%" height="14px" />

        {/* Variant chips shimmer */}
        <div style={{ display: 'flex', gap: '6px', margin: '8px 0 4px' }}>
          <SkeletonBox width="52px" height="26px" borderRadius="6px" />
          <SkeletonBox width="52px" height="26px" borderRadius="6px" />
          <SkeletonBox width="52px" height="26px" borderRadius="6px" />
        </div>

        {/* Price & Add to Cart button */}
        <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SkeletonBox width="60px" height="24px" />
          <SkeletonBox width="96px" height="38px" borderRadius="8px" />
        </div>
      </div>
    </div>
  );
}

export default function ShopSkeleton() {
  return (
    <div className="malwa-skeleton-page" aria-label="Loading shop delicacies…">
      <SkeletonStyles />
      <SkeletonNavbar />

      <main style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: 'clamp(20px, 3vw, 40px) clamp(16px, 3vw, 32px)', boxSizing: 'border-box' }}>
        {/* Breadcrumb & Header */}
        <div style={{ marginBottom: '24px' }}>
          <SkeletonBox width="140px" height="14px" style={{ marginBottom: '10px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <SkeletonBox width="260px" height="34px" style={{ marginBottom: '8px' }} />
              <SkeletonBox width="380px" height="16px" />
            </div>
            <SkeletonBox width="180px" height="42px" borderRadius="8px" />
          </div>
        </div>

        {/* Category Shortcuts Row */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '16px',
            marginBottom: '32px',
          }}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 16px 8px 8px',
                background: '#FFFFFF',
                borderRadius: '999px',
                border: '1px solid rgba(200, 154, 61, 0.18)',
                flexShrink: 0,
              }}
            >
              <SkeletonCircle size={38} />
              <SkeletonBox width="80px" height="14px" />
            </div>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '28px',
            padding: '14px 18px',
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid rgba(200, 154, 61, 0.16)',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <SkeletonBox width="70px" height="32px" borderRadius="999px" />
            <SkeletonBox width="60px" height="32px" borderRadius="999px" />
            <SkeletonBox width="75px" height="32px" borderRadius="999px" />
            <SkeletonBox width="80px" height="32px" borderRadius="999px" />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <SkeletonBox width="110px" height="32px" borderRadius="6px" />
            <SkeletonBox width="140px" height="32px" borderRadius="6px" />
          </div>
        </div>

        {/* Product Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {Array.from({ length: 8 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      </main>

      <div className="malwa-skeleton-footer" />
    </div>
  );
}
