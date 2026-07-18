import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { nav } from "@/lib/content";
import {
  DEFAULT_HERO_SLIDE_INTERVAL_MS,
  DEFAULT_SITE_SETTINGS,
} from "./defaults";
import { mergeNavItems, mergeSiteCopy } from "./merge";
import { buildResolvedTypography } from "./typography";
import { buildSiteThemeStyle } from "./theme";
import type {
  PublicSiteConfig,
  ResolvedSiteTheme,
  SiteColorOverrides,
  SiteContentOverrides,
  SiteNavItemRow,
  SiteSettingsRow,
  TypographyOverrides,
} from "./types";

function parseHeroSlideIntervalMs(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_HERO_SLIDE_INTERVAL_MS;
  return Math.min(60_000, Math.max(3_000, Math.round(n)));
}

function parseSettingsRow(raw: Record<string, unknown>): SiteSettingsRow {
  return {
    id: String(raw.id ?? "default"),
    direction_id: (raw.direction_id as SiteSettingsRow["direction_id"]) ?? "b",
    hero_layout:
      (raw.hero_layout as SiteSettingsRow["hero_layout"]) ?? "immersive",
    hero_frame: (raw.hero_frame as SiteSettingsRow["hero_frame"]) ?? "bleed",
    hero_slide_interval_ms: parseHeroSlideIntervalMs(
      raw.hero_slide_interval_ms,
    ),
    color_overrides: (raw.color_overrides as SiteColorOverrides) ?? {},
    content_overrides: (raw.content_overrides as SiteContentOverrides) ?? {},
    typography_overrides:
      (raw.typography_overrides as TypographyOverrides) ?? {},
    updated_at: String(raw.updated_at ?? new Date().toISOString()),
  };
}

export type SiteSettingsLoad = {
  settings: SiteSettingsRow;
  /** False until migration 022_hero_slide_interval.sql has been applied. */
  hasHeroSlideIntervalColumn: boolean;
};

export async function getSiteSettingsLoad(): Promise<SiteSettingsLoad> {
  if (!isSupabaseConfigured()) {
    return {
      settings: DEFAULT_SITE_SETTINGS,
      hasHeroSlideIntervalColumn: true,
    };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    console.error("[getSiteSettingsRow]", error);
    return {
      settings: DEFAULT_SITE_SETTINGS,
      hasHeroSlideIntervalColumn: false,
    };
  }

  if (!data) {
    return {
      settings: DEFAULT_SITE_SETTINGS,
      hasHeroSlideIntervalColumn: false,
    };
  }

  const raw = data as Record<string, unknown>;
  return {
    settings: parseSettingsRow(raw),
    hasHeroSlideIntervalColumn: Object.prototype.hasOwnProperty.call(
      raw,
      "hero_slide_interval_ms",
    ),
  };
}

export async function getSiteSettingsRow(): Promise<SiteSettingsRow> {
  const { settings } = await getSiteSettingsLoad();
  return settings;
}

export async function getSiteNavItemsRaw(): Promise<SiteNavItemRow[]> {
  if (!isSupabaseConfigured()) {
    return nav.map((item, i) => ({
      id: `fallback-${i}`,
      label: item.label,
      href: item.href,
      sort_order: (i + 1) * 10,
      is_visible: true,
      created_at: new Date().toISOString(),
    }));
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("site_nav_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getSiteNavItemsRaw]", error);
    return [];
  }

  return (data ?? []) as SiteNavItemRow[];
}

export async function getPublicSiteConfig(): Promise<PublicSiteConfig> {
  const settings = await getSiteSettingsRow();
  const navRows = await getSiteNavItemsRaw();

  const copy = mergeSiteCopy(settings.content_overrides);

  return {
    theme: {
      directionId: settings.direction_id,
      heroLayout: settings.hero_layout,
      heroFrame: settings.hero_frame,
      heroSlideIntervalMs: settings.hero_slide_interval_ms,
    },
    copy,
    nav: mergeNavItems(navRows, {
      availabilityPageEnabled: copy.availabilityPage.enabled,
    }),
  };
}

export async function getResolvedSiteTheme(): Promise<{
  theme: ResolvedSiteTheme;
  themeStyle: ReturnType<typeof buildSiteThemeStyle>;
  googleFontsUrl: string | null;
}> {
  const settings = await getSiteSettingsRow();
  const colorStyle = buildSiteThemeStyle(
    settings.direction_id,
    settings.color_overrides,
  );
  const { cssVars: typographyVars, googleFontsUrl } =
    buildResolvedTypography(settings);

  return {
    theme: {
      directionId: settings.direction_id,
      heroLayout: settings.hero_layout,
      heroFrame: settings.hero_frame,
      heroSlideIntervalMs: settings.hero_slide_interval_ms,
    },
    themeStyle: { ...colorStyle, ...typographyVars },
    googleFontsUrl,
  };
}
