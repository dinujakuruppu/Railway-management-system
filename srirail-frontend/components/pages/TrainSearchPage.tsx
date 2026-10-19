"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { findJourneys, availablePlaces } from "@/lib/booking";
import { formatDate, minutes, searchQuery } from "@/lib/format";
import { validateSearch } from "@/lib/validation";
import JourneySearchForm, {
  defaultSearch,
} from "@/components/booking/JourneySearchForm";
import TrainCard from "@/components/booking/TrainCard";
import TrainFilters, {
  defaultFilters,
} from "@/components/booking/TrainFilters";
import PageHeading from "@/components/ui/PageHeading";
import EmptyState from "@/components/ui/EmptyState";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
export default function TrainSearchPage() {
  const params = useSearchParams();
  const defaults = defaultSearch();
  const search = {
    from: params.get("from") ?? defaults.from,
    to: params.get("to") ?? defaults.to,
    date: params.get("date") ?? defaults.date,
    count: Number(params.get("count") ?? 1),
  };
  const { trains, schedules, bookings, ready } = useApp();
  const [filters, setFilters] = useState(defaultFilters);
  const errors = validateSearch(search);
  const valid = Object.keys(errors).length === 0;
  const matches = findJourneys(trains, search, schedules)
    .filter((t) => {
      const hour = minutes(t.departureTime) / 60;
      return (
        (filters.type === "all" || t.type === filters.type) &&
        (filters.classId === "all" ||
          t.classes.some(
            (c) =>
              c.id === filters.classId &&
              availablePlaces(t, search.date, c.id, bookings) >= search.count,
          )) &&
        (filters.time === "all" ||
          (filters.time === "morning" && hour < 12) ||
          (filters.time === "afternoon" && hour >= 12 && hour < 18) ||
          (filters.time === "evening" && hour >= 18))
      );
    })
    .sort((a, b) =>
      filters.sort === "departure"
        ? minutes(a.departureTime) - minutes(b.departureTime)
        : Math.min(
            ...a.classes
              .filter(
                (c) => filters.classId === "all" || c.id === filters.classId,
              )
              .map((c) => c.price),
          ) -
          Math.min(
            ...b.classes
              .filter(
                (c) => filters.classId === "all" || c.id === filters.classId,
              )
              .map((c) => c.price),
          ),
    );
  return (
    <div className="container page-section">
      <PageHeading
        eyebrow="Plan your journey"
        title="Find your train"
        description="Choose the service and travel class that suit your plans."
      />
      <JourneySearchForm key={searchQuery(search)} initial={search} compact />
      <div className="mt-8 mb-6">
        <h2 className="text-xl font-bold">
          {search.from} <span className="text-maroon">→</span> {search.to}
        </h2>
        {valid ? (
          <p className="text-muted text-sm">
            {formatDate(search.date)} · {search.count}{" "}
            {search.count === 1 ? "passenger" : "passengers"} · One way
          </p>
        ) : (
          <p className="alert alert-error" role="alert">
            {Object.values(errors).join(" ")}
          </p>
        )}
      </div>
      <div className="result-layout">
        <TrainFilters filters={filters} onChange={setFilters} />
        <div>
          <div className="flex justify-between gap-4 items-center mb-5">
            <p className="text-sm text-muted m-0" aria-live="polite">
              {matches.length} trains available
            </p>
            <div className="w-48">
              <Select
                label="Sort results"
                value={filters.sort}
                onChange={(e) =>
                  setFilters({ ...filters, sort: e.target.value })
                }
              >
                <option value="departure">Departure time</option>
                <option value="price">Lowest price</option>
              </Select>
            </div>
          </div>
          {!ready ? (
            <LoadingSpinner />
          ) : matches.length ? (
            <div className="space-y-5">
              {matches.map((train) => (
                <TrainCard key={train.id} train={train} search={search} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No trains match this search"
              description="Try another date, reset the filters, or choose stations on the same sample railway line."
            >
              <Button
                variant="secondary"
                onClick={() => setFilters(defaultFilters)}
              >
                Reset filters
              </Button>
            </EmptyState>
          )}
          <p className="text-xs text-muted mt-6 flex gap-2">
            All schedules, fares and availability are sample data. No real
            reservation is made.
          </p>
        </div>
      </div>
    </div>
  );
}
