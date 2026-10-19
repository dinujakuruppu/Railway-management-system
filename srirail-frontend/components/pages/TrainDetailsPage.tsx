"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { findJourneys } from "@/lib/booking";
import { dateOffset, formatDate, money, searchQuery } from "@/lib/format";
import Button, { ButtonLink } from "@/components/ui/Button";
import PageHeading from "@/components/ui/PageHeading";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import JourneyTimes from "@/components/booking/JourneyTimes";
export default function TrainDetailsPage({ id }: { id: string }) {
  const { trains, schedules, connected, startJourney, ready } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  if (!ready) return <LoadingSpinner />;
  const original = trains.find((t) => t.id === id);
  const search = {
    from: params.get("from") ?? original?.departureStation ?? "Colombo Fort",
    to: params.get("to") ?? original?.arrivalStation ?? "Kandy",
    date: params.get("date") ?? dateOffset(1),
    count: Number(params.get("count") ?? 1),
  };
  const train = findJourneys(trains, search, schedules).find(
    (t) => t.id === id,
  );
  if (!train)
    return (
      <div className="container page-section">
        <EmptyState
          title="This service is unavailable"
          description="Choose another train or travel date to continue."
        >
          <ButtonLink href="/trains">Search trains</ButtonLink>
        </EmptyState>
      </div>
    );
  return (
    <div className="container page-section">
      <Link className="link text-sm" href={`/trains?${searchQuery(search)}`}>
        ← Back to search results
      </Link>
      <div className="mt-6">
        <PageHeading
          eyebrow={`Train #${train.trainNumber}`}
          title={train.name}
          description={`${train.departureStation} to ${train.arrivalStation}`}
          action={<Badge tone="brand">{train.type}</Badge>}
        />
      </div>
      <div className="detail-grid">
        <div className="space-y-6">
          <section className="card panel">
            <div className="flex justify-between items-center">
              <h2 className="font-bold">Journey details</h2>
              <span className="text-sm text-muted">
                {formatDate(search.date, true)}
              </span>
            </div>
            <JourneyTimes train={train} />
            <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-5">
              {train.facilities.map((f) => (
                <span className="text-sm flex items-center gap-2" key={f}>
                  <Icon name="check" size={16} />
                  {f}
                </span>
              ))}
            </div>
          </section>
          <section className="card overflow-hidden">
            <h2 className="text-lg font-bold p-6 m-0">Classes & fares</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Travel class</th>
                    <th>Fare / person</th>
                    <th>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {train.classes.map((c) => (
                    <tr key={c.id}>
                      <td className="font-semibold">
                        {c.name}
                        <small>
                          {c.reserved ? "Reserved seat" : "Open seating"}
                        </small>
                      </td>
                      <td>{money(c.price)}</td>
                      <td>
                        <Badge tone="neutral">Checked at seat selection</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-6 py-4 text-xs text-muted m-0">
              A service fee of LKR 50 per passenger is added at checkout. Demo
              fares are the same for all passenger types.
            </p>
          </section>
          <section className="card panel">
            <h2 className="text-lg font-bold mb-6">Along the way</h2>
            {train.stops.map((stop) => (
              <div className="timeline-stop" key={stop.station}>
                <time>{stop.time}</time>
                <span>{stop.station}</span>
              </div>
            ))}
          </section>
        </div>
        <aside className="card journey-summary">
          <p className="eyebrow">Your journey</p>
          <h2 className="text-xl font-bold">Let’s get you on board</h2>
          <p className="text-muted text-sm">
            {formatDate(search.date)}
            <br />
            {search.count} {search.count === 1 ? "passenger" : "passengers"}
          </p>
          <div className="summary-row">
            <span>Fares from</span>
            <strong>
              {money(Math.min(...train.classes.map((c) => c.price)))}
            </strong>
          </div>
          <Button
            className="w-full mt-6"
            disabled={!connected}
            onClick={() => {
              startJourney({ ...search, train });
              router.push("/booking/passengers");
            }}
          >
            Book now
            <Icon name="arrow" size={18} />
          </Button>
          <p className="text-xs text-muted mt-4 mb-0">
            Choose your class and seats in the next steps.
          </p>
        </aside>
      </div>
    </div>
  );
}
