"use client";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { money, today } from "@/lib/format";
import { passengerRecords } from "@/lib/passengers";
import { scheduledOn } from "@/lib/booking";
import PageHeading from "@/components/ui/PageHeading";
import StatCard from "@/components/dashboard/StatCard";
import Button, { ButtonLink } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
export default function AdminOverview() {
  const { bookings, trains, schedules, notices, user, resetDemo } = useApp();
  const [reset, setReset] = useState(false);
  const revenue = bookings
    .filter((b) => b.status !== "Cancelled")
    .reduce((sum, b) => sum + b.total, 0);
  return (
    <>
      <PageHeading
        eyebrow="Operations overview"
        title="A clear view of the network"
        description="Sample railway activity and bookings in this browser session."
        action={
          <Button variant="secondary" onClick={() => setReset(true)}>
            Reset demo
          </Button>
        }
      />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-7">
        <StatCard
          label="Total bookings"
          value={bookings.length}
          icon="ticket"
        />
        <StatCard
          label="Simulated revenue"
          value={money(revenue)}
          icon="card"
          note="Excludes cancelled bookings"
        />
        <StatCard
          label="Active trains"
          value={trains.filter((t) => t.active).length}
          icon="train"
        />
        <StatCard
          label="Registered passengers · Demo"
          value={passengerRecords(bookings, user).length}
          icon="user"
          note="Unique identities in this session"
        />
        <StatCard
          label="Today’s scheduled journeys"
          value={
            trains.filter(
              (t) => t.active && scheduledOn(t.id, today(), schedules),
            ).length
          }
          icon="calendar"
        />
        <StatCard
          label="Published notices"
          value={notices.filter((n) => n.published).length}
          icon="bell"
        />
      </div>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <section className="card overflow-hidden">
          <div className="flex justify-between p-6">
            <h2 className="text-lg font-bold m-0">Latest bookings</h2>
            <Link
              href="/admin/bookings"
              className="text-sm text-maroon font-semibold"
            >
              View all
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Journey</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b.id}>
                    <td className="font-mono text-xs">{b.reference}</td>
                    <td>
                      {b.journey.to}
                      <small>{b.journey.train.name}</small>
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card panel">
          <h2 className="text-lg font-bold mb-5">Manage the service</h2>
          <div className="grid gap-3">
            <ButtonLink href="/admin/trains" variant="secondary">
              Add or edit trains
            </ButtonLink>
            <ButtonLink href="/admin/schedules" variant="secondary">
              Update operating schedules
            </ButtonLink>
            <ButtonLink href="/admin/notices" variant="secondary">
              Publish a travel notice
            </ButtonLink>
          </div>
          <p className="text-xs text-muted mt-5 mb-0">
            Admin changes update the passenger screens in this tab. There is no
            backend or access control in this frontend prototype.
          </p>
        </section>
      </div>
      <Modal
        open={reset}
        title="Restore sample data?"
        onClose={() => setReset(false)}
      >
        <p className="text-muted mb-6">
          This clears bookings, profile edits and admin changes in the current
          demo session and restores the original examples.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setReset(false)}>
            Keep my changes
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              resetDemo();
              setReset(false);
            }}
          >
            Reset demo data
          </Button>
        </div>
      </Modal>
    </>
  );
}
