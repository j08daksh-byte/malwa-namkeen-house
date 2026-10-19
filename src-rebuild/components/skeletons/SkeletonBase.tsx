import React from 'react';

export const skeletonStyles = `
  @keyframes malwaShimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .malwa-skeleton-block {
    background: linear-gradient(
      90deg,
      #EFE9DE 0%,
      #FBF8F2 35%,
      #EFE9DE 70%
    );
    background-size: 200% 100%;
    animation: malwaShimmer 1.7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    border-radius: 8px;
    display: inline-block;
  }

  .malwa-skeleton-dark {
    background: linear-gradient(
      90deg,
      #35050E 0%,
      #4C0D18 35%,
      #35050E 70%
    );
    background-size: 200% 100%;
    animation: malwaShimmer 1.7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  .malwa-skeleton-page {
    background: var(--bg-parchment, #F6EFE3);
    min-height: 100vh;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .malwa-skeleton-nav {
    height: 70px;
    background: #55000A;
    border-bottom: 1px solid rgba(200, 154, 61, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 clamp(16px, 4vw, 40px);
    box-sizing: border-box;
    width: 100%;
  }

  .malwa-skeleton-footer {
    height: 160px;
    background: #35050E;
    margin-top: auto;
    border-top: 1px solid rgba(200, 154, 61, 0.2);
  }
`;

export function SkeletonStyles() {
  return <style>{skeletonStyles}</style>;
}

export function SkeletonNavbar() {
  return (
    <header className="malwa-skeleton-nav" aria-hidden="true">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          className="malwa-skeleton-block malwa-skeleton-dark"
          style={{ width: '130px', height: '36px', borderRadius: '6px' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div
          className="malwa-skeleton-block malwa-skeleton-dark"
          style={{ width: '60px', height: '16px', borderRadius: '4px' }}
        />
        <div
          className="malwa-skeleton-block malwa-skeleton-dark"
          style={{ width: '50px', height: '16px', borderRadius: '4px' }}
        />
        <div
          className="malwa-skeleton-block malwa-skeleton-dark"
          style={{ width: '65px', height: '16px', borderRadius: '4px' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          className="malwa-skeleton-block malwa-skeleton-dark"
          style={{ width: '32px', height: '32px', borderRadius: '50%' }}
        />
        <div
          className="malwa-skeleton-block malwa-skeleton-dark"
          style={{ width: '32px', height: '32px', borderRadius: '50%' }}
        />
        <div
          className="malwa-skeleton-block malwa-skeleton-dark"
          style={{ width: '36px', height: '32px', borderRadius: '18px' }}
        />
      </div>
    </header>
  );
}

export function SkeletonBox({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  style = {},
  className = '',
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`malwa-skeleton-block ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCircle({
  size = 40,
  style = {},
}: {
  size?: number | string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="malwa-skeleton-block"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
