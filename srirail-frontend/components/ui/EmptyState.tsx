import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";
export default function EmptyState({
  title,
  description,
  children,
  icon = "search",
}: {
  title: string;
  description: string;
  children?: ReactNode;
  icon?: IconName;
}) {
  return (
    <div className="empty-state">
      <span className="icon-tile mx-auto">
        <Icon name={icon} size={26} />
      </span>
      <h2 className="mt-5 text-xl font-bold">{title}</h2>
      <p className="mt-2 mb-6 text-muted max-w-md mx-auto">{description}</p>
      {children}
    </div>
  );
}
