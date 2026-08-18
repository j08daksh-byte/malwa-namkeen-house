import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
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

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          fontFamily: 'Inter, sans-serif',
          background: '#F6EFE3',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '16px', color: '#55000A', marginBottom: '12px', fontWeight: 600 }}>
            Something went wrong.
          </p>
          <p style={{ fontSize: '13px', color: '#75645C', marginBottom: '24px' }}>
            Please refresh the page or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#55000A', color: '#FFF8EC',
              border: 'none', borderRadius: '999px',
              padding: '12px 28px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
