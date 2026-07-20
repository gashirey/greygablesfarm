"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type MediaAsset = {
  id: string;
  public_url: string;
  filename: string;
  alt_text: string | null;
};

type MediaAssetPickerProps = {
  label: string;
  valueUrl: string;
  valueAlt: string;
  onChange: (next: { url: string; alt: string }) => void;
  required?: boolean;
};

export function MediaAssetPicker({
  label,
  valueUrl,
  valueAlt,
  onChange,
  required,
}: MediaAssetPickerProps) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/media/assets", { cache: "no-store" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not load media library.");
      return;
    }
    setAssets((data.assets ?? []) as MediaAsset[]);
  }, []);

  useEffect(() => {
    if (open && assets.length === 0) void load();
  }, [open, assets.length, load]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-bark">
          {label}
          {required ? <span className="text-stone"> (required to publish)</span> : null}
        </p>
        <button
          type="button"
          className="btn btn-secondary text-xs"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close library" : "Pick from media library"}
        </button>
      </div>

      {valueUrl ? (
        <div className="relative h-36 w-full max-w-md overflow-hidden border border-parchment bg-cream">
          <Image
            src={valueUrl}
            alt={valueAlt || label}
            fill
            className="object-cover"
            sizes="400px"
          />
        </div>
      ) : (
        <p className="border border-dashed border-parchment bg-cream px-3 py-6 text-sm text-stone">
          No image selected yet.
        </p>
      )}

      <label className="block text-sm">
        Image URL
        <input
          className="input mt-1 w-full font-mono text-xs"
          value={valueUrl}
          onChange={(e) => onChange({ url: e.target.value, alt: valueAlt })}
          placeholder="https://… or pick from library"
        />
      </label>
      <label className="block text-sm">
        Alt text
        <input
          className="input mt-1 w-full"
          value={valueAlt}
          onChange={(e) => onChange({ url: valueUrl, alt: e.target.value })}
        />
      </label>

      {open ? (
        <div className="border border-parchment bg-white p-3">
          {loading ? (
            <p className="text-sm text-stone">Loading library…</p>
          ) : error ? (
            <p className="text-sm text-bark">{error}</p>
          ) : assets.length === 0 ? (
            <p className="text-sm text-stone">
              No assets yet. Upload photos under Admin → Media first.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {assets.map((asset) => (
                <li key={asset.id}>
                  <button
                    type="button"
                    className={`relative block aspect-square w-full overflow-hidden border ${
                      valueUrl === asset.public_url
                        ? "border-bark"
                        : "border-parchment"
                    }`}
                    onClick={() => {
                      onChange({
                        url: asset.public_url,
                        alt: valueAlt || asset.alt_text || asset.filename,
                      });
                      setOpen(false);
                    }}
                    title={asset.filename}
                  >
                    <Image
                      src={asset.public_url}
                      alt={asset.alt_text || asset.filename}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
