"use client";
import { useApp } from "@/context/AppContext";
import { totals } from "@/lib/booking";
import { formatDate, money } from "@/lib/format";
import Icon from "@/components/ui/Icon";
export default function BookingSummary() {
  const { draft } = useApp();
  const journey = draft.journey;
  if (!journey) return null;
  const price = totals(draft);
  const travelClass = journey.train.classes.find((c) => c.id === draft.classId);
  return (
    <aside className="card journey-summary">
      <p className="eyebrow">Your booking</p>
      <h2 className="text-lg font-bold mb-1">{journey.from}</h2>
      <Icon name="arrow" size={19} className="my-2 text-maroon" />
      <h2 className="text-lg font-bold mb-5">{journey.to}</h2>
      <div className="text-sm border-y border-slate-200 py-4 mb-5">
        <p className="font-semibold mb-1">{journey.train.name}</p>
        <p className="text-muted mb-1">{formatDate(journey.date, true)}</p>
        <p className="text-muted mb-0">
          {journey.train.departureTime} – {journey.train.arrivalTime} ·{" "}
          {journey.train.duration}
        </p>
      </div>
      <p className="text-sm font-semibold mb-1">{travelClass?.name}</p>
      <p className="text-xs text-muted">
        {draft.seats.length
          ? `Seats ${draft.seats.join(", ")}`
          : travelClass?.reserved
            ? "Seats not selected yet"
            : "Open seating · No assigned seat"}
      </p>
      <div className="summary-row">
        <span>
          {money(price.price)} × {journey.count}
        </span>
        <span>{money(price.fare)}</span>
      </div>
      <div className="summary-row text-muted">
        <span>Service fee</span>
        <span>{money(price.serviceFee)}</span>
      </div>
      <div className="summary-row summary-total">
        <span>Total</span>
        <span>{money(price.total)}</span>
      </div>
      <p className="text-xs text-muted mt-4 mb-0">
        LKR 50 service fee per passenger. All amounts are for demonstration.
      </p>
    </aside>
  );
}
