"use client";
import { useState } from "react";
import type { RailwayNotice } from "@/types";
import { today } from "@/lib/format";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
export default function NoticeEditor({
  notice,
  onSave,
}: {
  notice: RailwayNotice | null;
  onSave: (notice: RailwayNotice) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: notice?.title ?? "",
    category: notice?.category ?? "Announcement",
    description: notice?.description ?? "",
    published: notice?.published ?? true,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          form.title.trim().length < 5 ||
          form.description.trim().length < 20
        ) {
          setError(
            "Use a title of at least 5 characters and a description of at least 20 characters.",
          );
          return;
        }
        setBusy(true);
        setError("");
        try {
          await onSave({
            id: notice?.id ?? `notice-${crypto.randomUUID().slice(0, 8)}`,
            date: today(),
            ...form,
            title: form.title.trim(),
            description: form.description.trim(),
          });
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Unable to save notice.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="space-y-5">
        <Input
          label="Notice title"
          required
          maxLength={140}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Select
          label="Category"
          value={form.category}
          onChange={(e) =>
            setForm({
              ...form,
              category: e.target.value as RailwayNotice["category"],
            })
          }
        >
          <option>Service update</option>
          <option>Special service</option>
          <option>Schedule change</option>
          <option>Announcement</option>
        </Select>
        <div className="field">
          <label htmlFor="notice-description">Description *</label>
          <textarea
            id="notice-description"
            className="control"
            rows={5}
            maxLength={3000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />
          <span>Publish to passenger notices</span>
        </label>
      </div>
      {error && (
        <p className="alert alert-error mt-4" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy} className="w-full mt-6">
        {busy
          ? "Saving…"
          : form.published
            ? "Save & publish notice"
            : "Save draft notice"}
      </Button>
    </form>
  );
}
