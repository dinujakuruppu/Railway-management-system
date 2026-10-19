export default function LoadingSpinner({
  label = "Loading your journey…",
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-16 text-muted"
    >
      <span className="spinner" />
      {label}
    </div>
  );
}
