"use client";

import React from "react";
import CreditsDashboard from "~/components/dashboard/credits-dashboard";

export default function ProfilePage() {
  return (
    <section className="h-full w-full flex flex-col">
      <div className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
        <h2 className="text-lg font-semibold">Credits & Profile</h2>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="flex items-center">
          <h1 className="font-semibold text-lg md:text-2xl">Account Overview</h1>
        </div>
        
        <CreditsDashboard />
      </div>
    </section>
  );
}