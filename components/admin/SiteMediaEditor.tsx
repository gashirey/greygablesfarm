"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { FocalPointControl } from "@/components/admin/FocalPointControl";
import { compressImageBeforeUpload } from "@/lib/admin/client-compress-image";
import { readAdminUploadError } from "@/lib/admin/upload-response";
import { clampFocal } from "@/lib/site-cms/focal";
import {
  SITE_MEDIA_SLOT_LABELS,
  SITE_MEDIA_SLOTS,
  type SiteMediaSlot,
  type SiteMediaSlotKey,
} from "@/lib/site-media/slots";

type HeroSlideRow = {
  id: string;
  image_url: string;
  alt_text: string | null;
  focal_x?: number;
  focal_y?: number;
};

const SLOT_ASPECT: Partial<Record<SiteMediaSlotKey, string>> = {
  hero: "aspect-[16/10]",
  home_feature: "aspect-[16/10] sm:aspect-[5/4]",
  about: "aspect-[4/5]",
  contact: "aspect-[4/5]",
};

function isRemoteSrc(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function SiteMediaEditor() {
  const [slots, setSlots] = useState<SiteMediaSlot[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlideRow[]>([]);
  const [focalDraft, setFocalDraft] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [uploading, setUploading] = useState<SiteMediaSlotKey | null>(null);
  const [savingFocal, setSavingFocal] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const [slotsRes, slidesRes] = await Promise.all([
      fetch("/api/admin/site-media"),
      fetch("/api/admin/hero-slides"),
    ]);
    const slotsData = await slotsRes.json();
    const slidesData = await slidesRes.json();
    const list = (slotsData.slots ?? []) as SiteMediaSlot[];
    const slides = slidesRes.ok
      ? ((slidesData.slides ?? []) as HeroSlideRow[])
      : [];
    setSlots(list);
    setHeroSlides(slides);

    const focal: Record<string, { x: number; y: number }> = {};
    for (const s of list) {
      focal[s.slot_key] = {
        x: clampFocal(s.focal_x),
        y: clampFocal(s.focal_y),
      };
    }
    for (const slide of slides) {
      focal[`slide-${slide.id}`] = {
        x: clampFocal(slide.focal_x),
        y: clampFocal(slide.focal_y),
      };
    }
    setFocalDraft(focal);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(slotKey: SiteMediaSlotKey, file: File) {
    setUploading(slotKey);
    setMessage("Optimizing…");

    let ready: File;
    try {
      ({ file: ready } = await compressImageBeforeUpload(file));
    } catch {
      setUploading(null);
      setMessage("Could not optimize image in browser.");
      return;
    }

    setMessage("Uploading…");
    const formData = new FormData();
    formData.append("file", ready);
    formData.append("slot_key", slotKey);
    const slot = slots.find((s) => s.slot_key === slotKey);
    if (slot?.alt_text) formData.append("alt_text", slot.alt_text);

    const res = await fetch("/api/admin/site-media/upload", {
      method: "POST",
      body: formData,
    });
    setUploading(null);

    if (!res.ok) {
      setMessage(await readAdminUploadError(res));
      return;
    }

    setMessage(`Updated ${SITE_MEDIA_SLOT_LABELS[slotKey]}.`);
    await load();
  }

  async function saveAlt(slotKey: SiteMediaSlotKey, alt_text: string) {
    const slot = slots.find((s) => s.slot_key === slotKey);
    if (!slot) return;

    await fetch("/api/admin/site-media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_key: slotKey,
        image_url: slot.image_url,
        alt_text,
      }),
    });
    await load();
  }

  async function saveSlotFocal(slotKey: SiteMediaSlotKey) {
    const slot = slots.find((s) => s.slot_key === slotKey);
    const focal = focalDraft[slotKey];
    if (!slot || !focal) return;

    setSavingFocal(slotKey);
    const res = await fetch("/api/admin/site-media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_key: slotKey,
        focal_x: focal.x,
        focal_y: focal.y,
      }),
    });
    setSavingFocal(null);
    if (!res.ok) {
      setMessage("Could not save framing.");
      return;
    }
    setMessage(`Saved framing for ${SITE_MEDIA_SLOT_LABELS[slotKey]}.`);
    await load();
  }

  async function saveSlideFocal(slideId: string) {
    const key = `slide-${slideId}`;
    const focal = focalDraft[key];
    if (!focal) return;

    setSavingFocal(key);
    const res = await fetch(`/api/admin/hero-slides/${slideId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ focal_x: focal.x, focal_y: focal.y }),
    });
    setSavingFocal(null);
    if (!res.ok) {
      setMessage("Could not save slideshow framing.");
      return;
    }
    setMessage("Saved hero slideshow framing.");
    await load();
  }

  const byKey = new Map(slots.map((s) => [s.slot_key, s]));

  return (
    <div className="space-y-10">
      {message && <p className="text-sm text-bark">{message}</p>}

      <p className="text-sm text-stone max-w-xl">
        Upload replacements here, then adjust framing so crops look right in each
        layout. Hero slideshow images are assigned from the{" "}
        <a href="/admin/media" className="underline hover:text-bark">
          media library
        </a>
        .
      </p>

      {SITE_MEDIA_SLOTS.map((slotKey) => {
        const slot = byKey.get(slotKey);
        const imageUrl = slot?.image_url ?? "";
        const alt = slot?.alt_text ?? "";
        const focal = focalDraft[slotKey] ?? { x: 50, y: 50 };

        return (
          <section
            key={slotKey}
            className="border border-parchment bg-white p-5"
          >
            <h2 className="font-serif text-lg text-bark">
              {SITE_MEDIA_SLOT_LABELS[slotKey]}
            </h2>
            <p className="mt-1 text-xs text-stone">Slot: {slotKey}</p>

            <label className="mt-4 block text-sm">
              <span className="font-medium text-bark">Replace image</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading === slotKey}
                className="mt-2 block w-full text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onUpload(slotKey, file);
                  e.target.value = "";
                }}
              />
            </label>

            <label className="mt-4 block text-sm">
              Alt text
              <input
                type="text"
                defaultValue={alt}
                key={`${slotKey}-${alt}`}
                className="input mt-1 w-full max-w-lg"
                onBlur={(e) => {
                  if (e.target.value !== alt) {
                    void saveAlt(slotKey, e.target.value);
                  }
                }}
              />
            </label>

            {imageUrl ? (
              <FocalPointControl
                imageUrl={imageUrl}
                alt={alt}
                focalX={focal.x}
                focalY={focal.y}
                aspectClass={SLOT_ASPECT[slotKey] ?? "aspect-[16/10]"}
                saving={savingFocal === slotKey}
                onChange={(x, y) =>
                  setFocalDraft((prev) => ({
                    ...prev,
                    [slotKey]: { x, y },
                  }))
                }
                onSave={() => void saveSlotFocal(slotKey)}
              />
            ) : null}
          </section>
        );
      })}

      {heroSlides.length > 0 ? (
        <section className="border border-parchment bg-white p-5">
          <h2 className="font-serif text-lg text-bark">Hero slideshow framing</h2>
          <p className="mt-1 text-sm text-stone">
            Each carousel slide can have its own focal point (2+ slides for
            crossfade).
          </p>
          <ul className="mt-6 space-y-8">
            {heroSlides.map((slide, i) => {
              const key = `slide-${slide.id}`;
              const focal = focalDraft[key] ?? { x: 50, y: 50 };
              return (
                <li key={slide.id} className="border-t border-parchment pt-6 first:border-0 first:pt-0">
                  <p className="text-xs font-medium text-bark">Slide {i + 1}</p>
                  <FocalPointControl
                    imageUrl={slide.image_url}
                    alt={slide.alt_text ?? ""}
                    focalX={focal.x}
                    focalY={focal.y}
                    aspectClass="aspect-[16/10]"
                    saving={savingFocal === key}
                    onChange={(x, y) =>
                      setFocalDraft((prev) => ({
                        ...prev,
                        [key]: { x, y },
                      }))
                    }
                    onSave={() => void saveSlideFocal(slide.id)}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
