export interface Station {
  id: string;
  name: string;
  province: string;
}
export type ClassId =
  | "first"
  | "second-reserved"
  | "third-reserved"
  | "second"
  | "third";
export interface TrainClass {
  id: ClassId;
  name: string;
  description: string;
  price: number;
  reserved: boolean;
  capacity: number;
}
export interface TrainStop {
  station: string;
  time: string;
}
export interface Train {
  id: string;
  trainNumber: string;
  name: string;
  type: "Intercity" | "Express" | "Commuter";
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: TrainStop[];
  facilities: string[];
  classes: TrainClass[];
  active: boolean;
}
export interface TrainSchedule {
  id: string;
  trainId: string;
  days: "Daily" | "Weekdays" | "Weekends";
  active: boolean;
}
export interface Passenger {
  id: string;
  fullName: string;
  identity: string;
  email: string;
  mobile: string;
  type: "Adult" | "Child" | "Senior Citizen";
  gender: "Not specified" | "Female" | "Male";
}
export interface Seat {
  number: string;
  status: "available" | "selected" | "reserved";
}
export interface JourneySearch {
  from: string;
  to: string;
  date: string;
  count: number;
}
export interface Journey extends JourneySearch {
  train: Train;
}
export interface BookingDraft {
  journey: Journey | null;
  passengers: Passenger[];
  classId: ClassId;
  seats: string[];
}
export type BookingStatus = "Confirmed" | "Completed" | "Cancelled";
export type PaymentMethod = "card" | "lankaqr" | "mobile";
export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  status: "simulated";
  paidAt: string;
}
export interface Booking {
  id: string;
  reference: string;
  journey: Journey;
  passengers: Passenger[];
  classId: ClassId;
  className: string;
  coach: string;
  seats: string[];
  fare: number;
  serviceFee: number;
  total: number;
  status: BookingStatus;
  payment: Payment;
  createdAt: string;
}
export interface RailwayNotice {
  id: string;
  title: string;
  date: string;
  category:
    | "Service update"
    | "Special service"
    | "Schedule change"
    | "Announcement";
  description: string;
  published: boolean;
}
export interface User {
  id: string;
  fullName: string;
  identity: string;
  email: string;
  mobile: string;
}
export interface AppState {
  user: User | null;
  bookings: Booking[];
  trains: Train[];
  schedules: TrainSchedule[];
  notices: RailwayNotice[];
  draft: BookingDraft;
  lastBookingId: string | null;
}
