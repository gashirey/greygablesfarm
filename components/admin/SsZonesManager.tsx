"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";

type Zone = {
  id: string;
  name: string;
  fee_cents: number;
  is_active: boolean;
  sort_order: number;
  zips: string[];
};

export function SsZonesManager() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Zone | null>(null);
  const [zipsText, setZipsText] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/ss/zones", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load zones.");
      return;
    }
    setZones(data.zones ?? []);
    setError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!editing) return;
    const zips = zipsText
      .split(/[\s,]+/)
      .map((z) => z.trim())
      .filter(Boolean);
    const isNew = !zones.some((z) => z.id === editing.id);
    const res = await fetch(
      isNew ? "/api/admin/ss/zones" : `/api/admin/ss/zones/${editing.id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editing, zips }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", message: data.error ?? "Save failed." });
      return;
    }
    setNotice({ type: "success", message: "Zone saved." });
    setEditing(null);
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-bark">Delivery zones</h1>
          <p className="mt-1 text-sm text-stone">
            ZIP codes determine delivery fee. Outside ZIPs are declined online.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary text-sm"
          onClick={() => {
            setEditing({
              id: crypto.randomUUID(),
              name: "",
              fee_cents: 0,
              is_active: true,
              sort_order: (zones.length + 1) * 10,
              zips: [],
            });
            setZipsText("");
          }}
        >
          Add zone
        </button>
      </div>

      <ul className="space-y-2">
        {zones.map((z) => (
          <li
            key={z.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-parchment bg-white px-4 py-3"
          >
            <div>
              <p className="font-medium text-bark">
                {z.name} · ${(z.fee_cents / 100).toFixed(2)}
              </p>
              <p className="text-xs text-stone">
                {z.zips.length} ZIPs
                {z.zips.length
                  ? ` · ${z.zips.slice(0, 6).join(", ")}${z.zips.length > 6 ? "…" : ""}`
                  : ""}
                {!z.is_active ? " · inactive" : ""}
              </p>
            </div>
            <button
              type="button"
              className="text-sm underline"
              onClick={() => {
                setEditing({ ...z });
                setZipsText(z.zips.join(", "));
              }}
            >
              Edit
            </button>
          </li>
        ))}
      </ul>

      {editing ? (
        <div className="space-y-3 border border-parchment bg-white p-5">
          <label className="block text-sm">
            Name
            <input
              className="input mt-1 w-full"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Delivery fee ($)
            <input
              type="number"
              min={0}
              step="0.01"
              className="input mt-1 w-full"
              value={(editing.fee_cents / 100).toFixed(2)}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  fee_cents: Math.max(
                    0,
                    Math.round(Number(e.target.value) * 100) || 0,
                  ),
                })
              }
            />
          </label>
          <label className="block text-sm">
            ZIP codes (comma or space separated)
            <textarea
              className="input mt-1 w-full resize-y font-mono text-xs"
              rows={4}
              value={zipsText}
              onChange={(e) => setZipsText(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.is_active}
              onChange={(e) =>
                setEditing({ ...editing, is_active: e.target.checked })
              }
            />
            Active
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              className="btn border-[var(--color-salmon-button)] bg-[var(--color-salmon-button)] text-white"
              onClick={() => void save()}
            >
              Save
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
