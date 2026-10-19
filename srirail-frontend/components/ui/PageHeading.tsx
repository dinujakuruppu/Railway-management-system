import type { ReactNode } from "react";
export default function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && (
          <p className="text-muted mt-2 max-w-2xl">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
