"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SITE_MEDIA_SLOT_LABELS,
  SITE_MEDIA_SLOTS,
  type SiteMediaSlotKey,
} from "@/lib/site-media/slots";
import {
  compressImageBeforeUpload,
  formatBytes,
} from "@/lib/admin/client-compress-image";
import { readAdminUploadError } from "@/lib/admin/upload-response";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { SaveToPhotosButton } from "@/components/admin/SaveToPhotosButton";
import { SiteSlotsOverview } from "@/components/admin/SiteSlotsOverview";
import {
  MEDIA_ORIENTATION_LABELS,
  mediaOrientation,
  type MediaOrientation,
} from "@/lib/media/orientation";
import type { MediaAsset, MediaShoot } from "@/lib/media/types";
import type { FarmProduct } from "@/lib/inventory/types";

function isRemoteSrc(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function probeImageSize(
  url: string,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

const BATCH_SIZE = 8;

type OrientationFilter = "all" | MediaOrientation;

export function MediaLibrary() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shoots, setShoots] = useState<MediaShoot[]>([]);
  const [shootId, setShootId] = useState<string>("");
  const [newShootName, setNewShootName] = useState("");
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [products, setProducts] = useState<FarmProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [orientationFilter, setOrientationFilter] =
    useState<OrientationFilter>("all");
  const [scanningDimensions, setScanningDimensions] = useState(false);
  const scannedShootRef = useRef<string | null>(null);

  function showNotice(type: "success" | "error", text: string) {
    setNotice({ type, message: text });
    if (type === "success") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const loadShoots = useCallback(async () => {
    const res = await fetch("/api/admin/media/shoots");
    const data = await res.json();
    if (!res.ok) {
      setSetupError(data.error ?? "Could not load shoots. Run migration 008 in Supabase.");
      return false;
    }
    const list = (data.shoots ?? []) as MediaShoot[];
    setShoots(list);
    setShootId((prev) => prev || list[0]?.id || "");
    setSetupError("");
    return true;
  }, []);

  const loadAssets = useCallback(async (id: string) => {
    if (!id) {
      setAssets([]);
      return;
    }
    const res = await fetch(`/api/admin/media/assets?shoot_id=${id}`);
    const data = await res.json();
    if (!res.ok) {
      setSetupError(data.error ?? "Could not load library.");
      return;
    }
    const list = (data.assets ?? []) as MediaAsset[];
    setAssets(
      list.map((a) => ({
        ...a,
        width: a.width ?? null,
        height: a.height ?? null,
      })),
    );
  }, []);

  const fillMissingDimensions = useCallback(
    async (list: MediaAsset[], forShootId: string) => {
      const missing = list.filter((a) => !a.width || !a.height);
      if (!missing.length) return;

      setScanningDimensions(true);
      const probed: { id: string; width: number; height: number }[] = [];

      for (let i = 0; i < missing.length; i += 6) {
        const chunk = missing.slice(i, i + 6);
        const results = await Promise.all(
          chunk.map(async (asset) => {
            const size = await probeImageSize(asset.public_url);
            if (!size) return null;
            return { id: asset.id, ...size };
          }),
        );
        for (const row of results) {
          if (row) probed.push(row);
        }
      }

      if (probed.length) {
        setAssets((prev) =>
          prev.map((asset) => {
            const hit = probed.find((p) => p.id === asset.id);
            return hit
              ? { ...asset, width: hit.width, height: hit.height }
              : asset;
          }),
        );

        const res = await fetch("/api/admin/media/assets/dimensions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assets: probed }),
        });
        const data = await res.json();
        if (!res.ok && data.error) {
          // Columns missing until migration 020 — filter still works in-session.
          if (/width|column|migration/i.test(String(data.error))) {
            setMessage(
              "Orientation filter is ready for this session. Run migration 020_media_asset_dimensions.sql to save sizes permanently.",
            );
          }
        }
      }

      // Server Sharp backfill for anything the browser couldn't read
      const stillMissing = missing.length - probed.length;
      if (stillMissing > 0) {
        await fetch("/api/admin/media/assets/dimensions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shoot_id: forShootId, limit: 40 }),
        });
        await loadAssets(forShootId);
      }

      setScanningDimensions(false);
    },
    [loadAssets],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      const ok = await loadShoots();
      if (ok) {
        const res = await fetch("/api/admin/products", { cache: "no-store" });
        const pdata = await res.json();
        const all = (pdata.products ?? []) as FarmProduct[];
        setProducts(all.filter((p) => p.is_active));
      }
      setLoading(false);
    })();
  }, [loadShoots]);

  useEffect(() => {
    if (!shootId) return;
    scannedShootRef.current = null;
    setAssets([]);
    setOrientationFilter("all");
    void loadAssets(shootId);
  }, [shootId, loadAssets]);

  useEffect(() => {
    if (!shootId || !assets.length) return;
    if (scannedShootRef.current === shootId) return;
    // Only scan once assets for this shoot have loaded
    if (assets.some((a) => a.shoot_id && a.shoot_id !== shootId)) return;
    const needsScan = assets.some((a) => !a.width || !a.height);
    if (!needsScan) {
      scannedShootRef.current = shootId;
      return;
    }
    scannedShootRef.current = shootId;
    void fillMissingDimensions(assets, shootId);
  }, [assets, shootId, fillMissingDimensions]);

  async function createShoot(e: React.FormEvent) {
    e.preventDefault();
    const name = newShootName.trim();
    if (!name) return;

    const res = await fetch("/api/admin/media/shoots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Could not create shoot.");
      return;
    }

    setNewShootName("");
    await loadShoots();
    setShootId(data.shoot.id);
    setMessage(`Created shoot “${name}”.`);
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!files.length) return;
    if (!shootId) {
      setMessage("Select or create a shoot first.");
      return;
    }

    setUploading(true);
    setMessage("");
    let done = 0;
    const allErrors: string[] = [];

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const prepared: File[] = [];

      for (const file of batch) {
        setUploadProgress(
          `Optimizing ${done + prepared.length + 1} of ${files.length} (${formatBytes(file.size)})…`,
        );
        try {
          const { file: ready, compressed, originalBytes, outputBytes } =
            await compressImageBeforeUpload(file);
          if (compressed) {
            console.info(
              `[upload] ${file.name}: ${formatBytes(originalBytes)} → ${formatBytes(outputBytes)}`,
            );
          }
          prepared.push(ready);
        } catch {
          allErrors.push(`${file.name}: could not optimize in browser.`);
        }
      }

      if (!prepared.length) {
        done += batch.length;
        continue;
      }

      setUploadProgress(
        `Uploading ${done + 1}–${done + prepared.length} of ${files.length}…`,
      );

      const formData = new FormData();
      formData.append("shoot_id", shootId);
      for (const file of prepared) {
        formData.append("files", file);
      }

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });
      done += batch.length;

      if (!res.ok) {
        allErrors.push(await readAdminUploadError(res));
        continue;
      }

      const data = await res.json();
      const batchErrors = (data.errors ?? []) as { filename: string; error: string }[];
      for (const err of batchErrors) {
        allErrors.push(`${err.filename}: ${err.error}`);
      }
    }

    setUploading(false);
    setUploadProgress("");
    await loadAssets(shootId);

    if (allErrors.length) {
      showNotice(
        "error",
        `Upload issues: ${allErrors.slice(0, 3).join("; ")}${allErrors.length > 3 ? "…" : ""}`,
      );
    } else {
      showNotice("success", `Uploaded ${files.length} image(s). Assign them below.`);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      void uploadFiles(e.dataTransfer.files);
    }
  }

  async function assign(
    assetId: string,
    target: "site_slot" | "product" | "hero_slide",
    slotOrProduct?: string,
  ) {
    setAssigningId(assetId);

    const body =
      target === "hero_slide"
        ? { asset_id: assetId, target: "hero_slide" as const }
        : target === "site_slot"
          ? {
              asset_id: assetId,
              target: "site_slot" as const,
              slot_key: slotOrProduct,
            }
          : {
              asset_id: assetId,
              target: "product" as const,
              product_id: slotOrProduct,
              is_primary: true,
            };

    try {
      const res = await fetch("/api/admin/media/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (res.ok) {
        const text = data.message ?? "Site updated.";
        showNotice("success", text);
        setSlotsRefreshKey((k) => k + 1);
      } else {
        showNotice(
          "error",
          data.error ??
            "Assign failed. Check migrations 007 and 010 in Supabase.",
        );
      }
    } catch {
      showNotice("error", "Assign failed — network or server error.");
    } finally {
      setAssigningId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-stone">Loading library…</p>;
  }

  if (setupError) {
    return (
      <div className="border border-parchment bg-white p-5 text-sm">
        <p className="font-medium text-bark">Media library not ready</p>
        <p className="mt-2 text-stone">{setupError}</p>
        <p className="mt-3 text-stone">
          In Supabase SQL Editor, run{" "}
          <code className="text-bark">supabase/migrations/008_media_library.sql</code>
          {". "}
          If you use site slots, also run{" "}
          <code className="text-bark">007_site_media_slots.sql</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {notice ? (
        <AdminNotice
          type={notice.type}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      ) : null}

      {notice?.type === "success" ? (
        <p className="text-sm">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-salmon-dark underline underline-offset-2"
          >
            View live site
          </a>
        </p>
      ) : null}

      <SiteSlotsOverview refreshKey={slotsRefreshKey} />

      {message && !notice ? (
        <p className="text-sm text-stone" role="status">
          {message}
        </p>
      ) : null}

      <section className="border border-parchment bg-white p-5">
        <h2 className="font-serif text-lg text-bark">Shoot</h2>
        <p className="mt-1 text-sm text-stone">
          Group uploads (e.g. “May 2026 shoot”). Edited photos can go in a new shoot later.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Active shoot
            <select
              value={shootId}
              onChange={(e) => setShootId(e.target.value)}
              className="input mt-1 block min-w-[12rem]"
            >
              {shoots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <form onSubmit={createShoot} className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              New shoot
              <input
                type="text"
                value={newShootName}
                onChange={(e) => setNewShootName(e.target.value)}
                placeholder="May 2026"
                className="input mt-1 block w-40"
              />
            </label>
            <button type="submit" className="btn border-bark bg-bark text-cream">
              Add
            </button>
          </form>
        </div>
      </section>

      <section
        className={`border border-dashed p-8 text-center transition-colors ${
          dragOver ? "border-salmon bg-salmon-light/30" : "border-parchment bg-white"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <p className="font-medium text-bark">Drop images here</p>
        <p className="mt-1 text-sm text-stone">
          Large files (e.g. 30MB+) are optimized in your browser first, then
          uploaded. Saved at 2400px max edge as JPEG. GIFs upload as-is.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            if (e.target.files?.length) void uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={uploading || !shootId}
          onClick={() => inputRef.current?.click()}
          className="btn mt-4 border-bark bg-bark text-cream disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Choose files"}
        </button>
        {uploadProgress && (
          <p className="mt-3 text-sm text-stone">{uploadProgress}</p>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-lg text-bark">
            Library{" "}
            {assets.length
              ? `(${
                  orientationFilter === "all"
                    ? assets.length
                    : assets.filter(
                        (a) =>
                          mediaOrientation(a.width, a.height) ===
                          orientationFilter,
                      ).length
                }${
                  orientationFilter === "all"
                    ? ""
                    : ` of ${assets.length}`
                })`
              : ""}
          </h2>
          {scanningDimensions ? (
            <p className="text-xs text-stone">Reading image sizes…</p>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-stone">
          Use on site — assigns to homepage, about, or a product.
        </p>

        <p className="mt-2 text-sm text-stone">
          On your phone:{" "}
          <a href="/admin/social" className="underline hover:text-bark">
            Social
          </a>{" "}
          for Photos (share sheet) and captions.
        </p>

        {assets.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-stone">
              Orientation
            </span>
            {(
              [
                ["all", "All"],
                ["landscape", MEDIA_ORIENTATION_LABELS.landscape],
                ["portrait", MEDIA_ORIENTATION_LABELS.portrait],
                ["square", MEDIA_ORIENTATION_LABELS.square],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setOrientationFilter(value)}
                className={
                  orientationFilter === value
                    ? "border border-bark bg-bark px-2.5 py-1 text-xs text-white"
                    : "border border-parchment bg-white px-2.5 py-1 text-xs text-stone hover:border-bark/40 hover:text-bark"
                }
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              disabled={scanningDimensions}
              onClick={() => {
                scannedShootRef.current = null;
                void fillMissingDimensions(assets, shootId);
              }}
              className="ml-auto border border-parchment px-2.5 py-1 text-xs text-stone hover:border-bark/40 hover:text-bark disabled:opacity-50"
            >
              Rescan sizes
            </button>
          </div>
        ) : null}

        {assets.length === 0 ? (
          <p className="mt-6 text-sm text-stone">No images in this shoot yet.</p>
        ) : orientationFilter !== "all" &&
          !assets.some(
            (a) =>
              mediaOrientation(a.width, a.height) === orientationFilter,
          ) ? (
          <p className="mt-6 text-sm text-stone">
            No {MEDIA_ORIENTATION_LABELS[orientationFilter].toLowerCase()}{" "}
            images in this shoot
            {scanningDimensions ? " yet — still reading sizes…" : "."}
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assets
              .filter((asset) => {
                if (orientationFilter === "all") return true;
                return (
                  mediaOrientation(asset.width, asset.height) ===
                  orientationFilter
                );
              })
              .map((asset) => {
              const orientation = mediaOrientation(asset.width, asset.height);
              return (
              <li
                key={asset.id}
                className="border border-parchment bg-white p-2 sm:p-3"
              >
                <div className="relative aspect-square overflow-hidden bg-parchment sm:aspect-[4/3]">
                  <Image
                    src={asset.public_url}
                    alt={asset.alt_text ?? asset.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 240px"
                    unoptimized={isRemoteSrc(asset.public_url)}
                  />
                  {orientation ? (
                    <span className="absolute left-1.5 top-1.5 border border-parchment bg-cream/95 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-bark">
                      {MEDIA_ORIENTATION_LABELS[orientation]}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 truncate text-xs text-stone">{asset.filename}</p>
                {asset.width && asset.height ? (
                  <p className="text-[10px] text-stone">
                    {asset.width}×{asset.height}
                  </p>
                ) : null}
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <a
                    href={asset.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn border-parchment py-2 text-center text-xs"
                  >
                    Open
                  </a>
                  <SaveToPhotosButton
                    downloadUrl={`/api/admin/social/download?kind=media&id=${asset.id}`}
                    filename={asset.filename}
                    onResult={(r) => {
                      if (r.ok) setMessage(r.message);
                      else if (r.message !== "Cancelled.") setMessage(r.message);
                    }}
                  />
                </div>
                <label className="mt-2 block text-xs">
                  Use on site
                  <select
                    className="input mt-1 w-full text-base disabled:opacity-50 sm:text-xs"
                    disabled={assigningId === asset.id}
                    value=""
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v || assigningId) return;
                      if (v === "hero_slide") {
                        void assign(asset.id, "hero_slide");
                      } else if (v.startsWith("slot:")) {
                        void assign(
                          asset.id,
                          "site_slot",
                          v.slice("slot:".length) as SiteMediaSlotKey,
                        );
                      } else if (v.startsWith("product:")) {
                        void assign(asset.id, "product", v.slice("product:".length));
                      }
                    }}
                  >
                    <option value="">Choose…</option>
                    <optgroup label="Site">
                      <option value="hero_slide">Add to hero slideshow</option>
                      {SITE_MEDIA_SLOTS.map((key) => (
                        <option key={key} value={`slot:${key}`}>
                          {key === "hero"
                            ? "Homepage hero (single fallback)"
                            : SITE_MEDIA_SLOT_LABELS[key]}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Products">
                      {products.map((p) => (
                        <option key={p.id} value={`product:${p.id}`}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </label>
              </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
