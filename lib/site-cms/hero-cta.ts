import type { HeroCta, HeroCtaStyle } from "./types";

export const HERO_CTA_ACCENT = "#e0b5aa";

export const HERO_CTA_COLOR_PRESETS = [
  { id: "accent", label: "Accent", value: HERO_CTA_ACCENT },
  { id: "white", label: "White", value: "#ffffff" },
  { id: "bark", label: "Bark", value: "#3a3834" },
] as const;

function parseHex(color: string): { r: number; g: number; b: number } | null {
  const raw = color.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(raw);
  if (short) {
    const [r, g, b] = short[1].split("").map((c) => parseInt(c + c, 16));
    return { r, g, b };
  }
  const full = /^#([0-9a-f]{6})$/i.exec(raw);
  if (full) {
    return {
      r: parseInt(full[1].slice(0, 2), 16),
      g: parseInt(full[1].slice(2, 4), 16),
      b: parseInt(full[1].slice(4, 6), 16),
    };
  }
  return null;
}

/** Pick readable text on a solid fill. */
export function contrastOn(color: string): string {
  const rgb = parseHex(color);
  if (!rgb) return "#ffffff";
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.62 ? "#3a3834" : "#ffffff";
}

export function resolveHeroCtaColor(color?: string): string {
  const trimmed = color?.trim() ?? "";
  if (trimmed && parseHex(trimmed)) return trimmed;
  return HERO_CTA_ACCENT;
}

export function resolveHeroCtaStyle(style?: HeroCtaStyle): HeroCtaStyle {
  return style === "outline" ? "outline" : "solid";
}

export function heroCtaCssVars(cta: Pick<HeroCta, "style" | "color">): {
  className: string;
  style: Record<string, string>;
} {
  const appearance = resolveHeroCtaStyle(cta.style);
  const tone = resolveHeroCtaColor(cta.color);

  if (appearance === "outline") {
    return {
      className: "btn type-button hero-cta hero-cta--outline",
      style: {
        "--hero-cta-bg": "transparent",
        "--hero-cta-border": tone,
        "--hero-cta-text": tone,
        "--hero-cta-hover-bg": "rgba(255,255,255,0.12)",
      },
    };
  }

  return {
    className: "btn type-button hero-cta hero-cta--solid",
    style: {
      "--hero-cta-bg": tone,
      "--hero-cta-border": tone,
      "--hero-cta-text": contrastOn(tone),
      "--hero-cta-hover-bg": tone,
    },
  };
}

export function normalizeHeroCta(
  cta: Partial<HeroCta> | null | undefined,
): HeroCta | null {
  const label = cta?.label?.trim() ?? "";
  const href = cta?.href?.trim() ?? "";
  if (!label || !href) return null;

  const colorRaw = cta?.color?.trim() ?? "";
  const color =
    colorRaw && parseHex(colorRaw) ? colorRaw.toLowerCase() : undefined;

  return {
    label,
    href,
    style: resolveHeroCtaStyle(cta?.style),
    ...(color ? { color } : {}),
  };
}
