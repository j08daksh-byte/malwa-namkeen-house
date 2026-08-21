interface Props {
  pageTitle: string;
}

export default function LegalHeader({ pageTitle }: Props) {
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
          padding: 0 clamp(16px, 3vw, 48px);
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-sizing: border-box;
        }
        .lh-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          flex-shrink: 0;
          gap: 12px;
        }
        .lh-logo img {
          height: 40px;
          width: auto;
          max-width: 175px;
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
          gap: 7px;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          color: rgba(255,249,239,0.70);
          height: 36px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid rgba(200,154,61,0.30);
          white-space: nowrap;
          flex-shrink: 0;
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

        /* Mobile ≤ 520px: hide separator + page name to avoid overflow */
        @media (max-width: 520px) {
          .lh-sep, .lh-page-name { display: none; }
          .lh-back {
            font-size: 11px;
            padding: 0 12px;
            letter-spacing: 0.04em;
          }
        }
      `}</style>

      <header className="lh-root" role="banner">
        <div className="lh-inner">

          {/* Logo + breadcrumb */}
          <a href="/" className="lh-logo" aria-label="MALWA NAMKEEN HOUSE — back to website">
            <img
              src="/logo-nav-maroon.png"
              alt="MALWA NAMKEEN HOUSE"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="lh-sep" aria-hidden="true" />
            <span className="lh-page-name">{pageTitle}</span>
          </a>

          {/* Back link */}
          <a href="/" className="lh-back">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Website
          </a>

        </div>
      </header>

      {/* Spacer so content clears the fixed header */}
      <div style={{ height: '68px' }} aria-hidden="true" />
    </>
  );
}
