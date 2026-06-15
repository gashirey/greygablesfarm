import type { SiteMediaSlotKey } from "./slots";

export const MEDIA_DISPLAY_RATIOS = [
  "natural",
  "16:9",
  "2:1",
  "16:10",
  "5:4",
  "4:5",
  "3:4",
  "1:1",
] as const;

export type MediaDisplayRatio = (typeof MEDIA_DISPLAY_RATIOS)[number];

export const MEDIA_DISPLAY_RATIO_LABELS: Record<MediaDisplayRatio, string> = {
  natural: "Full image (natural height)",
  "16:9": "Wide banner — 16:9",
  "2:1": "Wide banner — 2:1",
  "16:10": "Hero — 16:10",
  "5:4": "Landscape — 5:4",
  "4:5": "Portrait — 4:5",
  "3:4": "Portrait — 3:4",
  "1:1": "Square — 1:1",
};

export const DEFAULT_SLOT_DISPLAY_RATIOS: Record<
  SiteMediaSlotKey,
  MediaDisplayRatio
> = {
  hero: "16:10",
  home_feature: "16:10",
  about: "natural",
  contact: "16:9",
};

export function isMediaDisplayRatio(value: string): value is MediaDisplayRatio {
  return (MEDIA_DISPLAY_RATIOS as readonly string[]).includes(value);
}

export function resolveDisplayRatio(
  value: string | null | undefined,
  slotKey: SiteMediaSlotKey,
): MediaDisplayRatio {
  if (value && isMediaDisplayRatio(value)) return value;
  return DEFAULT_SLOT_DISPLAY_RATIOS[slotKey];
}

export function aspectClassForRatio(ratio: MediaDisplayRatio): string | null {
  if (ratio === "natural") return null;
  const map: Record<Exclude<MediaDisplayRatio, "natural">, string> = {
    "16:9": "aspect-[16/9]",
    "2:1": "aspect-[2/1]",
    "16:10": "aspect-[16/10]",
    "5:4": "aspect-[5/4]",
    "4:5": "aspect-[4/5]",
    "3:4": "aspect-[3/4]",
    "1:1": "aspect-square",
  };
  return map[ratio];
}
