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

export function SsPickupManager() {
  const [dates, setDates] = useState<DateRow[]>([]);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [formDate, setFormDate] = useState("");
  const [maxCapacity, setMaxCapacity] = useState(12);

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

  async function addDate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/ss/pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fulfillment_date: formDate,
        max_capacity: maxCapacity,
        is_active: true,
        windows: [
          { label: "Morning", starts_at: "09:00", ends_at: "11:00", capacity: 4 },
          {
            label: "Afternoon",
            starts_at: "13:00",
            ends_at: "16:00",
            capacity: 4,
          },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", message: data.error ?? "Save failed." });
      return;
    }
    setNotice({ type: "success", message: "Date saved." });
    setFormDate("");
    await load();
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
        <button type="submit" className="btn btn-secondary text-sm">
          Add / update date
        </button>
      </form>

      <ul className="space-y-2">
        {dates.map((d) => (
          <li
            key={d.id}
            className="border border-parchment bg-white px-4 py-3 text-sm"
          >
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
          </li>
        ))}
      </ul>
    </div>
  );
}
