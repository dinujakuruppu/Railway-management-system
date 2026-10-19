import type { ReactNode } from "react";
import { requirePageAdmin } from "@/lib/server/auth";
import Sidebar from "@/components/layout/Sidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
export const metadata = { title: "Administration" };
export default async function Layout({ children }: { children: ReactNode }) {
  await requirePageAdmin();
  return (
    <div className="dashboard-shell">
      <Sidebar admin />
      <div className="dashboard-main">
        <DashboardHeader admin />
        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
}
