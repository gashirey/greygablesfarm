"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MediaAssetPicker } from "@/components/admin/MediaAssetPicker";
import { eventHasRequiredImages } from "@/lib/events/format";
import type {
  FarmEventDate,
  FarmEventSegment,
  FarmEventSegmentType,
  FarmEventStatus,
  FarmEventWithDetails,
} from "@/lib/events/types";

type EventEditorProps = {
  eventId: string;
};

type BasicsDraft = {
  title: string;
  slug: string;
  status: FarmEventStatus;
  summary: string;
  eyebrow: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  sort_order: number;
  index_image_url: string;
  index_image_alt: string;
  detail_image_url: string;
  detail_image_alt: string;
};

function draftFromEvent(event: FarmEventWithDetails): BasicsDraft {
  return {
    title: event.title,
    slug: event.slug,
    status: event.status,
    summary: event.summary,
    eyebrow: event.eyebrow ?? "",
    subtitle: event.subtitle ?? "",
    cta_label: event.cta_label ?? "",
    cta_href: event.cta_href ?? "",
    sort_order: event.sort_order,
    index_image_url: event.index_image_url ?? "",
    index_image_alt: event.index_image_alt,
    detail_image_url: event.detail_image_url ?? "",
    detail_image_alt: event.detail_image_alt,
  };
}

