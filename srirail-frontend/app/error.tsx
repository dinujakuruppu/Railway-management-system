"use client";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container page-section">
      <EmptyState
        title="Something interrupted your journey"
        description="Please try again, or return to the home page and reload your saved account data."
      >
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={reset}>Try again</Button>
          <Button
            variant="secondary"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Return home
          </Button>
        </div>
      </EmptyState>
    </div>
  );
}
