"use client";
import type { ReactNode } from "react";
import { useApp } from "@/context/AppContext";
import { passengersReady, seatsReady } from "@/lib/booking";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ButtonLink } from "@/components/ui/Button";
export default function BookingGuard({
  children,
  step = 1,
}: {
  children: ReactNode;
  step?: 1 | 2 | 3;
}) {
  const { draft, ready, lastBookingId } = useApp();
  if (!ready) return <LoadingSpinner />;
  if (!draft.journey)
    return (
      <EmptyState
        title={
          lastBookingId ? "Your booking is complete" : "Choose a journey first"
        }
        description={
          lastBookingId
            ? "You can view your e-ticket or start another journey."
            : "Find an available train, then enter your passenger information."
        }
      >
        <ButtonLink
          href={
            lastBookingId ? `/dashboard/bookings/${lastBookingId}` : "/trains"
          }
        >
          {lastBookingId ? "View e-ticket" : "Search trains"}
        </ButtonLink>
      </EmptyState>
    );
  if (step > 1 && !passengersReady(draft))
    return (
      <EmptyState
        title="Passenger details are needed"
        description="Complete each passenger’s details to continue."
      >
        <ButtonLink href="/booking/passengers">
          Enter passenger details
        </ButtonLink>
      </EmptyState>
    );
  if (step > 2 && !seatsReady(draft))
    return (
      <EmptyState
        title="Choose your class and seats"
        description="Select the required number of seats before reviewing your booking."
      >
        <ButtonLink href="/booking/seats">Choose seats</ButtonLink>
      </EmptyState>
    );
  return children;
}
