"use client";
import {
  createContext,
  useCallback,
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
import { sampleNotices } from "@/data/notices";
import { request } from "@/lib/client-api";

export const emptyDraft: BookingDraft = {
  journey: null,
  passengers: [],
  classId: "second-reserved",
  seats: [],
};
type Role = "passenger" | "admin" | null;
type Bootstrap = Pick<
  AppState,
  "user" | "bookings" | "trains" | "schedules" | "notices"
> & { role: Role; adminBookings?: Booking[] };
function initialState(): AppState {
  return {
    user: null,
    bookings: [],
    trains: [],
    schedules: [],
    notices: [],
    draft: emptyDraft,
    lastBookingId: null,
  };
}
interface AppContextValue extends AppState {
  ready: boolean;
  role: Role;
  connected: boolean;
  storageWarning: string;
  adminBookings: Booking[];
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    values: Omit<User, "id"> & { password: string },
  ) => Promise<string>;
  logout: () => Promise<void>;
  updateProfile: (user: User) => Promise<void>;
  startJourney: (journey: Journey) => void;
  updateDraft: (patch: Partial<BookingDraft>) => void;
  pay: (method: PaymentMethod) => Promise<Booking>;
  cancelBooking: (id: string) => Promise<void>;
  saveTrain: (train: Train) => Promise<void>;
  saveSchedule: (schedule: TrainSchedule) => Promise<void>;
  saveNotice: (notice: RailwayNotice) => Promise<void>;
}
const Context = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const current = useRef(state);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [connected, setConnected] = useState(false);
  const [storageWarning, setStorageWarning] = useState("");
  const [adminBookings, setAdminBookings] = useState<Booking[]>([]);
  const authEpoch = useRef(0);
  const idempotencyKey = useRef<string | null>(null);
  const paymentInFlight = useRef<Promise<Booking> | null>(null);
  const update = useCallback((patch: Partial<AppState>) => {
    const next = { ...current.current, ...patch };
    current.current = next;
    setState(next);
  }, []);
  const refresh = useCallback(async () => {
    const epoch = authEpoch.current;
    const data = await request<Bootstrap>("/api/bootstrap");
    if (epoch !== authEpoch.current) return;
    update({
      user: data.user,
      bookings: data.bookings,
      trains: data.trains,
      schedules: data.schedules,
      notices: data.notices,
    });
    setRole(data.role);
    setAdminBookings(data.adminBookings ?? []);
    setConnected(true);
    setStorageWarning("");
  }, [update]);
  useEffect(() => {
    let active = true;
    // Old prototype sessions contain unverified users and must never be trusted.
    try {
      sessionStorage.removeItem("srirail-demo-v1");
    } catch {
      /* Optional browser storage. */
    }
    void refresh()
      .catch((error: unknown) => {
        if (!active) return;
        update({
          trains: allTrains,
          schedules,
          notices: sampleNotices(),
          user: null,
          bookings: [],
        });
        setRole(null);
        setConnected(false);
        setStorageWarning(
          `${error instanceof Error ? error.message : "The backend is unavailable."} Read-only sample preview: account and booking actions require the configured backend.`,
        );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [refresh, update]);
  async function saveEntity(path: string, body: unknown) {
    await request(path, { method: "PUT", body: JSON.stringify(body) });
    // A saved write remains successful even if the following read is interrupted.
    try {
      await refresh();
    } catch {
      setStorageWarning(
        "Your change was saved. Refresh the page to load the latest data.",
      );
    }
  }
  async function pay(method: PaymentMethod): Promise<Booking> {
    if (paymentInFlight.current) return paymentInFlight.current;
    const s = current.current;
    if (!s.user) throw new Error("Sign in before creating a booking.");
    if (!s.draft.journey) {
      const existing = s.bookings.find((b) => b.id === s.lastBookingId);
      if (existing) return existing;
      throw new Error("Choose your journey first.");
    }
    const journey = s.draft.journey;
    const epoch = authEpoch.current;
    idempotencyKey.current ??= crypto.randomUUID();
    const pending = request<{ booking: Booking }>("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        trainId: journey.train.id,
        from: journey.from,
        to: journey.to,
        date: journey.date,
        count: journey.count,
        classId: s.draft.classId,
        passengers: s.draft.passengers,
        seats: s.draft.seats,
        method,
        idempotencyKey: idempotencyKey.current,
        quotedPrice: journey.train.classes.find((c) => c.id === s.draft.classId)
          ?.price,
        quotedDepartureTime: journey.train.departureTime,
        quotedArrivalTime: journey.train.arrivalTime,
      }),
    })
      .then(({ booking }) => {
        if (epoch !== authEpoch.current)
          throw new Error(
            "Your account session changed. Check your bookings before trying again.",
          );
        update({
          bookings: [
            booking,
            ...current.current.bookings.filter((b) => b.id !== booking.id),
          ],
          lastBookingId: booking.id,
          draft: emptyDraft,
        });
        if (role === "admin")
          setAdminBookings((bookings) => [
            booking,
            ...bookings.filter((b) => b.id !== booking.id),
          ]);
        return booking;
      })
      .finally(() => {
        paymentInFlight.current = null;
      });
    paymentInFlight.current = pending;
    return pending;
  }
  return (
    <Context.Provider
      value={{
        ...state,
        ready,
        role,
        connected,
        storageWarning,
        adminBookings,
        refresh,
        login: async (email, password) => {
          authEpoch.current += 1;
          await request("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          await refresh();
        },
        register: async (values) => {
          authEpoch.current += 1;
          const result = await request<{ message?: string }>(
            "/api/auth/register",
            { method: "POST", body: JSON.stringify(values) },
          );
          await refresh();
          return (
            result.message ??
            "Account created. Check your email to confirm your account before signing in."
          );
        },
        logout: async () => {
          authEpoch.current += 1;
          await request("/api/auth/logout", { method: "POST", body: "{}" });
          update({
            user: null,
            bookings: [],
            notices: current.current.notices.filter((n) => n.published),
            trains: current.current.trains.filter((t) => t.active),
            schedules: current.current.schedules.filter((s) => s.active),
            draft: emptyDraft,
            lastBookingId: null,
          });
          setRole(null);
          setAdminBookings([]);
          idempotencyKey.current = null;
          await refresh();
        },
        updateProfile: async (user) => {
          const epoch = authEpoch.current;
          const result = await request<{ user: User }>("/api/profile", {
            method: "PATCH",
            body: JSON.stringify({
              fullName: user.fullName.trim(),
              identity: user.identity.trim().toUpperCase(),
              mobile: user.mobile.trim(),
            }),
          });
          if (epoch !== authEpoch.current)
            throw new Error(
              "Your account session changed. Please sign in again.",
            );
          update({ user: result.user });
        },
        startJourney: (journey) => {
          idempotencyKey.current = crypto.randomUUID();
          update({ draft: { ...emptyDraft, journey }, lastBookingId: null });
        },
        updateDraft: (patch) =>
          update({ draft: { ...current.current.draft, ...patch } }),
        pay,
        cancelBooking: async (id) => {
          const { booking } = await request<{ booking: Booking }>(
            `/api/bookings/${encodeURIComponent(id)}/cancel`,
            { method: "POST", body: "{}" },
          );
          update({
            bookings: current.current.bookings.map((b) =>
              b.id === id ? booking : b,
            ),
          });
          setAdminBookings((bookings) =>
            bookings.map((b) => (b.id === id ? booking : b)),
          );
        },
        saveTrain: (train) => saveEntity("/api/admin/trains", train),
        saveSchedule: (schedule) =>
          saveEntity("/api/admin/schedules", schedule),
        saveNotice: (notice) => saveEntity("/api/admin/notices", notice),
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
