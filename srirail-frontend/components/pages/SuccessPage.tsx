"use client";
import { useApp } from "@/context/AppContext";
import TicketCard from "@/components/booking/TicketCard";
import TicketActions from "@/components/booking/TicketActions";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ButtonLink } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
export default function SuccessPage() {
  const { lastBookingId, bookings, ready } = useApp();
  if (!ready) return <LoadingSpinner />;
  const booking = bookings.find((b) => b.id === lastBookingId);
  if (!booking)
    return (
      <EmptyState
        title="No recent booking found"
        description="Complete a mock booking to see your confirmation and e-ticket."
      >
        <ButtonLink href="/trains">Find a train</ButtonLink>
      </EmptyState>
    );
  return (
    <>
      <div className="text-center mb-8 no-print">
        <span className="w-14 h-14 flex items-center justify-center mx-auto bg-emerald-100 text-emerald-700 rounded-full mb-5">
          <Icon name="check" size={28} />
        </span>
        <p className="eyebrow">All aboard</p>
        <h1>Your demo booking is confirmed.</h1>
        <p className="text-muted mt-3">
          Your sample ticket is ready. No real payment was made.
        </p>
      </div>
      <TicketCard booking={booking} />
      <div className="mt-7">
        <TicketActions booking={booking} />
      </div>
      <div className="text-center mt-5 no-print">
        <ButtonLink href="/dashboard/bookings" variant="ghost">
          Go to my bookings →
        </ButtonLink>
        <p className="text-xs text-muted mt-2">
          Download gives you an offline HTML ticket. Use Print / Save PDF for a
          PDF copy.
        </p>
      </div>
    </>
  );
}
