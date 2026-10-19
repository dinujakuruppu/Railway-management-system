"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Booking } from "@/types";
import { departureHasPassed, formatDate, money } from "@/lib/format";
import { downloadTicket } from "@/lib/ticket";
import PageHeading from "@/components/ui/PageHeading";
import Button, { ButtonLink } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
export default function BookingsPage({ admin = false }: { admin?: boolean }) {
  const { bookings, cancelBooking, ready } = useApp();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [message, setMessage] = useState("");
  const visible = bookings.filter(
    (b) =>
      (status === "All statuses" || b.status === status) &&
      `${b.reference} ${b.journey.train.name} ${b.journey.from} ${b.journey.to} ${b.passengers.map((p) => p.fullName).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  if (!ready) return <LoadingSpinner />;
  return (
    <>
      <PageHeading
        eyebrow={admin ? "Reservations" : "Passenger account"}
        title={admin ? "Manage bookings" : "My bookings"}
        description="Find your travel details, download tickets and manage upcoming journeys."
        action={
          !admin ? (
            <ButtonLink href="/trains">Book a journey</ButtonLink>
          ) : undefined
        }
      />
      <div className="card panel mb-6 grid sm:grid-cols-[1fr_210px] gap-5">
        <Input
          label="Search bookings"
          placeholder="Reference, train, route or passenger"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          label="Booking status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {["All statuses", "Confirmed", "Completed", "Cancelled"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </div>
      {message && (
        <p role="status" className="alert alert-success mb-5">
          {message}
        </p>
      )}
      {visible.length ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Booking / Train</th>
                <th>Journey</th>
                <th>Class / Seat</th>
                <th>Status</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong className="text-xs font-mono">{b.reference}</strong>
                    <small>{b.journey.train.name}</small>
                  </td>
                  <td>
                    {b.journey.from} → {b.journey.to}
                    <small>
                      {formatDate(b.journey.date, true)} ·{" "}
                      {b.journey.train.departureTime}
                    </small>
                  </td>
                  <td>
                    {b.className}
                    <small>
                      {b.seats.length
                        ? `Coach ${b.coach} · ${b.seats.join(", ")}`
                        : "Unreserved"}
                    </small>
                  </td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="font-semibold">{money(b.total)}</td>
                  <td>
                    <div className="flex gap-2">
                      <ButtonLink
                        variant="secondary"
                        href={`/dashboard/bookings/${b.id}`}
                        className="!text-xs !min-h-9 !px-3"
                      >
                        View ticket
                      </ButtonLink>
                      <Button
                        variant="ghost"
                        className="!text-xs !min-h-9 !px-3"
                        onClick={() => downloadTicket(b)}
                      >
                        Download
                      </Button>
                      {b.status === "Confirmed" &&
                        !departureHasPassed(
                          b.journey.date,
                          b.journey.train.departureTime,
                        ) && (
                          <Button
                            variant="danger"
                            className="!text-xs !min-h-9 !px-3"
                            onClick={() => setCancelling(b)}
                          >
                            Cancel
                          </Button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No bookings found"
          description="Try another search or status filter."
        />
      )}
      <p className="text-xs text-muted mt-4">
        {visible.length} bookings shown · All payments and cancellations are
        simulated.
      </p>
      <Modal
        open={!!cancelling}
        title="Cancel this demo booking?"
        onClose={() => setCancelling(null)}
      >
        <p className="text-muted mb-5">
          Booking <strong>{cancelling?.reference}</strong> will be marked
          cancelled and its seats released in this demo. No real refund is
          processed.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setCancelling(null)}>
            Keep booking
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (cancelling) {
                cancelBooking(cancelling.id);
                setMessage(
                  `Booking ${cancelling.reference} has been cancelled in this demo.`,
                );
              }
              setCancelling(null);
            }}
          >
            Confirm cancellation
          </Button>
        </div>
      </Modal>
    </>
  );
}
