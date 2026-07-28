import {
  announcement,
  availabilityPage,
  heroHome,
  homeAbout,
  homeCta,
  homeSections,
  nav,
  site,
} from "@/lib/content";
import { normalizeHeroCta } from "./hero-cta";
import type {
  HeroCta,
  ResolvedNavItem,
  ResolvedSiteCopy,
  SiteContentOverrides,
  SiteNavItemRow,
} from "./types";

function resolveHeroCtas(
  overrides: SiteContentOverrides["heroHome"],
  availabilityEnabled: boolean,
): HeroCta[] {
  const fromList =
    overrides?.ctas
      ?.map((c) => normalizeHeroCta(c))
      .filter((c): c is HeroCta => c !== null) ?? [];

  let ctas: HeroCta[];
  if (fromList.length > 0) {
    ctas = fromList;
  } else if (
    overrides?.primaryCtaLabel ||
    overrides?.primaryCtaHref ||
    overrides?.secondaryCtaLabel ||
    overrides?.secondaryCtaHref
  ) {
    const primary = normalizeHeroCta({
      label: overrides.primaryCtaLabel ?? heroHome.primaryCta.label,
      href: overrides.primaryCtaHref ?? heroHome.primaryCta.href,
      style: "solid",
    });
    const secondary = normalizeHeroCta({
      label: overrides.secondaryCtaLabel ?? heroHome.secondaryCta?.label,
      href: overrides.secondaryCtaHref ?? heroHome.secondaryCta?.href,
      style: "solid",
    });
    ctas = [primary, secondary].filter((c): c is HeroCta => c !== null);
  } else {
    ctas = heroHome.ctas.map((c) => normalizeHeroCta(c)!);
  }

  if (!availabilityEnabled) {
    ctas = ctas.filter((c) => c.href !== "/available-now");
  }

  return ctas;
}

export function mergeSiteCopy(
  overrides: SiteContentOverrides = {},
): ResolvedSiteCopy {
  const availabilityEnabled =
    overrides.availabilityPage?.enabled ?? availabilityPage.enabled;
  const ctas = resolveHeroCtas(overrides.heroHome, availabilityEnabled);

  return {
    site: {
      tagline: overrides.site?.tagline ?? site.tagline,
      description: overrides.site?.description ?? site.description,
    },
    heroHome: {
      title: overrides.heroHome?.title ?? heroHome.title,
      subtitle: overrides.heroHome?.subtitle ?? heroHome.subtitle,
      ctas,
      primaryCta: ctas[0] ?? { label: "Send flowers", href: "/order" },
      secondaryCta: ctas[1],
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
    availabilityPage: {
      enabled: availabilityEnabled,
    },
  };
}

export function mergeNavItems(
  rows: SiteNavItemRow[],
  options?: { availabilityPageEnabled?: boolean },
): ResolvedNavItem[] {
  const availabilityPageEnabled = options?.availabilityPageEnabled ?? true;

  const visible = rows
    .filter((r) => r.is_visible)
    .filter((r) => availabilityPageEnabled || r.href !== "/available-now")
    .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));

  if (visible.length) {
    return visible.map((r) => ({
      label: r.label,
      href: r.href,
      ...(r.href === "/send-flowers" ? { cta: true as const } : {}),
    }));
  }

  return nav
    .filter((item) => availabilityPageEnabled || item.href !== "/available-now")
    .map((item) => ({
      label: item.label,
      href: item.href,
      ...("cta" in item && item.cta ? { cta: true } : {}),
    }));
}
