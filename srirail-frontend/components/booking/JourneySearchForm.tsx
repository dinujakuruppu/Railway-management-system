"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JourneySearch } from "@/types";
import { stations } from "@/data/stations";
import { dateOffset, searchQuery, today } from "@/lib/format";
import { validateSearch, type Errors } from "@/lib/validation";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
export function defaultSearch(): JourneySearch {
  return { from: "Colombo Fort", to: "Kandy", date: dateOffset(1), count: 1 };
}
export default function JourneySearchForm({
  initial,
  onSearch,
  compact = false,
}: {
  initial?: JourneySearch;
  onSearch?: (value: JourneySearch) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState<JourneySearch>(
    initial ?? defaultSearch(),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  function change<K extends keyof JourneySearch>(
    key: K,
    value: JourneySearch[K],
  ) {
    setSearch({ ...search, [key]: value });
    setErrors({ ...errors, [key]: "" });
  }
  return (
    <form
      className="search-wrap"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const issues = validateSearch(search);
        setErrors(issues);
        if (Object.keys(issues).length) return;
        if (onSearch) {
          onSearch(search);
          return;
        }
        setLoading(true);
        router.push(`/trains?${searchQuery(search)}`);
      }}
    >
      {!compact && (
        <div className="search-header">
          <Icon name="ticket" />
          <h2 className="m-0">Book your journey</h2>
          <span className="ml-auto text-xs text-muted font-normal hidden sm:block">
            One way · Up to 6 passengers
          </span>
        </div>
      )}
      <div className="search-grid">
        <Select
          label="From station"
          value={search.from}
          error={errors.from}
          onChange={(e) => change("from", e.target.value)}
        >
          {stations.map((s) => (
            <option key={s.id}>{s.name}</option>
          ))}
        </Select>
        <Button
          className="swap-button"
          variant="secondary"
          aria-label="Swap departure and arrival stations"
          onClick={() => {
            setSearch({ ...search, from: search.to, to: search.from });
            setErrors({});
          }}
        >
          <Icon name="swap" size={18} />
        </Button>
        <Select
          label="To station"
          value={search.to}
          error={errors.to}
          onChange={(e) => change("to", e.target.value)}
        >
          {stations.map((s) => (
            <option key={s.id}>{s.name}</option>
          ))}
        </Select>
        <Input
          label="Travel date"
          type="date"
          value={search.date}
          min={today()}
          max={dateOffset(90)}
          error={errors.date}
          onChange={(e) => change("date", e.target.value)}
          required
        />
        <Select
          label="Passengers"
          value={search.count}
          error={errors.count}
          onChange={(e) => change("count", Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "person" : "people"}
            </option>
          ))}
        </Select>
        <Button type="submit" className="search-button" disabled={loading}>
          <Icon name="search" size={18} />
          {loading ? "Searching…" : "Search trains"}
        </Button>
      </div>
    </form>
  );
}
