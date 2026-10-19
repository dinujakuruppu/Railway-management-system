"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { findJourneys } from "@/lib/booking";
import { formatDate, searchQuery } from "@/lib/format";
import JourneySearchForm, {
  defaultSearch,
} from "@/components/booking/JourneySearchForm";
import PageHeading from "@/components/ui/PageHeading";
import EmptyState from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
export default function SchedulePage() {
  const [search, setSearch] = useState(defaultSearch);
  const { trains, schedules } = useApp();
  const results = findJourneys(trains, search, schedules);
  return (
    <div className="container page-section">
      <PageHeading
        eyebrow="Plan ahead"
        title="Railway schedules"
        description="Browse sample departures and stops for your travel date."
      />
      <JourneySearchForm initial={search} onSearch={setSearch} compact />
      <section className="card overflow-hidden mt-8">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-1">
            {search.from} → {search.to}
          </h2>
          <p className="text-sm text-muted mb-0">
            {formatDate(search.date)} · {results.length} services
          </p>
        </div>
        {results.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Train</th>
                  <th>Departure</th>
                  <th>Arrival</th>
                  <th>Duration</th>
                  <th>Operation</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {results.map((train) => (
                  <tr key={train.id}>
                    <td>
                      <strong>{train.name}</strong>
                      <small>
                        #{train.trainNumber} · {train.type}
                      </small>
                    </td>
                    <td>{train.departureTime}</td>
                    <td>{train.arrivalTime}</td>
                    <td>{train.duration}</td>
                    <td>
                      {schedules.find((s) => s.trainId === train.id)?.days}
                    </td>
                    <td>
                      <ButtonLink
                        variant="secondary"
                        href={`/trains/${train.id}?${searchQuery(search)}`}
                      >
                        View train
                      </ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No scheduled trains"
            description="Try stations on the same railway line or select another date."
          />
        )}
      </section>
      <p className="text-xs text-muted mt-5">
        Demonstration timetable only. These are not official operating times.
      </p>
    </div>
  );
}
