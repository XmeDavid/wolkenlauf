'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';

export default function SubscriptionCanceledPage() {
  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <CardTitle className="text-orange-600">Payment Canceled</CardTitle>
          <CardDescription>
            Your payment was canceled. No charges were made to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-900">What happened?</h3>
            <p className="text-orange-700 text-sm">
              You canceled the payment process. Your account remains unchanged.
            </p>
          </div>

          <div className="space-y-2">
            <Link href="/dashboard/profile">
              <Button className="w-full">Try Again</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">Back to Dashboard</Button>
            </Link>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}