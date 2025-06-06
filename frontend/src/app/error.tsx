"use client";

import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-600">
            Something went wrong!
          </CardTitle>
          <CardDescription>
            An unexpected error occurred. Don't worry, we're here to help.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800 font-mono">
              {error.message || "An unknown error occurred"}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-1">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full"
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go Home
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              If this problem persists, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}