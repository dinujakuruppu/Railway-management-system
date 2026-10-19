import type { ReactNode } from "react";
export default function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      tone={
        status === "Confirmed" || status === "Active"
          ? "success"
          : status === "Cancelled" || status === "Inactive"
            ? "danger"
            : status === "Completed"
              ? "neutral"
              : "warning"
      }
    >
      {status}
    </Badge>
  );
}
