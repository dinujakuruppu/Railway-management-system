"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
const passengerLinks: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/dashboard/bookings", label: "My bookings", icon: "ticket" },
  { href: "/dashboard/profile", label: "My profile", icon: "user" },
];
const adminLinks: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Overview", icon: "grid" },
  { href: "/admin/trains", label: "Trains", icon: "train" },
  { href: "/admin/schedules", label: "Schedules", icon: "calendar" },
  { href: "/admin/bookings", label: "Bookings", icon: "ticket" },
  { href: "/admin/passengers", label: "Passengers", icon: "user" },
  { href: "/admin/notices", label: "Notices", icon: "bell" },
];
export default function Sidebar({ admin = false }: { admin?: boolean }) {
  const path = usePathname();
  return (
    <aside className="sidebar no-print">
      <div className="sidebar-title">{admin ? "MANAGEMENT" : "MY SRIRAIL"}</div>
      <nav aria-label={admin ? "Administration" : "Passenger account"}>
        {(admin ? adminLinks : passengerLinks).map((item) => {
          const active =
            path === item.href ||
            (item.href.endsWith("bookings") &&
              path.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-note">
        <Icon name={admin ? "info" : "train"} />
        <p>
          {admin
            ? "Demonstration data saved securely to the project database."
            : "Your next journey starts here."}
        </p>
        <Link href={admin ? "/" : "/trains"}>
          {admin ? "Passenger website" : "Find a train"} →
        </Link>
      </div>
    </aside>
  );
}
