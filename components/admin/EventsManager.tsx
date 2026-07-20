"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FarmEventListItem } from "@/lib/events/types";
import { eventHasRequiredImages } from "@/lib/events/format";

export function EventsManager() {
  const [events, setEvents] = useState<FarmEventListItem[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/events", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setLoadError(data.error ?? "Could not load events.");
      setEvents([]);
    } else {
      setLoadError("");
      setEvents(data.events ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status: "draft" }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error ?? "Could not create event.");
      return;
    }
    setTitle("");
    window.location.href = `/admin/events/${data.event.id}`;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-bark">Events</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone">
          Blog-style farm events with an index card image and a detail header
          image (both required before publish). Multi-date schedules and content
          segments edit on each event.
        </p>
      </div>

      {loadError ? (
        <div className="border border-parchment bg-white p-4 text-sm text-stone">
          <p className="font-medium text-bark">Events not available</p>
          <p className="mt-2">{loadError}</p>
          <p className="mt-2 text-xs">
            Run{" "}
            <code className="text-bark">024_events.sql</code> in Supabase, then
            refresh.
          </p>
        </div>
      ) : null}

      {message ? <p className="text-sm text-bark">{message}</p> : null}

      <form
        onSubmit={(e) => void createEvent(e)}
        className="flex flex-wrap items-end gap-3 border border-parchment bg-white p-4"
      >
        <label className="block min-w-[16rem] flex-1 text-sm">
          New event title
          <input
            className="input mt-1 w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="You Picks"
            required
          />
        </label>
        <button type="submit" className="btn btn-primary text-sm" disabled={saving}>
          {saving ? "Creating…" : "Create draft"}
        </button>
      </form>

      <section>
        {loading ? (
          <p className="text-sm text-stone">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-stone">No events yet.</p>
        ) : (
          <ul className="divide-y divide-parchment border border-parchment bg-white">
            {events.map((event) => {
              const imagesOk = eventHasRequiredImages(event);
              return (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="font-medium text-bark">{event.title}</p>
                    <p className="mt-1 text-sm text-stone">
                      /events/{event.slug} · {event.status} · {event.date_count}{" "}
                      date{event.date_count === 1 ? "" : "s"}
                      {!imagesOk ? " · needs images" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {event.status === "published" && imagesOk ? (
                      <Link
                        href={`/events/${event.slug}`}
                        className="text-stone underline-offset-2 hover:text-bark hover:underline"
                      >
                        View
                      </Link>
                    ) : null}
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="text-bark underline-offset-2 hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
