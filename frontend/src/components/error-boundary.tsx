"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const reset = () => {
        this.setState({ hasError: false, error: undefined });
      };

      if (this.props.fallback && this.state.error) {
        return <this.props.fallback error={this.state.error} reset={reset} />;
      }

      return <DefaultErrorFallback error={this.state.error} reset={reset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ 
  error, 
  reset 
}: { 
  error?: Error; 
  reset: () => void; 
}) {
  return (
    <div className="p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-lg text-red-600">Something went wrong</CardTitle>
          <CardDescription>
            {error?.message || "An unexpected error occurred"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button onClick={reset} size="sm">
              Try Again
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for using error boundary
export function useErrorHandler() {
  return (error: Error) => {
    console.error("Manual error trigger:", error);
    throw error;
  };
}