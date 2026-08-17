import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { formatAppError, AppError } from '@/lib/errorHandler';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  rawError: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    rawError: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(rawError: Error): State {
    const formatted = formatAppError(rawError, 'An unhandled component rendering error occurred.');
    return {
      hasError: true,
      error: formatted,
      rawError,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      rawError: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReloadPage = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'Something went wrong';
      const errorMsg = this.state.error?.message || 'The application encountered an unexpected visual rendering error.';

      return (
        <div className="p-6 my-4 rounded-3xl bg-red-950/20 border border-red-500/20 backdrop-blur-xl shadow-2xl max-w-2xl mx-auto text-left">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{errorMsg}</p>

              {this.state.error?.isRateLimit && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  ⚡ <strong>Quota Notice:</strong> The free API limit has been reached. Please wait a few seconds before retrying.
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <RotateCcw size={14} />
                  <span>Try Again</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleReloadPage}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-medium text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Reload Page</span>
                </button>

                {this.state.rawError && (
                  <button
                    type="button"
                    onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                    className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 ml-auto cursor-pointer"
                  >
                    {this.state.showDetails ? 'Hide Stack Trace' : 'View Diagnostics'}
                  </button>
                )}
              </div>

              {this.state.showDetails && this.state.rawError && (
                <div className="mt-3 p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-red-300 overflow-x-auto max-h-40 whitespace-pre-wrap select-text">
                  {this.state.rawError.stack || this.state.rawError.message}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
