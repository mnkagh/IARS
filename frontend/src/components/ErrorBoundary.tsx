import React from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[IARS] render failure:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'ui-monospace, monospace', color: '#e2e8f0' }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Something broke while rendering</h1>
          <pre
            style={{
              background: '#7f1d1d33',
              border: '1px solid #ef444455',
              padding: 16,
              borderRadius: 12,
              overflow: 'auto',
              fontSize: 12,
              color: '#fca5a5',
            }}
          >
            {this.state.error.message}
          </pre>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
            style={{
              marginTop: 16,
              padding: '10px 18px',
              borderRadius: 10,
              border: 0,
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}