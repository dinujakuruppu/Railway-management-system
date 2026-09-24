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
        description="Please try again. If the demo session is damaged, reset it to restore the sample data."
      >
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={reset}>Try again</Button>
          <Button
            variant="secondary"
            onClick={() => {
              sessionStorage.removeItem("srirail-demo-v1");
              window.location.href = "/";
            }}
          >
            Reset demo session
          </Button>
        </div>
      </EmptyState>
    </div>
  );
}
