import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SiteVisitEvent } from "@/lib/campaigns/types";

export type VisitLogInput = {
  campaignId?: string | null;
  slug?: string | null;
  pathname: string;
  searchParams?: Record<string, string> | null;
  referrer?: string | null;
  userAgent?: string | null;
  visitType: SiteVisitEvent["visit_type"];
  geoCity?: string | null;
  geoRegion?: string | null;
  geoCountry?: string | null;
};

export function searchParamsFromUrl(search: string): Record<string, string> | null {
  if (!search || search === "?") return null;
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const out: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** True when the browser came from the farm admin UI. */
export function isAdminOriginReferrer(referrer: string | null | undefined): boolean {
  if (!referrer) return false;
  try {
    const path = new URL(referrer).pathname;
    return path === "/admin" || path.startsWith("/admin/");
  } catch {
    return /\/admin(\/|$)/i.test(referrer);
  }
}

export function shouldTrackPublicVisit(pathname: string, _search: string): boolean {
  if (pathname.startsWith("/api")) return false;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/_next")) return false;
  return true;
}

/**
 * Outside-visitor gate: skip only traffic that navigated from the admin UI.
 * Being signed into admin in the same browser must not suppress public visits
 * (otherwise phone/computer tests while logged in never appear).
 */
export function shouldLogOutsideVisitor(input: {
  pathname: string;
  search: string;
  referrer?: string | null;
}): boolean {
  if (isAdminOriginReferrer(input.referrer)) return false;
  return shouldTrackPublicVisit(input.pathname, input.search);
}

export function isOutsideVisitorEvent(event: {
  referrer?: string | null;
  pathname?: string;
}): boolean {
  if (event.pathname?.startsWith("/admin")) return false;
  return !isAdminOriginReferrer(event.referrer);
}

export async function logSiteVisit(input: VisitLogInput): Promise<void> {
  if (!isSupabaseConfigured()) return;
  if (isAdminOriginReferrer(input.referrer)) return;

  const base = {
    campaign_id: input.campaignId ?? null,
    slug: input.slug ?? null,
    pathname: input.pathname,
    search_params: input.searchParams ?? null,
    referrer: input.referrer ?? null,
    user_agent: input.userAgent ?? null,
    visit_type: input.visitType,
  };

  const withGeo = {
    ...base,
    geo_city: input.geoCity ?? null,
    geo_region: input.geoRegion ?? null,
    geo_country: input.geoCountry ?? null,
  };

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("site_visit_events").insert(withGeo);

    // Fail-open: if migration 023 is not applied yet, still log the visit.
    if (
      error &&
      (error.code === "PGRST204" || /geo_(city|region|country)/i.test(error.message))
    ) {
      const retry = await supabase.from("site_visit_events").insert(base);
      if (retry.error) {
        console.error("[logSiteVisit]", retry.error);
      }
      return;
    }

    if (error) {
      console.error("[logSiteVisit]", error);
    }
  } catch (err) {
    console.error("[logSiteVisit]", err);
  }
}
