'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { CheckIcon } from '~/components/icons';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      // Process the payment manually since webhook might not work in development
      const processPayment = async () => {
        try {
          const response = await fetch('/api/stripe/process-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Payment processed successfully:', result);
          } else {
            console.error('Failed to process payment:', await response.text());
          }
        } catch (error) {
          console.error('Error processing payment:', error);
        }
      };
      
      processPayment();
      
      // Set session details for display
      setSessionDetails({
        sessionId,
        type: searchParams.get('type') || 'subscription',
        planName: searchParams.get('plan_name'),
        credits: searchParams.get('credits'),
      });
    }
    
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Processing your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionDetails) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Payment Error</CardTitle>
            <CardDescription>
              We couldn't find your payment session. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/profile">
              <Button className="w-full">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSubscription = sessionDetails.type === 'subscription';
  const isTopUp = sessionDetails.type === 'credit_topup';

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckIcon className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Payment Successful!</CardTitle>
          <CardDescription>
            {isSubscription && 'Your subscription has been activated'}
            {isTopUp && 'Your credits have been added to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSubscription && sessionDetails.planName && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Subscription Details</h3>
              <p className="text-blue-700">Plan: {sessionDetails.planName}</p>
              <p className="text-blue-700 text-sm">Your new credits will be available immediately.</p>
            </div>
          )}
          
          {isTopUp && sessionDetails.credits && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Credits Purchased</h3>
              <p className="text-green-700">{sessionDetails.credits} credits added to your account</p>
              <p className="text-green-700 text-sm">Credits never expire and are available immediately.</p>
            </div>
          )}

          <div className="space-y-2">
            <Link href="/dashboard/profile">
              <Button className="w-full">View Account Dashboard</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">Launch a VM</Button>
            </Link>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            Session ID: {sessionDetails.sessionId}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}