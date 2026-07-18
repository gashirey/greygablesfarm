import {
  activeDirectionId,
  activeHeroFrame,
  activeHeroLayout,
} from "@/lib/site-theme";
import type { SiteSettingsRow } from "./types";

/** Default homepage slideshow dwell (matches HeroSlider HOME_HERO_SLIDE_MS). */
export const DEFAULT_HERO_SLIDE_INTERVAL_MS = 14_000;

export const DEFAULT_SITE_SETTINGS: SiteSettingsRow = {
  id: "default",
  direction_id: activeDirectionId,
  hero_layout: activeHeroLayout,
  hero_frame: activeHeroFrame,
  hero_slide_interval_ms: DEFAULT_HERO_SLIDE_INTERVAL_MS,
  color_overrides: {},
  content_overrides: {},
  typography_overrides: {},
  updated_at: new Date().toISOString(),
};
