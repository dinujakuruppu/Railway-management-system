"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { TrainSchedule } from "@/types";
import PageHeading from "@/components/ui/PageHeading";
import Input from "@/components/ui/Input";
import { ButtonLink } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
export default function AdminSchedules() {
  const { trains, schedules, saveSchedule } = useApp();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(schedule: TrainSchedule, message: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await saveSchedule(schedule);
      setMessage(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save schedule.");
    } finally {
      setBusy(false);
    }
  }
  const filtered = trains.filter((t) =>
    `${t.name} ${t.trainNumber}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="Operating calendar"
        title="Train schedules"
        description="Changes are saved to the shared project database."
        action={
          <ButtonLink href="/admin/trains" variant="secondary">
            Edit departure times
          </ButtonLink>
        }
      />
      <div className="alert mb-5">
        Set operating days or pause a schedule. Passenger searches only show
        active services running on the selected date.
      </div>
      <div className="card panel mb-5">
        <Input
          label="Find a service"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Train name or number"
        />
      </div>
      {error && (
        <p role="alert" className="alert alert-error mb-4">
          {error}
        </p>
      )}
      <p className="text-sm text-emerald-700 mb-4 min-h-5" role="status">
        {message}
      </p>
      {filtered.length ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Train</th>
                <th>Departure / Arrival</th>
                <th>Operating days</th>
                <th>Schedule enabled</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const schedule = schedules.find((s) => s.trainId === t.id);
                if (!schedule) return null;
                return (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.name}</strong>
                      <small>#{t.trainNumber}</small>
                    </td>
                    <td>
                      {t.departureTime} – {t.arrivalTime}
                      <small>
                        {t.departureStation} → {t.arrivalStation}
                      </small>
                    </td>
                    <td>
                      <select
                        className="control"
                        aria-label={`Operating days for ${t.name}`}
                        value={schedule.days}
                        disabled={busy}
                        onChange={(e) => {
                          void save(
                            {
                              ...schedule,
                              days: e.target.value as TrainSchedule["days"],
                            },
                            `${t.name}: operating days updated.`,
                          );
                        }}
                      >
                        <option>Daily</option>
                        <option>Weekdays</option>
                        <option>Weekends</option>
                      </select>
                    </td>
                    <td>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={schedule.active}
                          disabled={busy}
                          onChange={(e) => {
                            void save(
                              { ...schedule, active: e.target.checked },
                              `${t.name}: schedule ${e.target.checked ? "enabled" : "paused"}.`,
                            );
                          }}
                        />
                        <span>{schedule.active ? "Enabled" : "Paused"}</span>
                        <span className="sr-only"> for {t.name}</span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No matching services"
          description="Search by train name or number."
        />
      )}
    </>
  );
}
