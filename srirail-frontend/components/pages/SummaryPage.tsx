"use client";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { coachFor } from "@/lib/booking";
import { formatDate } from "@/lib/format";
import PageHeading from "@/components/ui/PageHeading";
import { ButtonLink } from "@/components/ui/Button";
import BookingGuard from "@/components/booking/BookingGuard";
import BookingSummary from "@/components/booking/BookingSummary";
import JourneyTimes from "@/components/booking/JourneyTimes";
export default function SummaryPage() {
  const { draft } = useApp();
  return (
    <BookingGuard step={3}>
      <PageHeading
        eyebrow="Step 03"
        title="Review your journey"
        description="Check your passenger information and travel details before payment."
      />
      {draft.journey && (
        <div className="booking-grid">
          <div className="space-y-5">
            <section className="card panel">
              <div className="flex justify-between gap-4">
                <div>
                  <h2 className="font-bold text-lg mb-1">
                    {draft.journey.train.name}
                  </h2>
                  <p className="text-muted text-sm">
                    #{draft.journey.train.trainNumber} ·{" "}
                    {formatDate(draft.journey.date)}
                  </p>
                </div>
                <Link href="/trains" className="link text-sm">
                  Change train
                </Link>
              </div>
              <JourneyTimes train={draft.journey.train} />
              <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5 text-sm">
                <span>
                  {
                    draft.journey.train.classes.find(
                      (c) => c.id === draft.classId,
                    )?.name
                  }
                  <br />
                  <span className="text-muted">
                    {draft.seats.length
                      ? `Coach ${coachFor(draft.classId)} · Seats ${draft.seats.join(", ")}`
                      : "Open seating"}
                  </span>
                </span>
                <Link href="/booking/seats" className="link">
                  Edit seats
                </Link>
              </div>
            </section>
            <section className="card panel">
              <div className="flex justify-between mb-4">
                <h2 className="text-lg font-bold m-0">Passenger details</h2>
                <Link href="/booking/passengers" className="link text-sm">
                  Edit
                </Link>
              </div>
              {draft.passengers.map((p, i) => (
                <div
                  key={p.id}
                  className="py-4 border-b last:border-0 border-slate-200"
                >
                  <p className="font-semibold text-sm mb-1">
                    {i + 1}. {p.fullName}{" "}
                    <span className="text-muted font-normal">· {p.type}</span>
                  </p>
                  <p className="text-sm text-muted m-0 break-all">
                    {p.identity} · {p.email}
                    <br />
                    {p.mobile}
                  </p>
                </div>
              ))}
            </section>
            <p className="alert">
              This is a simulated booking. No real train seat is reserved and no
              money is charged.
            </p>
            <div className="flex flex-wrap justify-between gap-3">
              <ButtonLink href="/booking/seats" variant="secondary">
                Back
              </ButtonLink>
              <ButtonLink href="/booking/payment">
                Proceed to payment →
              </ButtonLink>
            </div>
          </div>
          <BookingSummary />
        </div>
      )}
    </BookingGuard>
  );
}
