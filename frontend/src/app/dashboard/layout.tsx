"use client";
import DashboardHeader from "~/components/dashboard/header";
import DashboardSidebar from "~/components/sidebar/sidebar";
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

const queryClient = new QueryClient();

export default function DashboardLayout({
  children,
}: { children: React.ReactNode; }) {

  return (
    <QueryClientProvider client={queryClient}>
      <main className="w-screen h-screen flex">
          <DashboardSidebar></DashboardSidebar>
          {children}
      </main>
    </QueryClientProvider>
  );
}
