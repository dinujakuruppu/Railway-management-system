"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Train } from "@/types";
import PageHeading from "@/components/ui/PageHeading";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import TrainEditor from "./TrainEditor";
export default function AdminTrains() {
  const { trains, saveTrain } = useApp();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Train | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const filtered = trains.filter((t) =>
    `${t.name} ${t.trainNumber} ${t.departureStation} ${t.arrivalStation}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="Network management"
        title="Trains"
        description="Manage sample train services, fares and routes."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            + Add train
          </Button>
        }
      />
      <div className="card panel mb-6">
        <Input
          label="Search trains"
          placeholder="Train name, number or station"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {message && (
        <p className="alert alert-success mb-5" role="status">
          {message}
        </p>
      )}
      {filtered.length ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Train</th>
                <th>Route</th>
                <th>Times</th>
                <th>Type</th>
                <th>Status</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.name}</strong>
                    <small>#{t.trainNumber}</small>
                  </td>
                  <td>
                    {t.departureStation}
                    <small>→ {t.arrivalStation}</small>
                  </td>
                  <td>
                    {t.departureTime} – {t.arrivalTime}
                    <small>{t.duration}</small>
                  </td>
                  <td>{t.type}</td>
                  <td>
                    <StatusBadge status={t.active ? "Active" : "Inactive"} />
                  </td>
                  <td>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditing(t);
                        setOpen(true);
                      }}
                    >
                      Edit train
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No matching trains"
          description="Try a different train name or station."
        />
      )}
      <Modal
        open={open}
        title={editing ? "Edit train" : "Add a train"}
        onClose={() => setOpen(false)}
      >
        {open && (
          <TrainEditor
            key={editing?.id ?? "new"}
            train={editing}
            onSave={async (t) => {
              await saveTrain(t);
              setOpen(false);
              setMessage(`${t.name} has been saved to the project network.`);
            }}
          />
        )}
      </Modal>
    </>
  );
}
