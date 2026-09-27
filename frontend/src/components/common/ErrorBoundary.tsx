import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isChunkLoadError = this.state.error?.name === 'ChunkLoadError' || 
                               this.state.error?.message?.includes('Loading chunk');

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500 w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            
            <p className="text-gray-500 mb-8">
              {isChunkLoadError 
                ? "We updated the application properly. Please refresh to get the latest version."
                : "The application encountered an unexpected error. Our team has been notified."}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm hover:shadow-md active:scale-95 duration-200"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
              
              {!isChunkLoadError && (
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  <Home size={18} />
                  Home
                </button>
              )}
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
               <div className="mt-8 text-left bg-gray-50 p-4 rounded-lg overflow-auto max-h-48 text-xs text-mono text-gray-600 border border-gray-200">
                 <p className="font-bold text-red-600 mb-1">{this.state.error.toString()}</p>
                 <pre>{this.state.errorInfo?.componentStack}</pre>
               </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
