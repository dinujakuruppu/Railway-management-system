import type { Train, TrainClass, TrainSchedule, TrainStop } from "@/types";
import { duration } from "@/lib/format";
export function makeClasses(base = 350): TrainClass[] {
  return [
    {
      id: "first",
      name: "First Class",
      description:
        "Air-conditioned coach, reclining seats and a reserved place.",
      price: base * 5,
      reserved: true,
      capacity: 32,
    },
    {
      id: "second-reserved",
      name: "Second Class Reserved",
      description:
        "A reserved seat with opening windows and comfortable seating.",
      price: base * 3,
      reserved: true,
      capacity: 32,
    },
    {
      id: "third-reserved",
      name: "Third Class Reserved",
      description: "An affordable reserved seat in a standard coach.",
      price: base * 2,
      reserved: true,
      capacity: 32,
    },
    {
      id: "second",
      name: "Second Class",
      description: "Open seating. A seat is not guaranteed on this ticket.",
      price: Math.round(base * 1.5),
      reserved: false,
      capacity: 100,
    },
    {
      id: "third",
      name: "Third Class",
      description:
        "Economy travel with open seating. A seat is not guaranteed.",
      price: base,
      reserved: false,
      capacity: 140,
    },
  ];
}
function train(
  id: string,
  trainNumber: string,
  name: string,
  type: Train["type"],
  stops: TrainStop[],
  base: number,
): Train {
  const first = stops[0],
    last = stops[stops.length - 1];
  return {
    id,
    trainNumber,
    name,
    type,
    departureStation: first.station,
    arrivalStation: last.station,
    departureTime: first.time,
    arrivalTime: last.time,
    duration: duration(first.time, last.time),
    stops,
    facilities: ["On-board restrooms", "Luggage racks", "Reserved coaches"],
    classes: makeClasses(base),
    active: true,
  };
}
export const trains: Train[] = [
  train(
    "intercity-1015",
    "1015",
    "Intercity Express",
    "Intercity",
    [
      { station: "Colombo Fort", time: "07:00" },
      { station: "Maradana", time: "07:08" },
      { station: "Kandy", time: "09:35" },
    ],
    350,
  ),
  train(
    "podi-1005",
    "1005",
    "Podi Menike",
    "Express",
    [
      { station: "Colombo Fort", time: "05:55" },
      { station: "Maradana", time: "06:03" },
      { station: "Kandy", time: "08:55" },
      { station: "Nanu Oya", time: "12:30" },
      { station: "Ella", time: "15:10" },
      { station: "Badulla", time: "16:15" },
    ],
    700,
  ),
  train(
    "udarata-1015",
    "1007",
    "Udarata Menike",
    "Express",
    [
      { station: "Colombo Fort", time: "08:30" },
      { station: "Maradana", time: "08:38" },
      { station: "Kandy", time: "11:15" },
      { station: "Nanu Oya", time: "14:45" },
      { station: "Ella", time: "17:25" },
      { station: "Badulla", time: "18:30" },
    ],
    750,
  ),
  train(
    "intercity-1029",
    "1029",
    "Afternoon Intercity",
    "Intercity",
    [
      { station: "Colombo Fort", time: "15:35" },
      { station: "Kandy", time: "18:10" },
    ],
    400,
  ),
  train(
    "ruhunu-8056",
    "8056",
    "Ruhunu Kumari",
    "Express",
    [
      { station: "Maradana", time: "15:25" },
      { station: "Colombo Fort", time: "15:35" },
      { station: "Galle", time: "17:55" },
      { station: "Matara", time: "18:45" },
    ],
    500,
  ),
  train(
    "coastal-8050",
    "8050",
    "Coastal Express",
    "Express",
    [
      { station: "Colombo Fort", time: "06:50" },
      { station: "Galle", time: "09:10" },
      { station: "Matara", time: "10:00" },
    ],
    500,
  ),
  train(
    "yal-4077",
    "4077",
    "Yal Devi",
    "Express",
    [
      { station: "Colombo Fort", time: "06:35" },
      { station: "Kurunegala", time: "08:30" },
      { station: "Anuradhapura", time: "10:25" },
      { station: "Jaffna", time: "14:15" },
    ],
    900,
  ),
  train(
    "udaya-6011",
    "6011",
    "Udaya Devi",
    "Express",
    [
      { station: "Colombo Fort", time: "06:05" },
      { station: "Kurunegala", time: "08:15" },
      { station: "Batticaloa", time: "14:45" },
    ],
    850,
  ),
  train(
    "trinco-7083",
    "7083",
    "Eastern Express",
    "Express",
    [
      { station: "Colombo Fort", time: "07:10" },
      { station: "Kurunegala", time: "09:15" },
      { station: "Trincomalee", time: "14:30" },
    ],
    800,
  ),
];
// Reverse services are separate illustrative runs, not official timetable records.
const reverseTrains = trains.slice(0, 9).map((item, index) => {
  const origin =
    Number(item.departureTime.slice(0, 2)) * 60 +
    Number(item.departureTime.slice(3));
  const end =
    Number(item.arrivalTime.slice(0, 2)) * 60 +
    Number(item.arrivalTime.slice(3));
  const start = 6 * 60 + index * 12;
  const stops = [...item.stops].reverse().map((stop) => {
    const m =
      start +
      end -
      (Number(stop.time.slice(0, 2)) * 60 + Number(stop.time.slice(3)));
    return {
      station: stop.station,
      time: `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
    };
  });
  void origin;
  return train(
    `${item.id}-return`,
    `${Number(item.trainNumber) + 1}`,
    `${item.name} · Return`,
    item.type,
    stops,
    item.classes[4].price,
  );
});
export const allTrains = [...trains, ...reverseTrains];
export const schedules: TrainSchedule[] = allTrains.map((item) => ({
  id: `schedule-${item.id}`,
  trainId: item.id,
  days: "Daily",
  active: true,
}));
