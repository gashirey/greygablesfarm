"use client";

import { useCallback, useEffect, useState } from "react";
import { designDirections } from "@/lib/design-lab/directions";
import { AdminNotice } from "@/components/admin/AdminNotice";
import type { SiteColorOverrides, SiteSettingsRow } from "@/lib/site-cms/types";

const COLOR_FIELDS: { key: keyof SiteColorOverrides; label: string }[] = [
  { key: "bg", label: "Page background" },
  { key: "surface", label: "Surface / cards" },
  { key: "text", label: "Body text" },
  { key: "muted", label: "Muted text" },
  { key: "accent", label: "Accent (buttons)" },
  { key: "green", label: "Garden green" },
  { key: "border", label: "Borders" },
];

export function SiteAppearancePanel() {
  const [settings, setSettings] = useState<SiteSettingsRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [setupError, setSetupError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/site-cms");
    const data = await res.json();
    if (!res.ok) {
      setSetupError(data.error ?? "Could not load site settings.");
      return;
    }
    setSettings(data.settings as SiteSettingsRow);
    setSetupError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(patch: Partial<SiteSettingsRow>) {
    if (!settings) return;
    setSaving(true);
    setNotice(null);

    const res = await fetch("/api/admin/site-cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setNotice({ type: "error", message: data.error ?? "Save failed." });
      return;
    }

    setSettings(data.settings as SiteSettingsRow);
    setNotice({ type: "success", message: "Appearance saved. Refresh the public site to preview." });
  }

  if (setupError) {
    return <p className="text-sm text-bark">{setupError}</p>;
  }

  if (!settings) {
    return <p className="text-sm text-stone">Loading…</p>;
  }

  const direction = designDirections.find((d) => d.id === settings.direction_id);

  return (
    <div className="space-y-8">
      {notice && (
        <AdminNotice type={notice.type} message={notice.message} onDismiss={() => setNotice(null)} />
      )}

      <section className="border border-parchment bg-white p-5">
        <h2 className="font-serif text-lg text-bark">Color palette</h2>
        <p className="mt-1 text-sm text-stone">
          Pick a preset direction, then optionally override individual colors.
        </p>

        <label className="mt-4 block text-sm">
          <span className="font-medium text-bark">Direction</span>
          <select
            className="input mt-1 max-w-md"
            value={settings.direction_id}
            onChange={(e) => {
              const direction_id = e.target.value as SiteSettingsRow["direction_id"];
              setSettings({ ...settings, direction_id });
            }}
          >
            {designDirections.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id.toUpperCase()} — {d.name}
              </option>
            ))}
          </select>
        </label>
        {direction && (
          <p className="mt-2 max-w-xl text-xs text-stone">{direction.essence}</p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
          {COLOR_FIELDS.map(({ key, label }) => {
            const preset = direction?.colors[key];
            const value = settings.color_overrides[key] ?? "";
            return (
              <label key={key} className="text-sm">
                <span className="font-medium text-bark">{label}</span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={value || preset || "#ffffff"}
                    className="h-9 w-12 cursor-pointer border border-parchment bg-white p-0.5"
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        color_overrides: {
                          ...settings.color_overrides,
                          [key]: e.target.value,
                        },
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder={preset ?? "Preset default"}
                    value={value}
                    className="input flex-1 font-mono text-xs"
                    onChange={(e) => {
                      const next = { ...settings.color_overrides };
                      if (!e.target.value.trim()) delete next[key];
                      else next[key] = e.target.value.trim();
                      setSettings({ ...settings, color_overrides: next });
                    }}
                  />
                </div>
              </label>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-primary text-sm"
            disabled={saving}
            onClick={() =>
              void save({
                direction_id: settings.direction_id,
                color_overrides: settings.color_overrides,
              })
            }
          >
            Save colors
          </button>
          <button
            type="button"
            className="btn btn-secondary text-sm"
            disabled={saving}
            onClick={() => {
              setSettings({ ...settings, color_overrides: {} });
              void save({ color_overrides: {} });
            }}
          >
            Reset color overrides
          </button>
        </div>
      </section>

      <section className="border border-parchment bg-white p-5">
        <h2 className="font-serif text-lg text-bark">Homepage hero layout</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 max-w-xl">
          <label className="text-sm">
            <span className="font-medium text-bark">Layout</span>
            <select
              className="input mt-1 w-full"
              value={settings.hero_layout}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  hero_layout: e.target.value as SiteSettingsRow["hero_layout"],
                })
              }
            >
              <option value="immersive">Immersive (full bleed)</option>
              <option value="split">Split</option>
              <option value="grounded">Grounded</option>
              <option value="standard">Standard</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-bark">Frame</span>
            <select
              className="input mt-1 w-full"
              value={settings.hero_frame}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  hero_frame: e.target.value as SiteSettingsRow["hero_frame"],
                })
              }
            >
              <option value="bleed">Bleed (edge to edge)</option>
              <option value="inset">Inset (bordered)</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="font-medium text-bark">Slideshow speed</span>
            <select
              className="input mt-1 w-full max-w-xs"
              value={String(settings.hero_slide_interval_ms ?? 14000)}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  hero_slide_interval_ms: Number(e.target.value),
                })
              }
            >
              <option value="5000">5 seconds</option>
              <option value="8000">8 seconds</option>
              <option value="10000">10 seconds</option>
              <option value="14000">14 seconds (default)</option>
              <option value="20000">20 seconds</option>
              <option value="30000">30 seconds</option>
            </select>
            <span className="mt-1 block text-xs text-stone">
              How long each hero photo stays before fading to the next.
            </span>
          </label>
        </div>
        <button
          type="button"
          className="btn btn-primary mt-4 text-sm"
          disabled={saving}
          onClick={() =>
            void save({
              hero_layout: settings.hero_layout,
              hero_frame: settings.hero_frame,
              hero_slide_interval_ms:
                settings.hero_slide_interval_ms ?? 14000,
            })
          }
        >
          Save hero layout
        </button>
      </section>
    </div>
  );
}
