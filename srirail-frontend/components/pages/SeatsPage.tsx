"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { availablePlaces, coachFor, seatMap } from "@/lib/booking";
import BookingGuard from "@/components/booking/BookingGuard";
import BookingSummary from "@/components/booking/BookingSummary";
import ClassCard from "@/components/booking/ClassCard";
import SeatMap from "@/components/booking/SeatMap";
import PageHeading from "@/components/ui/PageHeading";
import Button, { ButtonLink } from "@/components/ui/Button";
export default function SeatsPage() {
  const { draft, bookings, updateDraft } = useApp();
  const router = useRouter();
  const [error, setError] = useState("");
  const journey = draft.journey;
  const travelClass = journey?.train.classes.find(
    (c) => c.id === draft.classId,
  );
  function toggle(number: string) {
    if (draft.seats.includes(number)) {
      updateDraft({ seats: draft.seats.filter((s) => s !== number) });
      setError("");
    } else if (draft.seats.length < (journey?.count ?? 1)) {
      updateDraft({ seats: [...draft.seats, number] });
      setError("");
    } else
      setError(
        `You need ${journey?.count} seat(s). Deselect a seat to choose a different one.`,
      );
  }
  return (
    <BookingGuard step={2}>
      <PageHeading
        eyebrow="Step 02"
        title="Make yourself comfortable"
        description="Choose a travel class. Reserved classes let you select your seat."
      />
      {journey && (
        <div className="booking-grid">
          <div>
            <div className="space-y-4" role="group" aria-label="Travel classes">
              {journey.train.classes.map((c) => (
                <ClassCard
                  key={c.id}
                  travelClass={c}
                  selected={c.id === draft.classId}
                  available={availablePlaces(
                    journey.train,
                    journey.date,
                    c.id,
                    bookings,
                  )}
                  disabled={
                    availablePlaces(
                      journey.train,
                      journey.date,
                      c.id,
                      bookings,
                    ) < journey.count
                  }
                  onSelect={() => {
                    updateDraft({ classId: c.id, seats: [] });
                    setError("");
                  }}
                />
              ))}
            </div>
            {travelClass?.reserved ? (
              <section className="card panel mt-6">
                <div className="flex flex-wrap gap-3 justify-between mb-6">
                  <h2 className="text-lg font-bold m-0">
                    Choose seats · Coach {coachFor(draft.classId)}
                  </h2>
                  <span className="text-sm text-muted" aria-live="polite">
                    {draft.seats.length} of {journey.count} selected
                  </span>
                </div>
                <SeatMap
                  seats={seatMap(
                    journey.train.id,
                    journey.date,
                    draft.classId,
                    bookings,
                    draft.seats,
                  )}
                  onSelect={toggle}
                />
              </section>
            ) : (
              <p className="alert mt-6">
                This is an unreserved class. Your ticket does not guarantee a
                seat.
              </p>
            )}
            {error && (
              <p role="alert" className="alert alert-error mt-5">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-3 justify-between mt-6">
              <ButtonLink variant="secondary" href="/booking/passengers">
                Back
              </ButtonLink>
              <Button
                onClick={() => {
                  if (
                    travelClass?.reserved &&
                    draft.seats.length !== journey.count
                  ) {
                    setError(`Please select exactly ${journey.count} seat(s).`);
                    return;
                  }
                  if (
                    availablePlaces(
                      journey.train,
                      journey.date,
                      draft.classId,
                      bookings,
                    ) < journey.count
                  ) {
                    setError("This class does not have enough places.");
                    return;
                  }
                  router.push("/booking/summary");
                }}
              >
                Review booking →
              </Button>
            </div>
          </div>
          <BookingSummary />
        </div>
      )}
    </BookingGuard>
  );
}
