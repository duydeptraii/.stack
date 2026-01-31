'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Something went wrong
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="cursor-pointer gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional error display component for inline errors
export function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 animate-fade-in">
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-destructive" />
      <p className="flex-1 text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-8 cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Retry
        </Button>
      )}
    </div>
  );
}

// Loading state component
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-6 text-muted-foreground">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

// Empty state component
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
