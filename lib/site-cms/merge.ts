import {
  announcement,
  heroHome,
  homeAbout,
  homeCta,
  homeSections,
  nav,
  site,
} from "@/lib/content";
import type {
  ResolvedNavItem,
  ResolvedSiteCopy,
  SiteContentOverrides,
  SiteNavItemRow,
} from "./types";

export function mergeSiteCopy(
  overrides: SiteContentOverrides = {},
): ResolvedSiteCopy {
  return {
    site: {
      tagline: overrides.site?.tagline ?? site.tagline,
      description: overrides.site?.description ?? site.description,
    },
    heroHome: {
      title: overrides.heroHome?.title ?? heroHome.title,
      subtitle: overrides.heroHome?.subtitle ?? heroHome.subtitle,
      primaryCta: {
        label:
          overrides.heroHome?.primaryCtaLabel ?? heroHome.primaryCta.label,
        href: overrides.heroHome?.primaryCtaHref ?? heroHome.primaryCta.href,
      },
      secondaryCta:
        overrides.heroHome?.secondaryCtaLabel || overrides.heroHome?.secondaryCtaHref
          ? {
              label:
                overrides.heroHome?.secondaryCtaLabel ??
                heroHome.secondaryCta?.label ??
                "",
              href:
                overrides.heroHome?.secondaryCtaHref ??
                heroHome.secondaryCta?.href ??
                "",
            }
          : heroHome.secondaryCta,
    },
    homeAbout: overrides.homeAbout?.length
      ? overrides.homeAbout
      : [...homeAbout],
    homeSections: {
      availability: {
        title:
          overrides.homeSections?.availability?.title ??
          homeSections.availability.title,
        description:
          overrides.homeSections?.availability?.description ??
          homeSections.availability.description,
      },
    },
    homeCta: {
      note: overrides.homeCta?.note ?? homeCta.note,
      rooted: overrides.homeCta?.rooted ?? homeCta.rooted,
      contact: overrides.homeCta?.contact ?? homeCta.contact,
    },
    announcement: {
      enabled: overrides.announcement?.enabled ?? announcement.enabled,
      message: overrides.announcement?.message ?? announcement.message,
    },
  };
}

export function mergeNavItems(rows: SiteNavItemRow[]): ResolvedNavItem[] {
  const visible = rows
    .filter((r) => r.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));

  if (visible.length) {
    return visible.map((r) => ({
      label: r.label,
      href: r.href,
      ...(r.href === "/send-flowers" ? { cta: true as const } : {}),
    }));
  }

  return nav.map((item) => ({
    label: item.label,
    href: item.href,
    ...("cta" in item && item.cta ? { cta: true } : {}),
  }));
}
