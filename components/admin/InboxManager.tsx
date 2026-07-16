"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import type { InboxItem, InboxKind } from "@/lib/admin/inbox";

const KIND_LABEL: Record<InboxKind, string> = {
  contact: "Contact",
  delivery: "Delivery",
  blooms: "Blooms",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InboxManager() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [filter, setFilter] = useState<"all" | InboxKind>("all");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/inbox", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setNotice({
        type: "error",
        message: data.error ?? "Could not load inquiries.",
      });
      setLoading(false);
      return;
    }
    setItems((data.items ?? []) as InboxItem[]);
    setNotice(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible =
    filter === "all" ? items : items.filter((item) => item.kind === filter);

  return (
    <div className="space-y-6">
      {notice && (
        <AdminNotice
          type={notice.type}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-stone">
          Everyone who submitted a form — contact, delivery, or blooms booking.
          Email notifications are separate; this list is the source of truth on
          the site.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="btn border-parchment bg-white text-bark hover:border-bark/40"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {(
          [
            ["all", "All"],
            ["contact", "Contact"],
            ["delivery", "Delivery"],
            ["blooms", "Blooms"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={
              filter === value
                ? "border border-bark bg-bark px-3 py-1.5 text-white"
                : "border border-parchment bg-white px-3 py-1.5 text-stone hover:border-bark/40 hover:text-bark"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-stone">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="border border-parchment bg-white p-6 text-sm text-stone">
          No inquiries yet. When someone submits a form, they&apos;ll show up
          here.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <li
              key={item.id}
              className="border border-parchment bg-white p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-parchment px-2 py-0.5 text-xs uppercase tracking-wide text-stone">
                    {KIND_LABEL[item.kind]}
                  </span>
                  <h2 className="font-medium text-bark">{item.name}</h2>
                </div>
                <time
                  dateTime={item.createdAt}
                  className="text-xs text-stone"
                >
                  {formatWhen(item.createdAt)}
                </time>
              </div>

              <p className="mt-1 text-sm text-stone">{item.title}</p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-bark">
                {item.summary}
              </p>

              <dl className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-stone">
                    Email
                  </dt>
                  <dd>
                    <a
                      href={`mailto:${item.email}`}
                      className="text-bark underline underline-offset-2 decoration-parchment hover:text-salmon-dark"
                    >
                      {item.email}
                    </a>
                  </dd>
                </div>
                {item.phone ? (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-stone">
                      Phone
                    </dt>
                    <dd>
                      <a
                        href={`tel:${item.phone}`}
                        className="text-bark underline underline-offset-2 decoration-parchment hover:text-salmon-dark"
                      >
                        {item.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>

              {item.meta.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone">
                  {item.meta.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
