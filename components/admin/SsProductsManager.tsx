"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { MediaAssetPicker } from "@/components/admin/MediaAssetPicker";
import type { ProductRow } from "@/lib/order/mappers";

export function SsProductsManager() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [setupError, setSetupError] = useState("");
  const [draft, setDraft] = useState<ProductRow | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/ss/products", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setSetupError(data.error ?? "Could not load products.");
      return;
    }
    setRows(data.products ?? []);
    setSetupError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!draft) return;
    const isNew = !rows.some((r) => r.id === draft.id);
    const res = await fetch(
      isNew ? "/api/admin/ss/products" : `/api/admin/ss/products/${draft.id}`,
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
    setNotice({ type: "success", message: "Product saved." });
    setDraft(null);
    await load();
  }

  if (setupError) {
    return <p className="text-sm text-bark">{setupError}</p>;
  }

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
          <h1 className="font-serif text-2xl text-bark">Order products</h1>
          <p className="mt-1 text-sm text-stone">
            Self-service arrangements. Prices in cents (15000 = $150).
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
              base_price_cents: 15000,
              capacity_cost: 1,
              requires_vessel: false,
              allows_delivery: true,
              allows_pickup: true,
              image_url: "",
              image_alt: "",
              is_active: true,
              sort_order: (rows.length + 1) * 10,
            })
          }
        >
          Add product
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
                {r.name}{" "}
                <span className="text-stone">
                  ${(r.base_price_cents / 100).toFixed(0)}
                </span>
              </p>
              <p className="text-xs text-stone">
                /{r.slug}
                {r.requires_vessel ? " · vessel required" : ""}
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
          <h2 className="font-serif text-lg text-bark">Edit product</h2>
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
              Price (cents)
              <input
                type="number"
                className="input mt-1 w-full"
                value={draft.base_price_cents}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    base_price_cents: Number(e.target.value) || 0,
                  })
                }
              />
            </label>
            <label className="text-sm">
              Capacity cost
              <input
                type="number"
                className="input mt-1 w-full"
                value={draft.capacity_cost}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    capacity_cost: Number(e.target.value) || 1,
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
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.requires_vessel}
                onChange={(e) =>
                  setDraft({ ...draft, requires_vessel: e.target.checked })
                }
              />
              Requires vessel
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.allows_delivery}
                onChange={(e) =>
                  setDraft({ ...draft, allows_delivery: e.target.checked })
                }
              />
              Delivery
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.allows_pickup}
                onChange={(e) =>
                  setDraft({ ...draft, allows_pickup: e.target.checked })
                }
              />
              Pickup
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) =>
                  setDraft({ ...draft, is_active: e.target.checked })
                }
              />
              Active
            </label>
          </div>
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
