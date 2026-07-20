import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SiteVisitEvent } from "@/lib/campaigns/types";
import { isBotUserAgent, isNoisePathname } from "./bot";
import { parseUserAgent } from "./ua";
import { utmFromSearchParams } from "./utm";

export const VISITOR_COOKIE = "ggf_vid";
export const CAMPAIGN_COOKIE = "ggf_campaign";

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
  geoTimezone?: string | null;
  geoLatitude?: string | null;
  geoLongitude?: string | null;
  visitorId?: string | null;
  acceptLanguage?: string | null;
  attributedCampaignSlug?: string | null;
  requestHost?: string | null;
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

/** Local / private hosts — must not write into the shared production visit log. */
export function isLocalDevHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".localhost")
  );
}

export function isLocalDevReferrer(referrer: string | null | undefined): boolean {
  if (!referrer) return false;
  try {
    return isLocalDevHost(new URL(referrer).host);
  } catch {
    return /localhost|127\.0\.0\.1|\[::1\]/i.test(referrer);
  }
}

export function shouldTrackPublicVisit(pathname: string, _search: string): boolean {
  if (pathname.startsWith("/api")) return false;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (isNoisePathname(pathname)) return false;
  return true;
}

/**
 * Outside-visitor gate: skip admin-origin, bots, scanner noise, and local dev.
 * Being signed into admin in the same browser must not suppress public visits
 * (otherwise phone/computer tests while logged in never appear).
 */
export function shouldLogOutsideVisitor(input: {
  pathname: string;
  search: string;
  referrer?: string | null;
  userAgent?: string | null;
  host?: string | null;
}): boolean {
  if (isLocalDevHost(input.host)) return false;
  if (isLocalDevReferrer(input.referrer)) return false;
  if (isAdminOriginReferrer(input.referrer)) return false;
  if (isBotUserAgent(input.userAgent)) return false;
  return shouldTrackPublicVisit(input.pathname, input.search);
}

export function isOutsideVisitorEvent(event: {
  referrer?: string | null;
  pathname?: string;
  user_agent?: string | null;
  is_bot?: boolean | null;
}): boolean {
  if (event.pathname?.startsWith("/admin")) return false;
  if (event.is_bot) return false;
  if (isBotUserAgent(event.user_agent)) return false;
  if (event.pathname && isNoisePathname(event.pathname)) return false;
  if (isLocalDevReferrer(event.referrer)) return false;
  return !isAdminOriginReferrer(event.referrer);
}

const ENRICHMENT_COLUMN_RE =
  /geo_(city|region|country|timezone|latitude|longitude)|visitor_id|is_bot|accept_language|device_type|browser|os|utm_|attributed_campaign_slug|request_host/i;

export async function logSiteVisit(input: VisitLogInput): Promise<void> {
  if (!isSupabaseConfigured()) return;
  if (isLocalDevReferrer(input.referrer)) return;
  if (isAdminOriginReferrer(input.referrer)) return;
  if (isBotUserAgent(input.userAgent)) return;
  if (isNoisePathname(input.pathname)) return;

  const ua = parseUserAgent(input.userAgent);
  const utm = utmFromSearchParams(input.searchParams);

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

  const withVisitor = {
    ...withGeo,
    visitor_id: input.visitorId ?? null,
    is_bot: false,
  };

  const full = {
    ...withVisitor,
    geo_timezone: input.geoTimezone ?? null,
    geo_latitude: input.geoLatitude ?? null,
    geo_longitude: input.geoLongitude ?? null,
    accept_language: input.acceptLanguage?.slice(0, 160) ?? null,
    device_type: ua.deviceType,
    browser: ua.browser,
    os: ua.os,
    utm_source: utm.utmSource,
    utm_medium: utm.utmMedium,
    utm_campaign: utm.utmCampaign,
    utm_content: utm.utmContent,
    utm_term: utm.utmTerm,
    attributed_campaign_slug: input.attributedCampaignSlug ?? null,
    request_host: input.requestHost ?? null,
  };

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("site_visit_events").insert(full);

    if (error && (error.code === "PGRST204" || ENRICHMENT_COLUMN_RE.test(error.message))) {
      const retryVisitor = await supabase.from("site_visit_events").insert(withVisitor);
      if (
        retryVisitor.error &&
        (retryVisitor.error.code === "PGRST204" ||
          ENRICHMENT_COLUMN_RE.test(retryVisitor.error.message))
      ) {
        const retryGeo = await supabase.from("site_visit_events").insert(withGeo);
        if (
          retryGeo.error &&
          (retryGeo.error.code === "PGRST204" ||
            /geo_(city|region|country)/i.test(retryGeo.error.message))
        ) {
          const bare = await supabase.from("site_visit_events").insert(base);
          if (bare.error) console.error("[logSiteVisit]", bare.error);
          return;
        }
        if (retryGeo.error) console.error("[logSiteVisit]", retryGeo.error);
        return;
      }
      if (retryVisitor.error) console.error("[logSiteVisit]", retryVisitor.error);
      return;
    }

    if (error) {
      console.error("[logSiteVisit]", error);
    }
  } catch (err) {
    console.error("[logSiteVisit]", err);
  }
}
