"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatDate } from "@/lib/format";
import PageHeading from "@/components/ui/PageHeading";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import Icon from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
export default function NoticesPage() {
  const { notices } = useApp();
  const [category, setCategory] = useState("All notices");
  const visible = notices
    .filter(
      (n) =>
        n.published && (category === "All notices" || n.category === category),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="container page-section">
      <PageHeading
        eyebrow="Stay informed"
        title="Travel notices"
        description="Service updates and useful information before you travel."
        action={
          <div className="w-56">
            <Select
              label="Notice category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {[
                "All notices",
                "Service update",
                "Special service",
                "Schedule change",
                "Announcement",
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Select>
          </div>
        }
      />
      <div className="grid md:grid-cols-2 gap-5">
        {visible.map((notice) => (
          <article
            id={notice.id}
            key={notice.id}
            className="card panel scroll-mt-8"
          >
            <div className="flex items-center justify-between gap-3 mb-5">
              <Badge
                tone={
                  notice.category === "Service update" ? "warning" : "brand"
                }
              >
                {notice.category}
              </Badge>
              <Icon name="bell" className="text-muted" />
            </div>
            <h2 className="text-lg font-bold">{notice.title}</h2>
            <p className="text-muted text-sm leading-relaxed mt-3">
              {notice.description}
            </p>
            <p className="text-xs text-muted mt-6 mb-0">
              Published {formatDate(notice.date)}
            </p>
          </article>
        ))}
      </div>
      {!visible.length && (
        <EmptyState
          title="No notices in this category"
          description="Select another category to see more railway updates."
        />
      )}
    </div>
  );
}
