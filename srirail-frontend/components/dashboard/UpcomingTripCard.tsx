import type { Booking } from "@/types";
import { daysAway, formatDate } from "@/lib/format";
import { ButtonLink } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import JourneyTimes from "@/components/booking/JourneyTimes";
export default function UpcomingTripCard({ booking }: { booking: Booking }) {
  const days = daysAway(booking.journey.date);
  return (
    <article className="card panel next-trip">
      <div className="flex flex-wrap justify-between gap-3">
        <p className="eyebrow !text-gold m-0">Your next journey</p>
        <Badge tone="warning">
          {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
        </Badge>
      </div>
      <h2 className="text-xl font-bold mt-5 mb-1">
        {booking.journey.train.name}
      </h2>
      <p className="text-sm text-muted">{formatDate(booking.journey.date)}</p>
      <JourneyTimes train={booking.journey.train} />
      <div className="flex flex-wrap gap-4 items-center justify-between border-t border-white/20 pt-5">
        <p className="text-sm m-0">
          {booking.className}
          <br />
          <span className="text-xs text-muted">
            {booking.seats.length
              ? `Coach ${booking.coach} · ${booking.seats.join(", ")}`
              : "Open seating"}
          </span>
        </p>
        <ButtonLink
          href={`/dashboard/bookings/${booking.id}`}
          variant="secondary"
        >
          View e-ticket →
        </ButtonLink>
      </div>
    </article>
  );
}
