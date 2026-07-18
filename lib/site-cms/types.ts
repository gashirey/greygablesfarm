import type { DesignDirectionId } from "@/lib/design-lab/directions";
import type { HeroFrame } from "@/lib/content";
import type { HeroLayout } from "@/lib/snapshots/types";

export type SiteColorOverrides = Partial<{
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentHover: string;
  green: string;
  greenMuted: string;
  border: string;
  scrim: string;
  chip: string;
  chipText: string;
}>;

export type SiteContentOverrides = {
  site?: {
    tagline?: string;
    description?: string;
  };
  heroHome?: {
    title?: string;
    subtitle?: string;
    primaryCtaLabel?: string;
    primaryCtaHref?: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
  };
  homeAbout?: string[];
  homeSections?: {
    availability?: {
      title?: string;
      description?: string;
    };
  };
  homeCta?: {
    note?: string;
    rooted?: string;
    contact?: string;
  };
  announcement?: {
    enabled?: boolean;
    message?: string;
  };
  availabilityPage?: {
    enabled?: boolean;
  };
};

export type TypographySectionId =
  | "hero_title"
  | "hero_subtitle"
  | "nav"
  | "body"
  | "section_title"
  | "section_description"
  | "page_title"
  | "page_body"
  | "footer_brand"
  | "footer_text"
  | "footer_link"
  | "announcement"
  | "button"
  | "eyebrow";

export type TypographySectionOverride = {
  fontId?: string;
  fontSize?: string;
  color?: string;
  fontWeight?: string;
};

export type TypographyOverrides = Partial<
  Record<TypographySectionId, TypographySectionOverride>
>;

export type TypographySectionResolved = {
  id: TypographySectionId;
  fontId: string;
  fontFamily: string;
  fontSize: string;
  color: string;
  fontWeight: string;
};

export type SiteSettingsRow = {
  id: string;
  direction_id: DesignDirectionId;
  hero_layout: HeroLayout;
  hero_frame: HeroFrame;
  /** Homepage hero slideshow dwell time (ms) */
  hero_slide_interval_ms: number;
  color_overrides: SiteColorOverrides;
  content_overrides: SiteContentOverrides;
  typography_overrides: TypographyOverrides;
  updated_at: string;
};

export type SiteNavItemRow = {
  id: string;
  label: string;
  href: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
};

export type ResolvedNavItem = {
  label: string;
  href: string;
  /** Primary nav CTA (e.g. Send Flowers) */
  cta?: boolean;
};

export type ResolvedSiteCopy = {
  site: {
    tagline: string;
    description: string;
  };
  heroHome: {
    title: string;
    subtitle: string;
    primaryCta: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
  };
  homeAbout: string[];
  homeSections: {
    availability: { title: string; description: string };
  };
  homeCta: {
    note: string;
    rooted: string;
    contact: string;
  };
  announcement: {
    enabled: boolean;
    message: string;
  };
  availabilityPage: {
    enabled: boolean;
  };
};

export type ResolvedSiteTheme = {
  directionId: DesignDirectionId;
  heroLayout: HeroLayout;
  heroFrame: HeroFrame;
  heroSlideIntervalMs: number;
};

export type PublicSiteConfig = {
  theme: ResolvedSiteTheme;
  copy: ResolvedSiteCopy;
  nav: ResolvedNavItem[];
};
