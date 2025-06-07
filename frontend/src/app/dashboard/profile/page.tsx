"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import CreditsDashboard from "~/components/dashboard/credits-dashboard";
import SubscriptionManagement from "~/components/dashboard/subscription-management";

export default function ProfilePage() {
  const { user } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription'>('overview');

  // Fetch user's subscription data
  const { data: subscriptionData, isLoading, refetch: refetchSubscription } = useQuery({
    queryKey: ['userSubscription'],
    queryFn: async () => {
      const response = await fetch('/api/user/subscription');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds to pick up changes
  });

  return (
    <section className="h-full w-full flex flex-col">
      <div className="flex h-16 lg:h-[70px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to VMs
        </Button>
        <h2 className="text-lg font-semibold">Credits & Profile</h2>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeTab === 'overview' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeTab === 'subscription' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Subscription
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-semibold text-lg md:text-2xl">
            {activeTab === 'overview' ? 'Account Overview' : 'Subscription Management'}
          </h1>
        </div>
        
        <div className="w-full max-w-7xl mx-auto">
          {activeTab === 'overview' && <CreditsDashboard />}
          {activeTab === 'subscription' && (
            <SubscriptionManagement 
              currentPlan={subscriptionData?.currentPlan || 'free'}
              userId={user?.id || ''} 
              onPlanChange={refetchSubscription}
            />
          )}
        </div>
      </div>
    </section>
  );
}