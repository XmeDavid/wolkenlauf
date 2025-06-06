"use client";

import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-red-600">
            Dashboard Error
          </CardTitle>
          <CardDescription>
            Something went wrong while loading your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">
              {error.message || "Failed to load dashboard data"}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-1">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              🔄 Retry Loading Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              🔃 Refresh Page
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              🏠 Go Home
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              This usually resolves itself. Try refreshing or check your internet connection.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}