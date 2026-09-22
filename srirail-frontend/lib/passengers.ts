import type { Booking, User } from "@/types";
export interface PassengerRecord {
  identity: string;
  fullName: string;
  email: string;
  mobile: string;
  bookings: number;
}
export function passengerRecords(
  bookings: Booking[],
  user: User | null,
): PassengerRecord[] {
  const records = new Map<string, PassengerRecord>();
  for (const booking of bookings) {
    for (const p of booking.passengers) {
      const existing = records.get(p.identity);
      records.set(p.identity, {
        identity: p.identity,
        fullName: p.fullName,
        email: p.email,
        mobile: p.mobile,
        bookings: (existing?.bookings ?? 0) + 1,
      });
    }
  }
  if (user) {
    const previous = records.get(user.identity);
    records.set(user.identity, { ...user, bookings: previous?.bookings ?? 0 });
  }
  return [...records.values()];
}
