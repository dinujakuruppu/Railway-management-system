import EmptyState from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
export default function NotFound() {
  return (
    <div className="container page-section">
      <EmptyState
        title="This stop isn’t on our route"
        description="The page may have moved, or this journey is no longer available."
      >
        <ButtonLink href="/">Back to SriRail</ButtonLink>
      </EmptyState>
    </div>
  );
}
