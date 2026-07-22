"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { MediaAssetPicker } from "@/components/admin/MediaAssetPicker";
import type { VesselRow } from "@/lib/order/mappers";

export function SsVesselsManager() {
  const [rows, setRows] = useState<VesselRow[]>([]);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [setupError, setSetupError] = useState("");
  const [draft, setDraft] = useState<VesselRow | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/ss/vessels", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setSetupError(data.error ?? "Could not load vessels.");
      return;
    }
    setRows(data.vessels ?? []);
    setSetupError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!draft) return;
    const isNew = !rows.some((r) => r.id === draft.id);
    const res = await fetch(
      isNew ? "/api/admin/ss/vessels" : `/api/admin/ss/vessels/${draft.id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", message: data.error ?? "Save failed." });
      return;
    }
    setNotice({ type: "success", message: "Vessel saved." });
    setDraft(null);
    await load();
  }

  if (setupError) return <p className="text-sm text-bark">{setupError}</p>;

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
          <h1 className="font-serif text-2xl text-bark">Vessels</h1>
          <p className="mt-1 text-sm text-stone">
            Inventory quantity and upcharge (cents). Qty 0 hides from checkout.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary text-sm"
          onClick={() =>
            setDraft({
              id: crypto.randomUUID(),
              slug: "",
              name: "",
              description: "",
              image_url: "",
              image_alt: "",
              qty_on_hand: 1,
              price_adjustment_cents: 0,
              is_active: true,
              sort_order: (rows.length + 1) * 10,
            })
          }
        >
          Add vessel
        </button>
      </div>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-parchment bg-white px-4 py-3"
          >
            <div>
              <p className="font-medium text-bark">
                {r.name} · qty {r.qty_on_hand}
                {r.price_adjustment_cents
                  ? ` · +$${(r.price_adjustment_cents / 100).toFixed(0)}`
                  : " · included"}
              </p>
              <p className="text-xs text-stone">
                /{r.slug}
                {!r.is_active ? " · inactive" : ""}
              </p>
            </div>
            <button
              type="button"
              className="text-sm underline"
              onClick={() => setDraft({ ...r })}
            >
              Edit
            </button>
          </li>
        ))}
      </ul>

      {draft ? (
        <div className="space-y-4 border border-parchment bg-white p-5">
          <h2 className="font-serif text-lg text-bark">Edit vessel</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Name
              <input
                className="input mt-1 w-full"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Slug
              <input
                className="input mt-1 w-full font-mono text-xs"
                value={draft.slug}
                onChange={(e) =>
                  setDraft({ ...draft, slug: e.target.value.toLowerCase() })
                }
              />
            </label>
            <label className="text-sm">
              Quantity on hand
              <input
                type="number"
                min={0}
                className="input mt-1 w-full"
                value={draft.qty_on_hand}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    qty_on_hand: Number(e.target.value) || 0,
                  })
                }
              />
            </label>
            <label className="text-sm">
              Upcharge (cents)
              <input
                type="number"
                className="input mt-1 w-full"
                value={draft.price_adjustment_cents}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    price_adjustment_cents: Number(e.target.value) || 0,
                  })
                }
              />
            </label>
          </div>
          <label className="block text-sm">
            Description
            <textarea
              className="input mt-1 w-full resize-y"
              rows={3}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </label>
          <MediaAssetPicker
            label="Image"
            valueUrl={draft.image_url}
            valueAlt={draft.image_alt}
            onChange={({ url, alt }) =>
              setDraft({
                ...draft,
                image_url: url,
                image_alt: alt || draft.image_alt,
              })
            }
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) =>
                setDraft({ ...draft, is_active: e.target.checked })
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
              onClick={() => setDraft(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
