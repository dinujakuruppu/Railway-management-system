import type { Booking, User } from "@/types";
import { allTrains } from "@/data/trains";
import { dateOffset } from "@/lib/format";
export const demoUser: User = {
  id: "demo-passenger",
  fullName: "Nimali Perera",
  identity: "200012345678",
  email: "nimali@example.com",
  mobile: "0771234567",
};
export function sampleBookings(): Booking[] {
  return [
    {
      id: "SR-DEMO-1001",
      train: allTrains[0],
      date: dateOffset(3),
      status: "Confirmed" as const,
    },
    {
      id: "SR-DEMO-1002",
      train: allTrains[5],
      date: dateOffset(-8),
      status: "Completed" as const,
    },
    {
      id: "SR-DEMO-1003",
      train: allTrains[6],
      date: dateOffset(8),
      status: "Cancelled" as const,
    },
  ].map((item, index) => {
    const travelClass = item.train.classes[1];
    const fare = travelClass.price;
    return {
      id: item.id,
      reference: item.id,
      journey: {
        from: item.train.departureStation,
        to: item.train.arrivalStation,
        date: item.date,
        count: 1,
        train: item.train,
      },
      passengers: [
        {
          id: `sample-person-${index}`,
          fullName: demoUser.fullName,
          identity: demoUser.identity,
          email: demoUser.email,
          mobile: demoUser.mobile,
          type: "Adult",
          gender: "Not specified",
        },
      ],
      classId: travelClass.id,
      className: travelClass.name,
      coach: "B",
      seats: ["4A"],
      fare,
      serviceFee: 50,
      total: fare + 50,
      status: item.status,
      payment: {
        id: `DEMO-PAY-${index}`,
        method: "card",
        amount: fare + 50,
        status: "simulated",
        paidAt: `${dateOffset(-10)}T08:00:00.000Z`,
      },
      createdAt: `${dateOffset(-10)}T08:00:00.000Z`,
    };
  });
}
