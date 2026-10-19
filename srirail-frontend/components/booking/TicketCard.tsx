import type { Booking } from "@/types";
import { formatDate, money } from "@/lib/format";
import { StatusBadge } from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import JourneyTimes from "./JourneyTimes";
export default function TicketCard({ booking }: { booking: Booking }) {
  return (
    <article className="ticket" aria-label="SriRail e-ticket">
      <div className="ticket-head">
        <div className="brand">
          <Icon name="train" size={35} />
          <span>
            SriRail<small>PASSENGER E-TICKET</small>
          </span>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-slate-300 mb-1">BOOKING REFERENCE</p>
          <p className="font-mono font-bold text-lg mb-0">
            {booking.reference}
          </p>
        </div>
      </div>
      <div className="ticket-body">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold mb-1">
              {booking.journey.train.name}
            </h2>
            <p className="text-sm text-muted mb-0">
              #{booking.journey.train.trainNumber} ·{" "}
              {formatDate(booking.journey.date)}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </div>
        <JourneyTimes train={booking.journey.train} />
        <div className="grid sm:grid-cols-3 gap-5 p-4 bg-slate-50 rounded-lg mb-5 text-sm">
          <div>
            <p className="text-muted text-xs mb-1">CLASS</p>
            <strong>{booking.className}</strong>
          </div>
          <div>
            <p className="text-muted text-xs mb-1">COACH / SEATS</p>
            <strong>
              {booking.coach}
              {booking.seats.length ? ` / ${booking.seats.join(", ")}` : ""}
            </strong>
          </div>
          <div>
            <p className="text-muted text-xs mb-1">PASSENGERS</p>
            <strong>{booking.passengers.length}</strong>
          </div>
        </div>
        {booking.passengers.map((p, i) => (
          <div className="ticket-passenger" key={p.id}>
            <div>
              <p className="text-xs text-muted mb-1">PASSENGER {i + 1}</p>
              <strong>{p.fullName}</strong>
              <span className="text-muted"> · {p.type}</span>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">NIC / PASSPORT</p>
              {p.identity}
            </div>
            <div>
              <p className="text-xs text-muted mb-1">SEAT</p>
              {booking.seats[i] ?? "Unreserved"}
            </div>
          </div>
        ))}
      </div>
      <div className="ticket-bottom">
        <div>
          <p className="text-xs text-muted mb-1">TOTAL PAYMENT · SIMULATED</p>
          <p className="text-2xl font-bold mb-2">{money(booking.total)}</p>
          <p className="text-xs text-muted mb-0">
            Fare {money(booking.fare)} + service fee {money(booking.serviceFee)}
          </p>
          <p className="text-xs font-bold text-maroon mt-4 mb-0">
            DEMO — NOT VALID FOR TRAVEL
          </p>
        </div>
        <div className="qr-placeholder">
          <Icon name="grid" />
          <span>
            QR PLACEHOLDER
            <br />
            NOT SCANNABLE
          </span>
        </div>
      </div>
    </article>
  );
}
