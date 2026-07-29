"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";

type WindowRow = {
  id?: string;
  label: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
};

type DateRow = {
  id: string;
  fulfillment_date: string;
  max_capacity: number;
  is_active: boolean;
  ss_pickup_windows?: WindowRow[];
};

const DEFAULT_WINDOWS = [
  { label: "Morning", starts_at: "09:00", ends_at: "11:00", capacity: 4 },
  { label: "Afternoon", starts_at: "13:00", ends_at: "16:00", capacity: 4 },
];

function nextWeekdays(from: Date, count: number): string[] {
  const out: string[] = [];
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function SsPickupManager() {
  const [dates, setDates] = useState<DateRow[]>([]);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [formDate, setFormDate] = useState("");
  const [maxCapacity, setMaxCapacity] = useState(12);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/ss/pickup", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load schedule.");
      return;
    }
    setDates(data.dates ?? []);
    setError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upsertDate(input: {
    fulfillment_date: string;
    max_capacity: number;
    is_active?: boolean;
    windows?: typeof DEFAULT_WINDOWS;
  }) {
    const res = await fetch("/api/admin/ss/pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Save failed.");
    return data;
  }

  async function addDate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await upsertDate({
        fulfillment_date: formDate,
        max_capacity: maxCapacity,
        is_active: true,
        windows: DEFAULT_WINDOWS,
      });
      setNotice({ type: "success", message: "Date saved." });
      setFormDate("");
      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Save failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function seedTwoWeeks() {
    setBusy(true);
    try {
      const days = nextWeekdays(new Date(), 10);
      for (const day of days) {
        await upsertDate({
          fulfillment_date: day,
          max_capacity: maxCapacity,
          is_active: true,
          windows: DEFAULT_WINDOWS,
        });
      }
      setNotice({
        type: "success",
        message: `Seeded ${days.length} weekdays with morning/afternoon windows.`,
      });
      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Seed failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(row: DateRow) {
    setBusy(true);
    try {
      await upsertDate({
        fulfillment_date: row.fulfillment_date,
        max_capacity: row.max_capacity,
        is_active: !row.is_active,
      });
      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Update failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function updateCapacity(row: DateRow, capacity: number) {
    setBusy(true);
    try {
      await upsertDate({
        fulfillment_date: row.fulfillment_date,
        max_capacity: capacity,
        is_active: row.is_active,
      });
      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Update failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="text-sm text-bark">{error}</p>;

  return (
    <div className="space-y-6">
      {notice ? (
        <AdminNotice
          type={notice.type}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      ) : null}
      <div>
        <h1 className="font-serif text-2xl text-bark">Pickup &amp; capacity</h1>
        <p className="mt-1 text-sm text-stone">
          Fulfillment dates control delivery and pickup capacity. Windows apply
          to farm pickup.
        </p>
      </div>

      <form
        onSubmit={(e) => void addDate(e)}
        className="flex flex-wrap items-end gap-3 border border-parchment bg-white p-4"
      >
        <label className="text-sm">
          Date
          <input
            type="date"
            required
            className="input mt-1"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Max capacity
          <input
            type="number"
            min={0}
            className="input mt-1 w-24"
            value={maxCapacity}
            onChange={(e) => setMaxCapacity(Number(e.target.value) || 0)}
          />
        </label>
        <button
          type="submit"
          className="btn btn-secondary text-sm"
          disabled={busy}
        >
          Add / update date
        </button>
        <button
          type="button"
          className="btn border-bark bg-bark text-cream text-sm"
          disabled={busy}
          onClick={() => void seedTwoWeeks()}
        >
          Seed next 10 weekdays
        </button>
      </form>

      <ul className="space-y-2">
        {dates.map((d) => (
          <li
            key={d.id}
            className="flex flex-wrap items-start justify-between gap-3 border border-parchment bg-white px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium text-bark">
                {d.fulfillment_date} · capacity {d.max_capacity}
                {!d.is_active ? " · inactive" : ""}
              </p>
              <p className="mt-1 text-xs text-stone">
                {(d.ss_pickup_windows ?? [])
                  .map(
                    (w) =>
                      `${w.label} ${String(w.starts_at).slice(0, 5)}–${String(w.ends_at).slice(0, 5)} (${w.capacity})`,
                  )
                  .join(" · ") || "No pickup windows"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-stone">
                Cap
                <input
                  type="number"
                  min={0}
                  className="input w-16 py-1 text-xs"
                  defaultValue={d.max_capacity}
                  onBlur={(e) => {
                    const next = Number(e.target.value) || 0;
                    if (next !== d.max_capacity) {
                      void updateCapacity(d, next);
                    }
                  }}
                />
              </label>
              <button
                type="button"
                className="text-xs underline"
                disabled={busy}
                onClick={() => void toggleActive(d)}
              >
                {d.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {!dates.length ? (
        <p className="text-sm text-stone">
          No fulfillment dates yet. Add one or seed the next two weeks.
        </p>
      ) : null}
    </div>
  );
}
