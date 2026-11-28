import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  const msg = `${error.name || ''} ${error.message || ''}`;
  return (
    /ChunkLoadError/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /Loading CSS chunk/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg)
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const chunkError = isChunkLoadError(this.state.error);
      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 20px',
            fontFamily: "var(--font-primary, 'DM Sans', Inter, sans-serif)",
            background: '#F6EFE3',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '460px', width: '100%' }}>
            <h1 style={{ fontSize: '22px', color: '#3C0815', marginBottom: '10px', fontWeight: 800 }}>
              {chunkError ? 'Storefront Update Available' : 'Something went wrong'}
            </h1>
            <p style={{ fontSize: '14px', color: '#75645C', marginBottom: '24px', lineHeight: 1.6 }}>
              {chunkError
                ? 'A newer version of Malwa Namkeen House was published or your connection was interrupted while loading this page. Please reload to continue.'
                : 'An unexpected issue interrupted this view. You can reload the page or return to the homepage.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  background: '#55000A',
                  color: '#FFF8EC',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '12px 26px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Reload Page
              </button>
              {!chunkError && (
                <button
                  type="button"
                  onClick={this.handleRetry}
                  style={{
                    background: '#FFFDF8',
                    color: '#3C0815',
                    border: '1px solid #3C0815',
                    borderRadius: '999px',
                    padding: '12px 22px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Try Again
                </button>
              )}
              <button
                type="button"
                onClick={() => window.location.assign('/')}
                style={{
                  background: 'transparent',
                  color: '#75645C',
                  border: '1px solid rgba(117,100,92,0.35)',
                  borderRadius: '999px',
                  padding: '12px 22px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
