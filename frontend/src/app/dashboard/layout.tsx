import DashboardHeader from "~/components/dashboard/header";
import DashboardSidebar from "~/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="w-screen h-screen flex flex-col">
      <DashboardHeader></DashboardHeader>
      <div className="flex">
        <DashboardSidebar></DashboardSidebar>
        <div>{children}</div>
      </div>
    </main>
  );
}