export function EventEditor({ eventId }: EventEditorProps) {
  const [event, setEvent] = useState<FarmEventWithDetails | null>(null);
  const [draft, setDraft] = useState<BasicsDraft | null>(null);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/events/${eventId}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setLoadError(data.error ?? "Could not load event.");
      setEvent(null);
      setDraft(null);
      return;
    }
    const next = data.event as FarmEventWithDetails;
    setLoadError("");
    setEvent(next);
    setDraft(draftFromEvent(next));
    setDirty(false);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateDraft(patch: Partial<BasicsDraft>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
    setMessage(null);
  }

  async function saveBasics() {
    if (!event || !draft) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        slug: draft.slug,
        status: draft.status,
        summary: draft.summary,
        eyebrow: draft.eyebrow,
        subtitle: draft.subtitle,
        cta_label: draft.cta_label,
        cta_href: draft.cta_href,
        sort_order: draft.sort_order,
        index_image_url: draft.index_image_url,
        index_image_alt: draft.index_image_alt,
        detail_image_url: draft.detail_image_url,
        detail_image_alt: draft.detail_image_alt,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Save failed." });
      return;
    }
    const next = data.event as FarmEventWithDetails;
    setEvent(next);
    setDraft(draftFromEvent(next));
    setDirty(false);
    setMessage({ type: "success", text: "Saved." });
  }

  async function addDate() {
    if (!event) return;
    const res = await fetch(`/api/admin/events/${event.id}/dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        starts_on: new Date().toISOString().slice(0, 10),
        time_note: "",
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage({ type: "error", text: data.error ?? "Could not add date." });
      return;
    }
    setMessage({ type: "success", text: "Date added." });
    await load();
  }

  async function patchDate(dateId: string, patch: Record<string, unknown>) {
    if (!event) return;
    const res = await fetch(`/api/admin/events/${event.id}/dates/${dateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage({ type: "error", text: data.error ?? "Could not update date." });
      return;
    }
    setMessage({ type: "success", text: "Date saved." });
    await load();
  }

  async function removeDate(dateId: string) {
    if (!event) return;
    if (!confirm("Remove this date?")) return;
    const res = await fetch(`/api/admin/events/${event.id}/dates/${dateId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage({ type: "error", text: data.error ?? "Could not remove date." });
      return;
    }
    setMessage({ type: "success", text: "Date removed." });
    await load();
  }

  async function addSegment() {
    if (!event) return;
    const res = await fetch(`/api/admin/events/${event.id}/segments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        segment_type: "text",
        title: "New section",
        body: "",
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage({
        type: "error",
        text: data.error ?? "Could not add section.",
      });
      return;
    }
    setMessage({ type: "success", text: "Section added." });
    await load();
  }

  async function patchSegment(
    segmentId: string,
    patch: Record<string, unknown>,
  ) {
    if (!event) return;
    const res = await fetch(
      `/api/admin/events/${event.id}/segments/${segmentId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      },
    );
    if (!res.ok) {
      const data = await res.json();
      setMessage({
        type: "error",
        text: data.error ?? "Could not update section.",
      });
      return;
    }
    setMessage({ type: "success", text: "Section saved." });
    await load();
  }

  async function removeSegment(segmentId: string) {
    if (!event) return;
    if (!confirm("Remove this section?")) return;
    const res = await fetch(
      `/api/admin/events/${event.id}/segments/${segmentId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const data = await res.json();
      setMessage({
        type: "error",
        text: data.error ?? "Could not remove section.",
      });
      return;
    }
    setMessage({ type: "success", text: "Section removed." });
    await load();
  }

  if (loadError) {
    return <p className="text-sm text-bark">{loadError}</p>;
  }
  if (!event || !draft) {
    return <p className="text-sm text-stone">Loading…</p>;
  }

  const canPublish = eventHasRequiredImages({
    index_image_url: draft.index_image_url,
    detail_image_url: draft.detail_image_url,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-stone">
            <Link
              href="/admin/events"
              className="underline-offset-2 hover:underline"
            >
              Events
            </Link>{" "}
            / edit
          </p>
          <h1 className="mt-1 font-serif text-2xl text-bark">{event.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {event.status === "published" ? (
            <Link
              href={`/events/${event.slug}`}
              className="text-sm text-bark underline-offset-2 hover:underline"
            >
              View public page
            </Link>
          ) : null}
          <button
            type="button"
            className="btn btn-primary text-sm"
            disabled={saving || !dirty}
            onClick={() => void saveBasics()}
          >
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </div>

      {message ? (
        <p
          className={`text-sm ${message.type === "error" ? "text-bark" : "text-stone"}`}
        >
          {message.type === "error" ? "Error: " : ""}
          {message.text}
        </p>
      ) : null}

      {!canPublish ? (
        <p className="border border-parchment bg-cream px-4 py-3 text-sm text-bark">
          Pick both an <strong>index</strong> and a <strong>detail</strong>{" "}
          image, then click <strong>Save changes</strong>. Publishing stays
          blocked until both images are saved.
        </p>
      ) : null}

      <section className="space-y-4 border border-parchment bg-white p-5">
        <h2 className="font-serif text-lg text-bark">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Title
            <input
              className="input mt-1 w-full"
              value={draft.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Slug
            <input
              className="input mt-1 w-full font-mono text-xs"
              value={draft.slug}
              onChange={(e) => updateDraft({ slug: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Status
            <select
              className="input mt-1 w-full"
              value={draft.status}
              onChange={(e) =>
                updateDraft({ status: e.target.value as FarmEventStatus })
              }
            >
              <option value="draft">Draft</option>
              <option value="published" disabled={!canPublish}>
                Published{!canPublish ? " (needs images)" : ""}
              </option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            Index summary
            <textarea
              className="input mt-1 w-full"
              rows={3}
              value={draft.summary}
              onChange={(e) => updateDraft({ summary: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Eyebrow
            <input
              className="input mt-1 w-full"
              value={draft.eyebrow}
              onChange={(e) => updateDraft({ eyebrow: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Subtitle
            <input
              className="input mt-1 w-full"
              value={draft.subtitle}
              onChange={(e) => updateDraft({ subtitle: e.target.value })}
            />
          </label>
          <label className="text-sm">
            CTA label
            <input
              className="input mt-1 w-full"
              value={draft.cta_label}
              onChange={(e) => updateDraft({ cta_label: e.target.value })}
            />
          </label>
          <label className="text-sm">
            CTA link
            <input
              className="input mt-1 w-full font-mono text-xs"
              value={draft.cta_href}
              onChange={(e) => updateDraft({ cta_href: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Sort order
            <input
              type="number"
              className="input mt-1 w-full"
              value={draft.sort_order}
              onChange={(e) =>
                updateDraft({ sort_order: Number(e.target.value) || 0 })
              }
            />
          </label>
        </div>
      </section>

      <section className="space-y-6 border border-parchment bg-white p-5">
        <h2 className="font-serif text-lg text-bark">Images</h2>
        <p className="text-sm text-stone">
          Choose from the media library (or paste a URL), then click{" "}
          <strong>Save changes</strong> at the top.
        </p>
        <MediaAssetPicker
          label="Index card image"
          required
          valueUrl={draft.index_image_url}
          valueAlt={draft.index_image_alt}
          onChange={({ url, alt }) =>
            updateDraft({ index_image_url: url, index_image_alt: alt })
          }
        />
        <MediaAssetPicker
          label="Detail page header image"
          required
          valueUrl={draft.detail_image_url}
          valueAlt={draft.detail_image_alt}
          onChange={({ url, alt }) =>
            updateDraft({ detail_image_url: url, detail_image_alt: alt })
          }
        />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-primary text-sm"
          disabled={saving || !dirty}
          onClick={() => void saveBasics()}
        >
          {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </button>
        {dirty ? (
          <p className="text-sm text-bark">You have unsaved changes.</p>
        ) : null}
      </div>

      <section className="space-y-4 border border-parchment bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg text-bark">Dates</h2>
          <button
            type="button"
            className="btn btn-secondary text-sm"
            onClick={() => void addDate()}
          >
            Add date
          </button>
        </div>
        <p className="text-sm text-stone">
          Leave end date empty for a single day. Each date saves when you leave
          a field (or toggle Cancelled).
        </p>
        {event.dates.length === 0 ? (
          <p className="text-sm text-stone">No dates yet.</p>
        ) : (
          <ul className="space-y-4">
            {event.dates.map((date) => (
              <DateRow
                key={date.id}
                date={date}
                onPatch={(patch) => void patchDate(date.id, patch)}
                onRemove={() => void removeDate(date.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 border border-parchment bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg text-bark">Page sections</h2>
          <button
            type="button"
            className="btn btn-secondary text-sm"
            onClick={() => void addSegment()}
          >
            Add section
          </button>
        </div>
        <p className="text-sm text-stone">
          Sections save when you leave a field.
        </p>
        {event.segments.length === 0 ? (
          <p className="text-sm text-stone">No sections yet.</p>
        ) : (
          <ul className="space-y-6">
            {event.segments.map((segment) => (
              <SegmentRow
                key={segment.id}
                segment={segment}
                onPatch={(patch) => void patchSegment(segment.id, patch)}
                onRemove={() => void removeSegment(segment.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DateRow({
  date,
  onPatch,
  onRemove,
}: {
  date: FarmEventDate;
  onPatch: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="grid gap-3 border border-parchment p-3 sm:grid-cols-2">
      <label className="text-sm">
        Start
        <input
          type="date"
          className="input mt-1 w-full"
          defaultValue={date.starts_on}
          onBlur={(e) => {
            if (e.target.value !== date.starts_on) {
              onPatch({ starts_on: e.target.value });
            }
          }}
        />
      </label>
      <label className="text-sm">
        End (optional)
        <input
          type="date"
          className="input mt-1 w-full"
          defaultValue={date.ends_on ?? ""}
          onBlur={(e) => {
            const next = e.target.value || null;
            if (next !== date.ends_on) onPatch({ ends_on: next });
          }}
        />
      </label>
      <label className="text-sm">
        Label
        <input
          className="input mt-1 w-full"
          defaultValue={date.label ?? ""}
          onBlur={(e) => {
            if ((e.target.value || null) !== date.label) {
              onPatch({ label: e.target.value });
            }
          }}
        />
      </label>
      <label className="text-sm">
        Time / note
        <input
          className="input mt-1 w-full"
          defaultValue={date.time_note ?? ""}
          onBlur={(e) => {
            if ((e.target.value || null) !== date.time_note) {
              onPatch({ time_note: e.target.value });
            }
          }}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={date.is_cancelled}
          onChange={(e) => onPatch({ is_cancelled: e.target.checked })}
        />
        Cancelled
      </label>
      <button
        type="button"
        className="justify-self-start text-sm text-stone underline-offset-2 hover:text-bark hover:underline"
        onClick={onRemove}
      >
        Remove
      </button>
    </li>
  );
}

function SegmentRow({
  segment,
  onPatch,
  onRemove,
}: {
  segment: FarmEventSegment;
  onPatch: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="space-y-3 border border-parchment p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Type
          <select
            className="input mt-1 w-full"
            value={segment.segment_type}
            onChange={(e) =>
              onPatch({ segment_type: e.target.value as FarmEventSegmentType })
            }
          >
            <option value="text">Text</option>
            <option value="bullets">Bullets</option>
            <option value="cta">CTA</option>
            <option value="image">Image</option>
          </select>
        </label>
        <label className="text-sm">
          Title
          <input
            className="input mt-1 w-full"
            defaultValue={segment.title ?? ""}
            onBlur={(e) => {
              if ((e.target.value || null) !== segment.title) {
                onPatch({ title: e.target.value });
              }
            }}
          />
        </label>
      </div>
      <label className="block text-sm">
        Body
        <textarea
          className="input mt-1 w-full"
          rows={4}
          defaultValue={segment.body}
          onBlur={(e) => {
            if (e.target.value !== segment.body) {
              onPatch({ body: e.target.value });
            }
          }}
        />
        <span className="mt-1 block text-xs text-stone">
          Text: blank line between paragraphs. Bullets: one line per item.
        </span>
      </label>
      {segment.segment_type === "image" ? (
        <MediaAssetPicker
          label="Section image"
          valueUrl={segment.image_url ?? ""}
          valueAlt={segment.image_alt}
          onChange={({ url, alt }) =>
            onPatch({ image_url: url, image_alt: alt })
          }
        />
      ) : null}
      <button
        type="button"
        className="text-sm text-stone underline-offset-2 hover:text-bark hover:underline"
        onClick={onRemove}
      >
        Remove section
      </button>
    </li>
  );
}
