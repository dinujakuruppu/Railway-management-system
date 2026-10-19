"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { coachFor } from "@/lib/booking";
import { request } from "@/lib/client-api";
import type { Seat } from "@/types";
import BookingGuard from "@/components/booking/BookingGuard";
import BookingSummary from "@/components/booking/BookingSummary";
import ClassCard from "@/components/booking/ClassCard";
import SeatMap from "@/components/booking/SeatMap";
import PageHeading from "@/components/ui/PageHeading";
import Button, { ButtonLink } from "@/components/ui/Button";
type Availability = Record<string, { seats: string[]; available: number }>;
export default function SeatsPage() {
  const { draft, updateDraft, connected } = useApp();
  const router = useRouter();
  const [error, setError] = useState("");
  const [availability, setAvailability] = useState<Availability>({});
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const journey = draft.journey;
  const train = journey?.train;
  const date = journey?.date;
  useEffect(() => {
    if (!train || !date || !connected) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setAvailability({});
    void Promise.all(
      train.classes.map(async (c) => {
        const params = new URLSearchParams({
          trainId: train.id,
          date,
          classId: c.id,
        });
        return [
          c.id,
          await request<Availability[string]>(`/api/availability?${params}`, {
            signal: controller.signal,
          }),
        ] as const;
      }),
    )
      .then((entries) => {
        if (!controller.signal.aborted)
          setAvailability(Object.fromEntries(entries));
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted)
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load live availability.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [train, date, connected, revision]);
  const travelClass = train?.classes.find((c) => c.id === draft.classId);
  const selectedAvailability = availability[draft.classId];
  const occupied = new Set(selectedAvailability?.seats ?? []);
  const seats: Seat[] = Array.from(
    { length: travelClass?.capacity ?? 0 },
    (_, i) => {
      const number = `${Math.floor(i / 4) + 1}${"ABCD"[i % 4]}`;
      return {
        number,
        status: occupied.has(number)
          ? "reserved"
          : draft.seats.includes(number)
            ? "selected"
            : "available",
      };
    },
  );
  function toggle(number: string) {
    if (!selectedAvailability || loading || occupied.has(number)) return;
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
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted m-0" role="status">
                {loading
                  ? "Checking shared seat availability…"
                  : "Availability can change until you confirm payment."}
              </p>
              <Button
                variant="secondary"
                disabled={loading}
                onClick={() => setRevision((r) => r + 1)}
              >
                Refresh
              </Button>
            </div>
            <div className="space-y-4" role="group" aria-label="Travel classes">
              {journey.train.classes.map((c) => (
                <ClassCard
                  key={c.id}
                  travelClass={c}
                  selected={c.id === draft.classId}
                  available={availability[c.id]?.available ?? null}
                  disabled={
                    loading ||
                    !availability[c.id] ||
                    availability[c.id].available < journey.count
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
                {selectedAvailability && !loading ? (
                  <SeatMap seats={seats} onSelect={toggle} />
                ) : (
                  <p className="text-sm text-muted">
                    Live availability must load before seats can be selected.
                  </p>
                )}
              </section>
            ) : (
              <p className="alert mt-6">
                This is an unreserved class. Your demonstration ticket does not
                guarantee a seat.
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
                disabled={loading || !selectedAvailability}
                onClick={() => {
                  if (
                    travelClass?.reserved &&
                    (draft.seats.length !== journey.count ||
                      draft.seats.some((s) => occupied.has(s)))
                  ) {
                    setError(
                      `Please choose exactly ${journey.count} available seat(s).`,
                    );
                    return;
                  }
                  if (
                    !selectedAvailability ||
                    selectedAvailability.available < journey.count
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
