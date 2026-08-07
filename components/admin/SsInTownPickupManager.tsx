"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";

type LocationRow = {
  id: string;
  name: string;
  address_street: string;
  address_line2: string | null;
  address_city: string;
  address_state: string;
  address_zip: string;
  notes: string;
  is_active: boolean;
};

type SlotRow = {
  id: string;
  location_id: string;
  pickup_date: string;
  starts_at: string;
  ends_at: string;
  label: string;
  capacity: number;
  is_active: boolean;
  notes: string;
  ss_pickup_locations?: LocationRow | LocationRow[] | null;
};

function locName(slot: SlotRow): string {
  const raw = slot.ss_pickup_locations;
  const loc = Array.isArray(raw) ? raw[0] : raw;
  return loc?.name ?? "Location";
}

function timeInputValue(t: string): string {
  return String(t).slice(0, 5);
}

export function SsInTownPickupManager() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [migrationRequired, setMigrationRequired] = useState(false);

  const [locNameInput, setLocNameInput] = useState("");
  const [locStreet, setLocStreet] = useState("");
  const [locLine2, setLocLine2] = useState("");
  const [locCity, setLocCity] = useState("Richmond");
  const [locState, setLocState] = useState("VA");
  const [locZip, setLocZip] = useState("");
  const [locNotes, setLocNotes] = useState("");

  const [slotLocationId, setSlotLocationId] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [slotStart, setSlotStart] = useState("11:00");
  const [slotEnd, setSlotEnd] = useState("13:00");
  const [slotLabel, setSlotLabel] = useState("");
  const [slotCapacity, setSlotCapacity] = useState(12);
  const [slotNotes, setSlotNotes] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/ss/in-town", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load in-town pickups.");
      return;
    }
    setMigrationRequired(Boolean(data.migrationRequired));
    setLocations(data.locations ?? []);
    setSlots(data.slots ?? []);
    setError("");
    if (!slotLocationId && data.locations?.[0]?.id) {
      setSlotLocationId(data.locations[0].id);
    }
  }, [slotLocationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/ss/in-town", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Save failed.");
    return data;
  }

  async function addLocation(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await post({
        action: "upsert_location",
        name: locNameInput,
        address_street: locStreet,
        address_line2: locLine2 || null,
        address_city: locCity,
        address_state: locState,
        address_zip: locZip,
        notes: locNotes,
        is_active: true,
      });
      setNotice({ type: "success", message: "Location saved." });
      setLocNameInput("");
      setLocStreet("");
      setLocLine2("");
      setLocNotes("");
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

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await post({
        action: "upsert_slot",
        location_id: slotLocationId,
        pickup_date: slotDate,
        starts_at: slotStart,
        ends_at: slotEnd,
        label: slotLabel,
        capacity: slotCapacity,
        notes: slotNotes,
        is_active: true,
      });
      setNotice({
        type: "success",
        message: "Pickup scheduled. It will appear at checkout while upcoming.",
      });
      setSlotDate("");
      setSlotLabel("");
      setSlotNotes("");
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

  async function toggleLocation(id: string) {
    setBusy(true);
    try {
      await post({ action: "toggle_location", id });
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

  async function toggleSlot(id: string) {
    setBusy(true);
    try {
      await post({ action: "toggle_slot", id });
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

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = slots.filter((s) => s.pickup_date >= today);
  const past = slots.filter((s) => s.pickup_date < today);

  return (
    <div className="space-y-8">
      {notice ? (
        <AdminNotice
          type={notice.type}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      ) : null}

      <div>
        <h1 className="font-serif text-2xl text-bark">In Town pickup</h1>
        <p className="mt-1 text-sm text-stone">
          Schedule office or market pickups (address + date/time). When a slot
          is upcoming and active, customers see &ldquo;In Town Pickup&rdquo; at
          checkout.
        </p>
      </div>

      {migrationRequired ? (
        <p className="border border-parchment bg-white px-4 py-3 text-sm text-bark">
          Run migration{" "}
          <code className="text-xs">035_in_town_pickup.sql</code> on Supabase
          before adding locations.
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-bark">Locations</h2>
        <form
          onSubmit={(e) => void addLocation(e)}
          className="space-y-3 border border-parchment bg-white p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              Name
              <input
                required
                className="input mt-1 w-full"
                placeholder="e.g. Richmond — Partner Office"
                value={locNameInput}
                onChange={(e) => setLocNameInput(e.target.value)}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Street
              <input
                required
                className="input mt-1 w-full"
                value={locStreet}
                onChange={(e) => setLocStreet(e.target.value)}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Address line 2
              <input
                className="input mt-1 w-full"
                value={locLine2}
                onChange={(e) => setLocLine2(e.target.value)}
              />
            </label>
            <label className="text-sm">
              City
              <input
                required
                className="input mt-1 w-full"
                value={locCity}
                onChange={(e) => setLocCity(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                State
                <input
                  required
                  className="input mt-1 w-full"
                  maxLength={2}
                  value={locState}
                  onChange={(e) => setLocState(e.target.value.toUpperCase())}
                />
              </label>
              <label className="text-sm">
                ZIP
                <input
                  required
                  className="input mt-1 w-full"
                  inputMode="numeric"
                  maxLength={5}
                  value={locZip}
                  onChange={(e) =>
                    setLocZip(e.target.value.replace(/\D/g, "").slice(0, 5))
                  }
                />
              </label>
            </div>
            <label className="text-sm sm:col-span-2">
              Customer notes (optional)
              <input
                className="input mt-1 w-full"
                placeholder="Suite, parking, ask for front desk…"
                value={locNotes}
                onChange={(e) => setLocNotes(e.target.value)}
              />
            </label>
          </div>
          <button
            type="submit"
            className="btn btn-secondary text-sm"
            disabled={busy || migrationRequired}
          >
            Add location
          </button>
        </form>

        <ul className="space-y-2">
          {locations.map((loc) => (
            <li
              key={loc.id}
              className="flex flex-wrap items-start justify-between gap-3 border border-parchment bg-white px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-bark">
                  {loc.name}
                  {!loc.is_active ? " · inactive" : ""}
                </p>
                <p className="mt-1 text-xs text-stone">
                  {loc.address_street}
                  {loc.address_line2 ? `, ${loc.address_line2}` : ""}
                  {", "}
                  {loc.address_city}, {loc.address_state} {loc.address_zip}
                </p>
              </div>
              <button
                type="button"
                className="text-xs underline"
                disabled={busy}
                onClick={() => void toggleLocation(loc.id)}
              >
                {loc.is_active ? "Deactivate" : "Activate"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-bark">Scheduled pickups</h2>
        <form
          onSubmit={(e) => void addSlot(e)}
          className="flex flex-wrap items-end gap-3 border border-parchment bg-white p-4"
        >
          <label className="text-sm">
            Location
            <select
              required
              className="input mt-1 min-w-[12rem]"
              value={slotLocationId}
              onChange={(e) => setSlotLocationId(e.target.value)}
            >
              <option value="">Select…</option>
              {locations
                .filter((l) => l.is_active)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-sm">
            Date
            <input
              type="date"
              required
              className="input mt-1"
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Start
            <input
              type="time"
              required
              className="input mt-1"
              value={slotStart}
              onChange={(e) => setSlotStart(e.target.value)}
            />
          </label>
          <label className="text-sm">
            End
            <input
              type="time"
              required
              className="input mt-1"
              value={slotEnd}
              onChange={(e) => setSlotEnd(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Capacity
            <input
              type="number"
              min={0}
              className="input mt-1 w-20"
              value={slotCapacity}
              onChange={(e) => setSlotCapacity(Number(e.target.value) || 0)}
            />
          </label>
          <label className="text-sm">
            Label (optional)
            <input
              className="input mt-1 w-40"
              placeholder="Lunch window"
              value={slotLabel}
              onChange={(e) => setSlotLabel(e.target.value)}
            />
          </label>
          <label className="text-sm grow basis-full">
            Internal notes
            <input
              className="input mt-1 w-full"
              placeholder="Promoting Grey Gables — ask for reception"
              value={slotNotes}
              onChange={(e) => setSlotNotes(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="btn border-bark bg-bark text-cream text-sm"
            disabled={busy || migrationRequired || !locations.length}
          >
            Schedule pickup
          </button>
        </form>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-stone">
            Upcoming
          </p>
          <ul className="space-y-2">
            {upcoming.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-start justify-between gap-3 border border-parchment bg-white px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-bark">
                    {s.pickup_date} · {locName(s)}
                    {!s.is_active ? " · inactive" : ""}
                  </p>
                  <p className="mt-1 text-xs text-stone">
                    {timeInputValue(s.starts_at)}–{timeInputValue(s.ends_at)}
                    {s.label ? ` · ${s.label}` : ""} · capacity {s.capacity}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs underline"
                  disabled={busy}
                  onClick={() => void toggleSlot(s.id)}
                >
                  {s.is_active ? "Deactivate" : "Activate"}
                </button>
              </li>
            ))}
          </ul>
          {!upcoming.length ? (
            <p className="text-sm text-stone">
              No upcoming in-town pickups. Schedule one above when you have the
              Richmond details.
            </p>
          ) : null}
        </div>

        {past.length ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-stone">
              Past
            </p>
            <ul className="space-y-2">
              {past.slice(0, 10).map((s) => (
                <li
                  key={s.id}
                  className="border border-parchment bg-cream/40 px-4 py-2 text-xs text-stone"
                >
                  {s.pickup_date} · {locName(s)} ·{" "}
                  {timeInputValue(s.starts_at)}–{timeInputValue(s.ends_at)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
