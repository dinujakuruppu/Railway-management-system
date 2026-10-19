"use client";
import { useApp } from "@/context/AppContext";
import Badge from "@/components/ui/Badge";
export default function DashboardHeader({
  admin = false,
}: {
  admin?: boolean;
}) {
  const { user } = useApp();
  return (
    <div className="dashboard-top no-print">
      <span>{admin ? "SriRail administration" : "Passenger account"}</span>
      <div className="flex items-center gap-3">
        <Badge tone="warning">Demo workspace</Badge>
        <span className="avatar">
          {(user?.fullName ?? "Guest").slice(0, 1)}
        </span>
      </div>
    </div>
  );
}
