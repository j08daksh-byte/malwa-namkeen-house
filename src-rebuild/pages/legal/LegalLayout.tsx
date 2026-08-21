import type { ReactNode } from 'react';
import LegalHeader from '../../components/layout/LegalHeader';
import SEOHead from '../../components/seo/SEOHead';

interface Props {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export default function LegalLayout({ title, lastUpdated, children }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#FFF8EC', fontFamily: 'Inter, Georgia, serif' }}>
      <SEOHead
        title={title}
        description={`Legal terms and policies for Malwa Namkeen House — ${title}.`}
        canonicalPath={typeof window !== 'undefined' ? window.location.pathname : ''}
      />
      <style>{`
        .legal-shell {
          max-width: 760px;
          margin: 0 auto;
          padding: clamp(36px, 6vw, 60px) clamp(16px, 5vw, 40px) clamp(60px, 8vw, 100px);
          box-sizing: border-box;
          width: 100%;
        }
        .legal-body h2 {
          font-size: 16px; font-weight: 700; color: #1A0A0F;
          margin: 32px 0 10px; border-top: 1px solid #EDE0CC;
          padding-top: 20px;
        }
        .legal-body h2:first-child { border-top: none; padding-top: 0; margin-top: 0; }
        .legal-body p  { font-size: 14.5px; color: #374151; line-height: 1.78; margin: 0 0 14px; }
        .legal-body ul { padding-left: 22px; margin: 0 0 14px; }
        .legal-body li { font-size: 14.5px; color: #374151; line-height: 1.78; margin-bottom: 6px; }
        .legal-body a  { color: #3C0815; font-weight: 600; }
        .legal-body strong { color: #1A0A0F; }
        @media (max-width: 480px) {
          .legal-body h2 { font-size: 15px; }
          .legal-body p, .legal-body li { font-size: 14px; }
        }
      `}</style>

      <LegalHeader pageTitle={title} />

      <div className="legal-shell">
        {/* Page heading */}
        <div style={{ marginBottom: '36px', borderBottom: '2px solid #E8D5B7', paddingBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, color: '#1A0A0F', lineHeight: 1.2 }}>{title}</h1>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#9CA3AF' }}>Last updated: {lastUpdated}</p>
        </div>

        <div className="legal-body">
          {children}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '52px', paddingTop: '20px', borderTop: '1px solid #E8D5B7', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="/" style={{ fontSize: '13px', color: '#9CA3AF', textDecoration: 'none' }}>← Back to Malwa Namkeen House</a>
          {/* Temporary template — pending final legal review. */}
          <p style={{ fontSize: '11.5px', color: '#C4B49A', fontStyle: 'italic', margin: 0 }}>
            These pages are working drafts and are pending final legal review. They do not constitute professional legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}
