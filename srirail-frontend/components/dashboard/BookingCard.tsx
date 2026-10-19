import type { Booking } from "@/types";
import { formatDate, money } from "@/lib/format";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
export default function BookingCard({ booking }: { booking: Booking }) {
  return (
    <article className="card panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted m-0 font-mono">{booking.reference}</p>
        <StatusBadge status={booking.status} />
      </div>
      <h3 className="text-base font-bold mt-4 mb-1">
        {booking.journey.from} → {booking.journey.to}
      </h3>
      <p className="text-sm text-muted mb-4">
        {booking.journey.train.name} · {formatDate(booking.journey.date, true)}
      </p>
      <div className="flex flex-wrap justify-between items-center gap-3">
        <strong>{money(booking.total)}</strong>
        <ButtonLink
          href={`/dashboard/bookings/${booking.id}`}
          variant="secondary"
        >
          View ticket
        </ButtonLink>
      </div>
    </article>
  );
}
