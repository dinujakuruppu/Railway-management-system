"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { RailwayNotice } from "@/types";
import { formatDate } from "@/lib/format";
import PageHeading from "@/components/ui/PageHeading";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import NoticeEditor from "./NoticeEditor";
export default function AdminNotices() {
  const { notices, saveNotice } = useApp();
  const [editing, setEditing] = useState<RailwayNotice | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="Passenger communications"
        title="Railway notices"
        description="Publish sample service updates and public announcements."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            + New notice
          </Button>
        }
      />
      {error && (
        <p role="alert" className="alert alert-error mb-5">
          {error}
        </p>
      )}
      {message && (
        <p className="alert alert-success mb-5" role="status">
          {message}
        </p>
      )}
      <div className="grid xl:grid-cols-2 gap-5">
        {notices.map((n) => (
          <article className="card panel" key={n.id}>
            <div className="flex flex-wrap justify-between gap-2 mb-4">
              <Badge tone={n.published ? "success" : "warning"}>
                {n.published ? "Published" : "Draft"}
              </Badge>
              <span className="text-xs text-muted">
                {formatDate(n.date, true)}
              </span>
            </div>
            <h2 className="text-lg font-bold">{n.title}</h2>
            <p className="text-xs text-maroon mb-3">{n.category}</p>
            <p className="text-sm text-muted line-clamp-3">{n.description}</p>
            <div className="flex gap-3 mt-5">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(n);
                  setOpen(true);
                }}
              >
                Edit notice
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  setMessage("");
                  try {
                    await saveNotice({ ...n, published: !n.published });
                    setMessage(
                      `Notice ${n.published ? "moved to draft" : "published"}.`,
                    );
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Unable to update notice.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {n.published ? "Unpublish" : "Publish"}
              </Button>
            </div>
          </article>
        ))}
      </div>
      <Modal
        open={open}
        title={editing ? "Edit notice" : "New railway notice"}
        onClose={() => setOpen(false)}
      >
        {open && (
          <NoticeEditor
            key={editing?.id ?? "new"}
            notice={editing}
            onSave={async (notice) => {
              await saveNotice(notice);
              setOpen(false);
              setMessage(
                notice.published
                  ? "Notice published. It is now visible on the passenger website."
                  : "Notice saved as a draft.",
              );
            }}
          />
        )}
      </Modal>
    </>
  );
}
