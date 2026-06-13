import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Route protection
  if (!user) {
    redirect("/");
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full min-h-screen">
      {/* Sidebar */}
      <DashboardSidebar user={user} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/10 overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
