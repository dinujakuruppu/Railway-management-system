"use client";
import { useState } from "react";
import type { Train } from "@/types";
import { stations } from "@/data/stations";
import { makeClasses } from "@/data/trains";
import { duration, minutes } from "@/lib/format";
import { useApp } from "@/context/AppContext";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
export default function TrainEditor({
  train,
  onSave,
}: {
  train: Train | null;
  onSave: (train: Train) => void;
}) {
  const { trains } = useApp();
  const [form, setForm] = useState({
    name: train?.name ?? "",
    number: train?.trainNumber ?? "",
    type: train?.type ?? "Express",
    from: train?.departureStation ?? "Colombo Fort",
    to: train?.arrivalStation ?? "Kandy",
    departure: train?.departureTime ?? "09:00",
    arrival: train?.arrivalTime ?? "12:00",
    base: String(train?.classes.find((c) => c.id === "third")?.price ?? 350),
    active: train?.active ?? true,
  });
  const [error, setError] = useState("");
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (
      form.name.trim().length < 3 ||
      !/^\d{3,6}$/.test(form.number) ||
      !form.departure ||
      !form.arrival ||
      !Number.isFinite(Number(form.base)) ||
      Number(form.base) < 50 ||
      Number(form.base) > 100000
    ) {
      setError(
        "Enter a name, a 3–6 digit train number, valid times and a base fare from LKR 50 to 100,000.",
      );
      return;
    }
    if (
      trains.some((t) => t.id !== train?.id && t.trainNumber === form.number)
    ) {
      setError("This train number already exists. Choose a unique number.");
      return;
    }
    if (form.from === form.to) {
      setError("Departure and arrival stations must be different.");
      return;
    }
    if (minutes(form.arrival) <= minutes(form.departure)) {
      setError(
        "For this demo, arrival must be later on the same day than departure.",
      );
      return;
    }
    let stops = [
      { station: form.from, time: form.departure },
      { station: form.to, time: form.arrival },
    ];
    if (
      train &&
      form.from === train.departureStation &&
      form.to === train.arrivalStation
    ) {
      const previousDuration =
        minutes(train.arrivalTime) - minutes(train.departureTime);
      const nextDuration = minutes(form.arrival) - minutes(form.departure);
      stops = train.stops.map((s) => {
        const progress =
          (minutes(s.time) - minutes(train.departureTime)) / previousDuration;
        const nextMinutes =
          minutes(form.departure) + Math.round(progress * nextDuration);
        return {
          station: s.station,
          time: `${String(Math.floor(nextMinutes / 60)).padStart(2, "0")}:${String(nextMinutes % 60).padStart(2, "0")}`,
        };
      });
    }
    onSave({
      id: train?.id ?? `train-${crypto.randomUUID().slice(0, 8)}`,
      trainNumber: form.number,
      name: form.name.trim(),
      type: form.type as Train["type"],
      departureStation: form.from,
      arrivalStation: form.to,
      departureTime: form.departure,
      arrivalTime: form.arrival,
      duration: duration(form.departure, form.arrival),
      stops,
      classes: makeClasses(Number(form.base)),
      facilities: train?.facilities ?? [
        "On-board restrooms",
        "Luggage racks",
        "Reserved coaches",
      ],
      active: form.active,
    });
  }
  return (
    <form noValidate onSubmit={save}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Train name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="Train number"
          required
          inputMode="numeric"
          value={form.number}
          onChange={(e) => setForm({ ...form, number: e.target.value })}
        />
        <Select
          label="Train type"
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value as Train["type"] })
          }
        >
          <option>Express</option>
          <option>Intercity</option>
          <option>Commuter</option>
        </Select>
        <Input
          label="Third Class base fare (LKR)"
          type="number"
          min={50}
          max={100000}
          required
          value={form.base}
          onChange={(e) => setForm({ ...form, base: e.target.value })}
        />
        <Select
          label="Departure station"
          value={form.from}
          onChange={(e) => setForm({ ...form, from: e.target.value })}
        >
          {stations.map((s) => (
            <option key={s.id}>{s.name}</option>
          ))}
        </Select>
        <Select
          label="Arrival station"
          value={form.to}
          onChange={(e) => setForm({ ...form, to: e.target.value })}
        >
          {stations.map((s) => (
            <option key={s.id}>{s.name}</option>
          ))}
        </Select>
        <Input
          label="Departure time"
          type="time"
          required
          value={form.departure}
          onChange={(e) => setForm({ ...form, departure: e.target.value })}
        />
        <Input
          label="Arrival time"
          type="time"
          required
          value={form.arrival}
          onChange={(e) => setForm({ ...form, arrival: e.target.value })}
        />
      </div>
      <label className="checkbox-row mt-5">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
        />
        <span>Active service</span>
      </label>
      <p className="text-xs text-muted mt-4">
        Other class fares are derived from the base fare. Changing the route
        creates a direct service; keeping the route preserves intermediate stops
        with adjusted times. Existing tickets keep their original details.
      </p>
      {error && (
        <p className="alert alert-error mt-4" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full mt-4">
        {train ? "Save train changes" : "Add train"}
      </Button>
    </form>
  );
}
