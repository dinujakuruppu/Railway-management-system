import type { ReactNode } from "react";
import { requirePageUser } from "@/lib/server/auth";
import Sidebar from "@/components/layout/Sidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
export const metadata = { title: "Passenger dashboard" };
export default async function Layout({ children }: { children: ReactNode }) {
  await requirePageUser();
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader />
        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
}
