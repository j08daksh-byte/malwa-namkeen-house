import React from 'react';
import { SkeletonStyles, SkeletonNavbar, SkeletonBox, SkeletonCircle } from './SkeletonBase';

export function DashboardContentSkeleton() {
  return (
    <div style={{ maxWidth: '1160px', width: '100%', margin: '0 auto', padding: 'clamp(24px, 4vw, 44px) clamp(16px, 3vw, 32px)', boxSizing: 'border-box' }} aria-hidden="true">
      {/* Welcome Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4A0512 0%, #2A0108 100%)',
          borderRadius: '16px',
          padding: 'clamp(20px, 3vw, 32px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '32px',
          boxShadow: '0 8px 30px rgba(42, 0, 5, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <SkeletonCircle size={56} style={{ background: 'rgba(255, 255, 255, 0.15)' }} />
          <div>
            <SkeletonBox width="180px" height="24px" className="malwa-skeleton-dark" style={{ marginBottom: '6px' }} />
            <SkeletonBox width="240px" height="14px" className="malwa-skeleton-dark" />
          </div>
        </div>
        <SkeletonBox width="130px" height="38px" borderRadius="999px" className="malwa-skeleton-dark" />
      </div>

      {/* Navigation Tabs Row */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '1px solid rgba(200, 154, 61, 0.25)',
          paddingBottom: '14px',
          marginBottom: '32px',
          overflowX: 'auto',
        }}
      >
        <SkeletonBox width="110px" height="36px" borderRadius="8px" />
        <SkeletonBox width="120px" height="36px" borderRadius="8px" />
        <SkeletonBox width="130px" height="36px" borderRadius="8px" />
        <SkeletonBox width="140px" height="36px" borderRadius="8px" />
      </div>

      {/* 3 Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '22px',
              border: '1px solid rgba(200, 154, 61, 0.18)',
              boxShadow: '0 4px 16px rgba(42, 0, 5, 0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <SkeletonCircle size={48} />
            <div style={{ flex: 1 }}>
              <SkeletonBox width="80px" height="13px" style={{ marginBottom: '8px' }} />
              <SkeletonBox width="50px" height="26px" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Section Shimmer */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(200, 154, 61, 0.2)',
          boxShadow: '0 4px 20px rgba(42, 0, 5, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <SkeletonBox width="160px" height="22px" />
          <SkeletonBox width="90px" height="14px" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '12px',
                background: '#FAF6EE',
                border: '1px solid rgba(200, 154, 61, 0.15)',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <SkeletonBox width="46px" height="46px" borderRadius="8px" />
                <div>
                  <SkeletonBox width="140px" height="16px" style={{ marginBottom: '6px' }} />
                  <SkeletonBox width="90px" height="12px" />
                </div>
              </div>
              <SkeletonBox width="90px" height="26px" borderRadius="999px" />
              <SkeletonBox width="80px" height="18px" />
              <SkeletonBox width="100px" height="36px" borderRadius="8px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="malwa-skeleton-page" aria-label="Loading your dashboard…">
      <SkeletonStyles />
      <SkeletonNavbar />
      <main style={{ flex: 1 }}>
        <DashboardContentSkeleton />
      </main>
      <div className="malwa-skeleton-footer" />
    </div>
  );
}
