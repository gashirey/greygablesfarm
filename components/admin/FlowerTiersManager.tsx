"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { MediaAssetPicker } from "@/components/admin/MediaAssetPicker";
import type { FlowerTierRow } from "@/lib/flowers/types";

type Draft = {
  id: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  cta_label: string;
  image_url: string;
  image_alt: string;
  image_object_position: string;
  is_popular: boolean;
  is_visible: boolean;
  sort_order: number;
};

function toDraft(row: FlowerTierRow): Draft {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    description: row.description,
    cta_label: row.cta_label,
    image_url: row.image_url,
    image_alt: row.image_alt,
    image_object_position: row.image_object_position ?? "",
    is_popular: row.is_popular,
    is_visible: row.is_visible,
    sort_order: row.sort_order,
  };
}

const emptyNew = {
  slug: "",
  name: "",
  price: 150,
  description: "",
  cta_label: "Order for delivery",
  image_url: "",
  image_alt: "",
  image_object_position: "",
  is_popular: false,
  is_visible: true,
  sort_order: 40,
};

export function FlowerTiersManager() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTier, setNewTier] = useState(emptyNew);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [setupError, setSetupError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/flower-tiers", { cache: "no-store" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setSetupError(data.error ?? "Could not load flower tiers.");
      return;
    }
    const tiers = (data.tiers ?? []) as FlowerTierRow[];
    setDrafts(tiers.map(toDraft));
    setSetupError("");
    setExpanded((prev) => prev ?? tiers[0]?.id ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    );
  }

  async function saveDraft(draft: Draft) {
    setSavingId(draft.id);
    setNotice(null);
    const res = await fetch(`/api/admin/flower-tiers/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: draft.slug,
        name: draft.name,
        price: draft.price,
        description: draft.description,
        cta_label: draft.cta_label,
        image_url: draft.image_url,
        image_alt: draft.image_alt,
        image_object_position: draft.image_object_position || null,
        is_popular: draft.is_popular,
        is_visible: draft.is_visible,
        sort_order: draft.sort_order,
      }),
    });
    const data = await res.json();
    setSavingId(null);
    if (!res.ok) {
      setNotice({ type: "error", message: data.error ?? "Save failed." });
      return;
    }
    setNotice({ type: "success", message: `Saved “${draft.name}”.` });
    await load();
  }

  async function removeTier(id: string, name: string) {
    if (
      !window.confirm(
        `Remove “${name}” from the flowers page? Existing orders keep their recorded tier name.`,
      )
    ) {
      return;
    }
    const res = await fetch(`/api/admin/flower-tiers/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", message: data.error ?? "Delete failed." });
      return;
    }
    setNotice({ type: "success", message: "Tier removed." });
    if (expanded === id) setExpanded(null);
    await load();
  }

  async function addTier(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setNotice(null);
    const res = await fetch("/api/admin/flower-tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newTier,
        image_object_position: newTier.image_object_position || null,
      }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) {
      setNotice({ type: "error", message: data.error ?? "Could not add tier." });
      return;
    }
    setNewTier({ ...emptyNew, sort_order: (drafts.length + 1) * 10 });
    setNotice({ type: "success", message: "Tier added." });
    await load();
    if (data.tier?.id) setExpanded(data.tier.id);
  }

  if (setupError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-bark">{setupError}</p>
        <p className="text-sm text-stone">
          Paste and run{" "}
          <code className="text-xs">supabase/migrations/028_flower_tiers.sql</code>{" "}
          in the Supabase SQL Editor, then refresh.
        </p>
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-stone">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      {notice && (
        <AdminNotice
          type={notice.type}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-bark">Flowers catalog</h1>
          <p className="mt-1 max-w-xl text-sm text-stone">
            Manage Designer&apos;s Choice cards on{" "}
            <Link href="/flowers" className="underline underline-offset-2">
              /flowers
            </Link>
            : images, names, prices, descriptions, and order. Changes go live
            after you save.
          </p>
        </div>
        <Link href="/flowers" className="btn btn-secondary text-sm">
          View page
        </Link>
      </div>

      <ul className="space-y-4">
        {drafts.map((draft) => {
          const open = expanded === draft.id;
          return (
            <li
              key={draft.id}
              className="border border-parchment bg-white"
            >
              <button
                type="button"
                className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-cream/60"
                onClick={() => setExpanded(open ? null : draft.id)}
              >
                <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-parchment">
                  {draft.image_url ? (
                    <Image
                      src={draft.image_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-bark">
                    {draft.name || "Untitled"}{" "}
                    <span className="font-serif text-stone">${draft.price}</span>
                  </p>
                  <p className="truncate text-xs text-stone">
                    /{draft.slug}
                    {draft.is_popular ? " · Most popular" : ""}
                    {!draft.is_visible ? " · Hidden" : ""}
                    {" · "}order {draft.sort_order}
                  </p>
                </div>
                <span className="text-xs text-stone">{open ? "Close" : "Edit"}</span>
              </button>

              {open ? (
                <div className="space-y-5 border-t border-parchment px-4 py-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm">
                      Name
                      <input
                        className="input mt-1 w-full"
                        value={draft.name}
                        onChange={(e) =>
                          updateDraft(draft.id, { name: e.target.value })
                        }
                      />
                    </label>
                    <label className="text-sm">
                      Price (USD, whole dollars)
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className="input mt-1 w-full"
                        value={draft.price}
                        onChange={(e) =>
                          updateDraft(draft.id, {
                            price: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </label>
                    <label className="text-sm">
                      Slug (order URL key)
                      <input
                        className="input mt-1 w-full font-mono text-xs"
                        value={draft.slug}
                        onChange={(e) =>
                          updateDraft(draft.id, {
                            slug: e.target.value.toLowerCase(),
                          })
                        }
                      />
                    </label>
                    <label className="text-sm">
                      Sort order (left → right on desktop)
                      <input
                        type="number"
                        className="input mt-1 w-full"
                        value={draft.sort_order}
                        onChange={(e) =>
                          updateDraft(draft.id, {
                            sort_order: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </label>
                  </div>

                  <label className="block text-sm">
                    Description
                    <textarea
                      className="input mt-1 w-full resize-y"
                      rows={4}
                      value={draft.description}
                      onChange={(e) =>
                        updateDraft(draft.id, { description: e.target.value })
                      }
                    />
                  </label>

                  <label className="block text-sm">
                    Button label
                    <input
                      className="input mt-1 w-full"
                      value={draft.cta_label}
                      onChange={(e) =>
                        updateDraft(draft.id, { cta_label: e.target.value })
                      }
                    />
                  </label>

                  <MediaAssetPicker
                    label="Card image"
                    valueUrl={draft.image_url}
                    valueAlt={draft.image_alt}
                    onChange={({ url, alt }) =>
                      updateDraft(draft.id, {
                        image_url: url,
                        image_alt: alt || draft.image_alt,
                      })
                    }
                  />

                  <label className="block text-sm">
                    Image crop position{" "}
                    <span className="font-normal text-stone">
                      (optional CSS, e.g. 50% 80%)
                    </span>
                    <input
                      className="input mt-1 w-full font-mono text-xs"
                      placeholder="50% 50%"
                      value={draft.image_object_position}
                      onChange={(e) =>
                        updateDraft(draft.id, {
                          image_object_position: e.target.value,
                        })
                      }
                    />
                  </label>

                  <div className="flex flex-wrap gap-6 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={draft.is_popular}
                        onChange={(e) =>
                          updateDraft(draft.id, {
                            is_popular: e.target.checked,
                          })
                        }
                      />
                      Most popular badge
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={draft.is_visible}
                        onChange={(e) =>
                          updateDraft(draft.id, {
                            is_visible: e.target.checked,
                          })
                        }
                      />
                      Visible on /flowers
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="btn border-[var(--color-salmon-button)] bg-[var(--color-salmon-button)] text-white hover:bg-[var(--color-salmon-button-hover)] disabled:opacity-60"
                      disabled={savingId === draft.id}
                      onClick={() => void saveDraft(draft)}
                    >
                      {savingId === draft.id ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary text-sm"
                      onClick={() => void removeTier(draft.id, draft.name)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <form
        onSubmit={(e) => void addTier(e)}
        className="space-y-4 border border-parchment bg-white p-5"
      >
        <h2 className="font-serif text-lg text-bark">Add tier</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Name
            <input
              className="input mt-1 w-full"
              required
              value={newTier.name}
              onChange={(e) =>
                setNewTier((t) => ({ ...t, name: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            Slug
            <input
              className="input mt-1 w-full font-mono text-xs"
              required
              placeholder="premium"
              value={newTier.slug}
              onChange={(e) =>
                setNewTier((t) => ({
                  ...t,
                  slug: e.target.value.toLowerCase(),
                }))
              }
            />
          </label>
          <label className="text-sm">
            Price
            <input
              type="number"
              min={1}
              className="input mt-1 w-full"
              required
              value={newTier.price}
              onChange={(e) =>
                setNewTier((t) => ({
                  ...t,
                  price: Number(e.target.value) || 0,
                }))
              }
            />
          </label>
          <label className="text-sm">
            Sort order
            <input
              type="number"
              className="input mt-1 w-full"
              value={newTier.sort_order}
              onChange={(e) =>
                setNewTier((t) => ({
                  ...t,
                  sort_order: Number(e.target.value) || 0,
                }))
              }
            />
          </label>
        </div>
        <label className="block text-sm">
          Description
          <textarea
            className="input mt-1 w-full resize-y"
            rows={3}
            value={newTier.description}
            onChange={(e) =>
              setNewTier((t) => ({ ...t, description: e.target.value }))
            }
          />
        </label>
        <MediaAssetPicker
          label="Card image"
          valueUrl={newTier.image_url}
          valueAlt={newTier.image_alt}
          onChange={({ url, alt }) =>
            setNewTier((t) => ({
              ...t,
              image_url: url,
              image_alt: alt || t.image_alt,
            }))
          }
        />
        <button
          type="submit"
          disabled={adding}
          className="btn btn-secondary disabled:opacity-60"
        >
          {adding ? "Adding…" : "Add tier"}
        </button>
      </form>
    </div>
  );
}
