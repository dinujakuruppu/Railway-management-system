import type { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
export const metadata = { title: "Administration" };
export default function Layout({ children }: { children: ReactNode }) {
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
