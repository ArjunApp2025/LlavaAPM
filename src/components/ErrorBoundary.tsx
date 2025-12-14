import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div 
            className="min-h-screen flex items-center justify-center p-4"
            style={{ backgroundColor: 'var(--vx-bg)' }}
          >
            <div className="vx-card p-6 max-w-md" style={{ borderColor: 'var(--vx-red)' }}>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--vx-red)' }}>Something went wrong</h2>
              <p className="mb-4" style={{ color: 'var(--vx-text-muted)' }}>
                An error occurred while rendering this component. Please refresh the page or try again.
              </p>
              {this.state.error && (
                <details className="mt-4">
                  <summary 
                    className="cursor-pointer text-sm"
                    style={{ color: 'var(--vx-text-muted)' }}
                  >
                    Error details
                  </summary>
                  <pre 
                    className="mt-2 text-xs p-2 rounded overflow-auto"
                    style={{ 
                      backgroundColor: 'var(--vx-bg-alt)',
                      color: 'var(--vx-text-muted)'
                    }}
                  >
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
                className="vx-btn-primary mt-4"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}


