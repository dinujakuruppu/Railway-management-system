"use client";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { departureHasPassed, formatDate } from "@/lib/format";
import StatCard from "@/components/dashboard/StatCard";
import BookingCard from "@/components/dashboard/BookingCard";
import UpcomingTripCard from "@/components/dashboard/UpcomingTripCard";
import PageHeading from "@/components/ui/PageHeading";
import { ButtonLink } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
export default function DashboardPage() {
  const { user, bookings, notices, ready } = useApp();
  if (!ready) return <LoadingSpinner />;
  const upcoming = bookings
    .filter(
      (b) =>
        b.status === "Confirmed" &&
        !departureHasPassed(b.journey.date, b.journey.train.departureTime),
    )
    .sort((a, b) =>
      (a.journey.date + a.journey.train.departureTime).localeCompare(
        b.journey.date + b.journey.train.departureTime,
      ),
    );
  return (
    <>
      <PageHeading
        eyebrow="Your travel companion"
        title={`Hello, ${user?.fullName.split(" ")[0] ?? "traveller"}.`}
        description="Your journeys and tickets, all together."
        action={<ButtonLink href="/trains">+ Quick book</ButtonLink>}
      />
      {!user && (
        <p className="alert mb-6">
          You are exploring the guest demo.{" "}
          <Link className="link" href="/login">
            Sign in
          </Link>{" "}
          to try the sample profile.
        </p>
      )}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        <StatCard label="Upcoming trips" value={upcoming.length} icon="train" />
        <StatCard
          label="Total bookings"
          value={bookings.length}
          icon="ticket"
        />
        <StatCard
          label="Completed journeys"
          value={bookings.filter((b) => b.status === "Completed").length}
          icon="check"
        />
        <StatCard
          label="Cancelled bookings"
          value={bookings.filter((b) => b.status === "Cancelled").length}
          icon="close"
        />
      </div>
      <div className="grid xl:grid-cols-[1.2fr_1fr] gap-6 mb-8">
        {upcoming[0] ? (
          <UpcomingTripCard booking={upcoming[0]} />
        ) : (
          <EmptyState
            icon="train"
            title="Your next journey awaits"
            description="Choose a destination and plan something to look forward to."
          >
            <ButtonLink href="/trains">Book a journey</ButtonLink>
          </EmptyState>
        )}
        <section className="card panel">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold m-0">Railway updates</h2>
            <Link className="text-maroon text-xs font-bold" href="/notices">
              View all
            </Link>
          </div>
          {notices
            .filter((n) => n.published)
            .slice(0, 3)
            .map((n) => (
              <Link
                key={n.id}
                href={`/notices#${n.id}`}
                className="notice-item"
              >
                <p className="text-xs text-muted mb-2">
                  {n.category} · {formatDate(n.date, true)}
                </p>
                <p className="text-sm font-semibold mb-0">{n.title}</p>
              </Link>
            ))}
        </section>
      </div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title m-0">Recent bookings</h2>
        <Link
          className="text-sm text-maroon font-semibold"
          href="/dashboard/bookings"
        >
          All bookings →
        </Link>
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        {bookings.slice(0, 4).map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </div>
      <p className="text-xs text-muted mt-5">
        This workspace includes sample bookings and bookings made in this
        browser tab.
      </p>
    </>
  );
}
