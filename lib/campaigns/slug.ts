/** Static routes and prefixes — never handled as campaign slugs */
export const RESERVED_CAMPAIGN_SLUGS = new Set([
  "about",
  "admin",
  "api",
  "artful-lodger",
  "available-now",
  "contact",
  "design-lab",
  "events",
  "flowers",
  "found",
  "gallery",
  "photos-in-the-blooms",
  "send-flowers",
  "weddings",
]);

const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export function normalizeCampaignSlug(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function isCampaignSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

export function isReservedCampaignSlug(slug: string): boolean {
  return RESERVED_CAMPAIGN_SLUGS.has(slug);
}

export function isCampaignPathSegment(pathname: string): boolean {
  const match = pathname.match(/^\/([^/]+)\/?$/);
  if (!match) return false;
  const slug = match[1];
  if (!isCampaignSlug(slug)) return false;
  return !isReservedCampaignSlug(slug);
}

export function campaignSlugFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/([^/]+)\/?$/);
  if (!match) return null;
  const slug = match[1];
  if (!isCampaignSlug(slug) || isReservedCampaignSlug(slug)) return null;
  return slug;
}
