import React, { Component, type ReactNode } from 'react';
import { errorHandler, type ErrorBoundaryState } from '@/lib/errorHandler';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State extends ErrorBoundaryState {
  eventId?: string;
}

/**
 * Error Boundary component for graceful error handling
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const componentName = this.props.componentName || 'Unknown';
    const errorState = errorHandler.handleComponentError(error, componentName, errorInfo);
    
    this.setState({
      ...errorState,
      eventId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error UI
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Something went wrong
              </h3>
            </div>
          </div>
          
          <div className="text-sm text-red-700 mb-4">
            <p>We're having trouble loading this section of the menu.</p>
            <p className="mt-1">Please try refreshing the page or contact support if the problem persists.</p>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-4">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}

          <div className="flex space-x-3">
            <button
              onClick={this.resetError}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Refresh Page
            </button>
          </div>

          {this.state.eventId && (
            <p className="mt-3 text-xs text-red-500">
              Error ID: {this.state.eventId}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string,
  fallback?: (error: Error, resetError: () => void) => ReactNode
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary componentName={componentName} fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

/**
 * Hook for error handling in functional components
 */
export function useErrorHandler(componentName?: string) {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error, context?: any) => {
    const errorState = errorHandler.handleComponentError(
      error, 
      componentName || 'FunctionalComponent', 
      context
    );
    setError(errorState.error || error);
  }, [componentName]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    resetError,
    hasError: error !== null
  };
}