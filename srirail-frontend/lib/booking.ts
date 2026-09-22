import type {
  Booking,
  BookingDraft,
  ClassId,
  JourneySearch,
  PaymentMethod,
  Seat,
  Train,
  TrainSchedule,
} from "@/types";
import { departureHasPassed, duration, minutes } from "@/lib/format";
import { validatePassenger, validateSearch } from "@/lib/validation";
export function scheduledOn(
  trainId: string,
  date: string,
  schedules: TrainSchedule[],
) {
  const schedule = schedules.find((s) => s.trainId === trainId);
  if (!schedule?.active) return false;
  const day = new Date(`${date}T12:00:00+05:30`).getUTCDay();
  return (
    schedule.days === "Daily" ||
    (schedule.days === "Weekdays" ? day > 0 && day < 6 : day === 0 || day === 6)
  );
}
export function findJourneys(
  trains: Train[],
  search: JourneySearch,
  schedules: TrainSchedule[],
): Train[] {
  if (Object.keys(validateSearch(search)).length) return [];
  return trains
    .filter((t) => t.active && scheduledOn(t.id, search.date, schedules))
    .flatMap((train) => {
      const start = train.stops.findIndex((s) => s.station === search.from),
        end = train.stops.findIndex((s) => s.station === search.to);
      if (start < 0 || end <= start) return [];
      const first = train.stops[start],
        last = train.stops[end];
      if (departureHasPassed(search.date, first.time)) return [];
      const total =
        (minutes(train.arrivalTime) - minutes(train.departureTime) + 1440) %
        1440;
      const partial = (minutes(last.time) - minutes(first.time) + 1440) % 1440;
      const factor = total ? Math.max(0.3, partial / total) : 1;
      return [
        {
          ...train,
          departureStation: first.station,
          arrivalStation: last.station,
          departureTime: first.time,
          arrivalTime: last.time,
          duration: duration(first.time, last.time),
          stops: train.stops.slice(start, end + 1),
          classes: train.classes.map((c) => ({
            ...c,
            price: Math.round((c.price * factor) / 10) * 10,
          })),
        },
      ];
    });
}
export function coachFor(id: ClassId) {
  return id === "first"
    ? "A"
    : id === "second-reserved"
      ? "B"
      : id === "third-reserved"
        ? "C"
        : "Open seating";
}
export function seatMap(
  trainId: string,
  date: string,
  classId: ClassId,
  bookings: Booking[],
  selected: string[] = [],
): Seat[] {
  const fixed = new Set(["1A", "2B", "3D", "5A", "6C", "8D"]);
  // Reserve across the complete run to prevent overlapping segment bookings in the mock.
  bookings
    .filter(
      (b) =>
        b.journey.train.id === trainId &&
        b.journey.date === date &&
        b.classId === classId &&
        b.status === "Confirmed",
    )
    .forEach((b) => b.seats.forEach((s) => fixed.add(s)));
  return Array.from({ length: 32 }, (_, i) => {
    const number = `${Math.floor(i / 4) + 1}${"ABCD"[i % 4]}`;
    return {
      number,
      status: fixed.has(number)
        ? "reserved"
        : selected.includes(number)
          ? "selected"
          : "available",
    };
  });
}
export function availablePlaces(
  train: Train,
  date: string,
  classId: ClassId,
  bookings: Booking[],
) {
  const c = train.classes.find((c) => c.id === classId);
  if (!c) return 0;
  if (c.reserved)
    return seatMap(train.id, date, classId, bookings).filter(
      (s) => s.status !== "reserved",
    ).length;
  return Math.max(
    0,
    c.capacity -
      bookings
        .filter(
          (b) =>
            b.status === "Confirmed" &&
            b.journey.train.id === train.id &&
            b.journey.date === date &&
            b.classId === classId,
        )
        .reduce((sum, b) => sum + b.passengers.length, 0),
  );
}
export function totals(draft: BookingDraft) {
  const price =
    draft.journey?.train.classes.find((c) => c.id === draft.classId)?.price ??
    0;
  const count = draft.journey?.count ?? 0;
  const fare = price * count;
  const serviceFee = count * 50;
  return { price, fare, serviceFee, total: fare + serviceFee };
}
export function passengersReady(draft: BookingDraft) {
  return (
    !!draft.journey &&
    draft.passengers.length === draft.journey.count &&
    draft.passengers.every(
      (p) => Object.keys(validatePassenger(p)).length === 0,
    )
  );
}
export function seatsReady(draft: BookingDraft) {
  const travelClass = draft.journey?.train.classes.find(
    (c) => c.id === draft.classId,
  );
  return (
    !!travelClass &&
    (!travelClass.reserved ||
      (draft.seats.length === draft.journey?.count &&
        new Set(draft.seats).size === draft.seats.length))
  );
}
export function createBooking(
  draft: BookingDraft,
  method: PaymentMethod,
  bookings: Booking[],
  trains: Train[],
  schedules: TrainSchedule[],
): Booking {
  if (!draft.journey || !passengersReady(draft) || !seatsReady(draft))
    throw new Error("Complete passenger and seat selection before payment.");
  const journey = draft.journey;
  const live = findJourneys(trains, journey, schedules).find(
    (t) => t.id === journey.train.id,
  );
  if (!live)
    throw new Error(
      "This journey is no longer available. Please search again.",
    );
  const travelClass = live.classes.find((c) => c.id === draft.classId);
  if (!travelClass) throw new Error("Please select a travel class.");
  const quotedClass = journey.train.classes.find((c) => c.id === draft.classId);
  if (
    quotedClass?.price !== travelClass.price ||
    live.departureTime !== journey.train.departureTime ||
    live.arrivalTime !== journey.train.arrivalTime
  ) {
    throw new Error(
      "The train times or fares have changed. Start a new search before payment.",
    );
  }
  if (
    availablePlaces(live, journey.date, draft.classId, bookings) < journey.count
  )
    throw new Error(
      "There are not enough places. Please choose another class.",
    );
  const occupied = seatMap(live.id, journey.date, draft.classId, bookings)
    .filter((s) => s.status === "reserved")
    .map((s) => s.number);
  const validSeats = seatMap(
    live.id,
    journey.date,
    draft.classId,
    bookings,
  ).map((s) => s.number);
  if (
    travelClass.reserved &&
    draft.seats.some((s) => occupied.includes(s) || !validSeats.includes(s))
  )
    throw new Error(
      "One of these seats is unavailable. Please choose your seats again.",
    );
  const id = `SR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();
  const fare = travelClass.price * journey.count;
  const serviceFee = journey.count * 50;
  return {
    id,
    reference: id,
    journey: { ...journey, train: live },
    passengers: [...draft.passengers],
    classId: travelClass.id,
    className: travelClass.name,
    coach: coachFor(travelClass.id),
    seats: travelClass.reserved ? [...draft.seats] : [],
    fare,
    serviceFee,
    total: fare + serviceFee,
    status: "Confirmed",
    payment: {
      id: `PAY-${id}`,
      method,
      amount: fare + serviceFee,
      status: "simulated",
      paidAt: now,
    },
    createdAt: now,
  };
}
