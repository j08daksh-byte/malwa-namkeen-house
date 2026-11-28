import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import LegalHeader from '../../components/layout/LegalHeader';
import SEOHead from '../../components/seo/SEOHead';

interface Props {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export default function LegalLayout({ title, lastUpdated, children }: Props) {
  const navigate = useNavigate();

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
          padding: clamp(28px, 5vw, 56px) clamp(16px, 4vw, 36px) calc(48px + env(safe-area-inset-bottom, 0px));
          box-sizing: border-box;
          width: 100%;
        }
        .legal-body {
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .legal-body h2 {
          font-size: 16px; font-weight: 700; color: #1A0A0F;
          margin: 28px 0 10px; border-top: 1px solid #EDE0CC;
          padding-top: 18px;
        }
        .legal-body h2:first-child { border-top: none; padding-top: 0; margin-top: 0; }
        .legal-body p  { font-size: 14.5px; color: #374151; line-height: 1.75; margin: 0 0 14px; }
        .legal-body ul { padding-left: 20px; margin: 0 0 14px; }
        .legal-body li { font-size: 14.5px; color: #374151; line-height: 1.75; margin-bottom: 6px; }
        .legal-body a  { color: #55000A; font-weight: 600; text-decoration: underline; }
        .legal-body strong { color: #1A0A0F; }
        @media (max-width: 480px) {
          .legal-body h2 { font-size: 15px; margin-top: 22px; }
          .legal-body p, .legal-body li { font-size: 14px; }
        }
      `}</style>

      <LegalHeader pageTitle={title} />

      <div className="legal-shell">
        {/* Page heading */}
        <div style={{ marginBottom: '28px', borderBottom: '2px solid #E8D5B7', paddingBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, color: '#1A0A0F', lineHeight: 1.2 }}>{title}</h1>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#9CA3AF' }}>Last updated: {lastUpdated}</p>
        </div>

        <div className="legal-body">
          {children}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '44px', paddingTop: '20px', borderTop: '1px solid #E8D5B7', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              fontSize: '13px',
              color: '#55000A',
              fontWeight: 600,
              textDecoration: 'none',
              background: 'none',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            ← Back to Malwa Namkeen House
          </button>
          <p style={{ fontSize: '11.5px', color: '#A8977F', fontStyle: 'italic', margin: 0 }}>
            These pages are working drafts and are pending final legal review. They do not constitute professional legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}
