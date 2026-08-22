import { useNavigate } from 'react-router-dom';

interface Props {
  pageTitle: string;
}

export default function LegalHeader({ pageTitle }: Props) {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        .lh-root {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 200;
          height: 68px;
          background-color: #55000A;
          border-bottom: 1px solid rgba(200,154,61,0.28);
          box-shadow: 0 6px 18px rgba(35,3,10,0.16);
          display: flex;
          align-items: center;
        }
        .lh-inner {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 clamp(12px, 3vw, 48px);
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          box-sizing: border-box;
        }
        .lh-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          flex-shrink: 0;
          gap: 12px;
          cursor: pointer;
        }
        .lh-logo img {
          height: 38px;
          width: auto;
          max-width: 150px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .lh-sep {
          width: 1px;
          height: 20px;
          background: rgba(200,154,61,0.30);
          flex-shrink: 0;
        }
        .lh-page-name {
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,249,239,0.52);
          letter-spacing: 0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: clamp(80px, 28vw, 260px);
        }
        .lh-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          text-decoration: none;
          color: rgba(255,249,239,0.85);
          height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(200,154,61,0.30);
          white-space: nowrap;
          flex-shrink: 0;
          background: transparent;
          cursor: pointer;
          transition: color 0.18s, border-color 0.18s, background 0.18s;
        }
        .lh-back:hover {
          color: #D4AA45;
          border-color: rgba(212,170,69,0.60);
          background: rgba(212,170,69,0.08);
        }
        .lh-back svg {
          flex-shrink: 0;
        }
        .lh-back-text-short {
          display: none;
        }

        /* Mobile ≤ 540px: hide separator + page name to avoid overflow */
        @media (max-width: 540px) {
          .lh-sep, .lh-page-name { display: none; }
          .lh-logo img { height: 34px; max-width: 130px; }
          .lh-back {
            font-size: 11px;
            padding: 0 10px;
            height: 34px;
          }
        }
        @media (max-width: 380px) {
          .lh-back-text-full { display: none; }
          .lh-back-text-short { display: inline; }
          .lh-logo img { height: 30px; max-width: 110px; }
        }
      `}</style>

      <header className="lh-root" role="banner">
        <div className="lh-inner">

          {/* Logo + breadcrumb */}
          <div
            className="lh-logo"
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            role="button"
            tabIndex={0}
            aria-label="MALWA NAMKEEN HOUSE — back to home"
          >
            <img
              src="/logo-nav-maroon.png"
              alt="MALWA NAMKEEN HOUSE"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="lh-sep" aria-hidden="true" />
            <span className="lh-page-name">{pageTitle}</span>
          </div>

          {/* Back button */}
          <button
            type="button"
            className="lh-back"
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label="Back to Website"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="lh-back-text-full">Back to Website</span>
            <span className="lh-back-text-short">Back</span>
          </button>

        </div>
      </header>

      {/* Spacer so content clears the fixed header */}
      <div style={{ height: '68px' }} aria-hidden="true" />
    </>
  );
}
