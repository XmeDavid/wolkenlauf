'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { CheckIcon } from '~/components/icons';
import { PRICING_PLANS, CREDIT_TOPUP } from '~/lib/pricing';

interface SubscriptionManagementProps {
  currentPlan?: string;
  userId: string;
  onPlanChange?: () => void;
}

export default function SubscriptionManagement({ currentPlan = 'free', userId, onPlanChange }: SubscriptionManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [topUpCredits, setTopUpCredits] = useState(100);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Check for successful payment redirect and refetch plan data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      // Payment was successful, refetch plan data
      setTimeout(() => {
        onPlanChange?.();
      }, 2000); // Wait 2 seconds for webhook to process
      
      // Clean up URL params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [onPlanChange]);

  const handleSubscribe = async (planId: string) => {
    setIsLoading(true);
    setSelectedPlan(planId);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'subscription',
          planId,
          userId,
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to create checkout session. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleTopUp = async () => {
    if (topUpCredits < CREDIT_TOPUP.minCredits || topUpCredits > CREDIT_TOPUP.maxCredits) {
      alert(`Credits must be between ${CREDIT_TOPUP.minCredits} and ${CREDIT_TOPUP.maxCredits}`);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'credit_topup',
          credits: topUpCredits,
          userId,
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to create checkout session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlanInfo = PRICING_PLANS.find(p => p.id === currentPlan);

  return (
    <div className="space-y-8">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your current subscription and billing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{currentPlanInfo?.name || 'Free'}</h3>
              <p className="text-sm text-gray-500">
                {currentPlanInfo?.credits || 150} credits per month
              </p>
            </div>
            <Badge variant={currentPlan === 'free' ? 'secondary' : 'default'}>
              {currentPlan === 'free' ? 'Free Plan' : 'Paid Plan'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>
            Upgrade your plan for more credits and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRICING_PLANS.filter(plan => plan.id !== 'free').map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-4 ${
                  currentPlan === plan.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold capitalize">{plan.name}</h3>
                  <div className="text-2xl font-bold">
                    ${plan.price}
                    <span className="text-sm font-normal text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-gray-500">{plan.credits} credits monthly</p>
                </div>

                <ul className="space-y-2 mb-4 text-sm">
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {plan.credits} credits per month
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Access to all VM types
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {plan.id === 'starter' && 'Email support'}
                    {plan.id === 'pro' && 'Priority support'}
                    {plan.id === 'business' && 'Team collaboration'}
                    {plan.id === 'enterprise' && 'Dedicated support'}
                  </li>
                </ul>

                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading || currentPlan === plan.id}
                  variant={currentPlan === plan.id ? 'secondary' : 'default'}
                >
                  {isLoading && selectedPlan === plan.id ? (
                    'Processing...'
                  ) : currentPlan === plan.id ? (
                    'Current Plan'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credit Top-up */}
      <Card>
        <CardHeader>
          <CardTitle>Buy Additional Credits</CardTitle>
          <CardDescription>
            Purchase extra credits when you need them. Credits never expire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label htmlFor="credits" className="block text-sm font-medium mb-2">
                Number of Credits
              </label>
              <Input
                id="credits"
                type="number"
                min={CREDIT_TOPUP.minCredits}
                max={CREDIT_TOPUP.maxCredits}
                value={topUpCredits}
                onChange={(e) => setTopUpCredits(Number(e.target.value))}
                placeholder="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Between {CREDIT_TOPUP.minCredits} and {CREDIT_TOPUP.maxCredits} credits
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Cost</div>
              <div className="text-lg font-semibold">
                ${(topUpCredits * CREDIT_TOPUP.pricePerCredit).toFixed(2)}
              </div>
            </div>
            <Button 
              onClick={handleTopUp}
              disabled={isLoading || topUpCredits < CREDIT_TOPUP.minCredits || topUpCredits > CREDIT_TOPUP.maxCredits}
            >
              {isLoading ? 'Processing...' : 'Buy Credits'}
            </Button>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 Credits purchased individually are charged at ${CREDIT_TOPUP.pricePerCredit} per credit. 
              Subscription plans offer better value for regular usage.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}