"use client";
import { useApp } from "@/context/AppContext";
import TicketCard from "@/components/booking/TicketCard";
import TicketActions from "@/components/booking/TicketActions";
import PageHeading from "@/components/ui/PageHeading";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ButtonLink } from "@/components/ui/Button";
export default function TicketPage({ id }: { id: string }) {
  const { bookings, ready } = useApp();
  if (!ready) return <LoadingSpinner />;
  const booking = bookings.find((b) => b.id === id);
  if (!booking)
    return (
      <EmptyState
        icon="ticket"
        title="Ticket not found"
        description="This ticket may belong to a different browser session. Find your available bookings below."
      >
        <ButtonLink href="/dashboard/bookings">My bookings</ButtonLink>
      </EmptyState>
    );
  return (
    <>
      <PageHeading
        title="Your e-ticket"
        description="Keep a copy of your demo journey details."
        action={
          <ButtonLink href="/dashboard/bookings" variant="secondary">
            ← My bookings
          </ButtonLink>
        }
      />
      <TicketCard booking={booking} />
      <div className="mt-6">
        <TicketActions booking={booking} />
      </div>
      <p className="text-xs text-muted text-center mt-4 no-print">
        Download saves an HTML ticket you can open offline. Print / Save PDF
        opens your browser’s print dialog.
      </p>
    </>
  );
}
