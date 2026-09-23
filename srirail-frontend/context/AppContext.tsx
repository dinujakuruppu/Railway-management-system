"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppState,
  Booking,
  BookingDraft,
  Journey,
  PaymentMethod,
  RailwayNotice,
  Train,
  TrainSchedule,
  User,
} from "@/types";
import { allTrains, schedules } from "@/data/trains";
import { sampleBookings } from "@/data/bookings";
import { sampleNotices } from "@/data/notices";
import { createBooking } from "@/lib/booking";
import { departureHasPassed } from "@/lib/format";
const KEY = "srirail-demo-v1";
export const emptyDraft: BookingDraft = {
  journey: null,
  passengers: [],
  classId: "second-reserved",
  seats: [],
};
function initialState(): AppState {
  return {
    user: null,
    bookings: sampleBookings(),
    trains: allTrains,
    schedules,
    notices: sampleNotices(),
    draft: emptyDraft,
    lastBookingId: null,
  };
}
interface AppContextValue extends AppState {
  ready: boolean;
  storageWarning: string;
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (user: User) => void;
  startJourney: (journey: Journey) => void;
  updateDraft: (patch: Partial<BookingDraft>) => void;
  pay: (method: PaymentMethod) => Booking;
  cancelBooking: (id: string) => void;
  saveTrain: (train: Train) => void;
  saveSchedule: (schedule: TrainSchedule) => void;
  saveNotice: (notice: RailwayNotice) => void;
  resetDemo: () => void;
}
const Context = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const current = useRef(state);
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState("");
  function commit(next: AppState) {
    current.current = next;
    setState(next);
  }
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const stored: unknown = JSON.parse(raw);
        if (
          stored &&
          typeof stored === "object" &&
          "version" in stored &&
          stored.version === 1 &&
          "state" in stored
        ) {
          const s = stored.state as AppState;
          if (
            Array.isArray(s.trains) &&
            Array.isArray(s.bookings) &&
            Array.isArray(s.schedules) &&
            Array.isArray(s.notices) &&
            s.draft &&
            "user" in s
          ) {
            current.current = s;
            setState(s);
          }
        }
      }
    } catch {
      setStorageWarning(
        "Your previous demo session could not be loaded. A fresh session is ready.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ version: 1, state }));
    } catch {
      setStorageWarning(
        "Browser storage is unavailable. Your changes will last until this page is refreshed.",
      );
    }
  }, [state, ready]);
  function update(patch: Partial<AppState>) {
    commit({ ...current.current, ...patch });
  }
  function pay(method: PaymentMethod) {
    const s = current.current;
    // The ref is updated synchronously so a second click cannot create a duplicate booking.
    if (!s.draft.journey && s.lastBookingId) {
      const existing = s.bookings.find((b) => b.id === s.lastBookingId);
      if (existing) return existing;
    }
    const booking = createBooking(
      s.draft,
      method,
      s.bookings,
      s.trains,
      s.schedules,
    );
    commit({
      ...s,
      bookings: [booking, ...s.bookings],
      lastBookingId: booking.id,
      draft: emptyDraft,
    });
    return booking;
  }
  return (
    <Context.Provider
      value={{
        ...state,
        ready,
        storageWarning,
        login: (user) => update({ user }),
        logout: () => update({ user: null }),
        updateProfile: (user) => update({ user }),
        startJourney: (journey) =>
          update({ draft: { ...emptyDraft, journey }, lastBookingId: null }),
        updateDraft: (patch) =>
          update({ draft: { ...current.current.draft, ...patch } }),
        pay,
        cancelBooking: (id) => {
          const b = current.current.bookings.find((b) => b.id === id);
          if (
            !b ||
            b.status !== "Confirmed" ||
            departureHasPassed(b.journey.date, b.journey.train.departureTime)
          )
            return;
          update({
            bookings: current.current.bookings.map((b) =>
              b.id === id ? { ...b, status: "Cancelled" } : b,
            ),
          });
        },
        saveTrain: (train) => {
          const exists = current.current.trains.some((t) => t.id === train.id);
          update({
            trains: exists
              ? current.current.trains.map((t) =>
                  t.id === train.id ? train : t,
                )
              : [...current.current.trains, train],
            schedules: exists
              ? current.current.schedules
              : [
                  ...current.current.schedules,
                  {
                    id: `schedule-${train.id}`,
                    trainId: train.id,
                    active: true,
                    days: "Daily",
                  },
                ],
          });
        },
        saveSchedule: (schedule) =>
          update({
            schedules: current.current.schedules.map((s) =>
              s.id === schedule.id ? schedule : s,
            ),
          }),
        saveNotice: (notice) =>
          update({
            notices: current.current.notices.some((n) => n.id === notice.id)
              ? current.current.notices.map((n) =>
                  n.id === notice.id ? notice : n,
                )
              : [notice, ...current.current.notices],
          }),
        resetDemo: () => commit(initialState()),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error("useApp requires AppProvider");
  return context;
}
