import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-6xl font-bold text-gray-400">
            404
          </CardTitle>
          <CardTitle className="text-2xl font-bold">
            Page Not Found
          </CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Link href="/dashboard" className="w-full">
              <Button className="w-full">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                Go Home
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Lost? Use the navigation above to find your way.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}