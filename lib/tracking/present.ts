import type { SiteVisitEvent } from "@/lib/campaigns/types";

const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/found": "Found (QR landing)",
  "/gallery": "Gallery",
  "/flowers": "Flowers",
  "/send-flowers": "Send flowers",
  "/available-now": "Availability",
  "/photos-in-the-blooms": "Photos in the Blooms",
  "/contact": "Contact",
  "/about": "About",
  "/events": "Events",
  "/weddings": "Weddings",
  "/visit": "Visit",
  "/shop": "Shop",
};

/** Human page name for owners. */
export function pageLabel(pathname: string): string {
  const path = pathname.trim() || "/";
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith("/events/")) return "Event detail";
  if (path.startsWith("/found")) return "Found (QR landing)";
  // Short campaign slug paths like /al, /bc
  if (/^\/[a-z0-9][a-z0-9_-]{0,31}$/i.test(path) && path.length <= 12) {
    return `QR / short link (${path})`;
  }
  const cleaned = path.replace(/^\//, "").replace(/-/g, " ");
  if (!cleaned) return "Home";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function hostFromReferrer(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function pathFromReferrer(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).pathname;
  } catch {
    return null;
  }
}

function prettyHost(host: string): string {
  const h = host.toLowerCase();
  if (h.includes("instagram")) return "Instagram";
  if (h.includes("facebook") || h === "fb.com" || h === "m.facebook.com") {
    return "Facebook";
  }
  if (h.includes("google.")) return "Google";
  if (h.includes("bing.")) return "Bing";
  if (h.includes("duckduckgo")) return "DuckDuckGo";
  if (h.includes("yahoo.")) return "Yahoo";
  if (h.includes("tiktok")) return "TikTok";
  if (h.includes("pinterest")) return "Pinterest";
  if (h.includes("linkedin")) return "LinkedIn";
  if (h.includes("twitter") || h === "t.co" || h.includes("x.com")) {
    return "X (Twitter)";
  }
  if (h.includes("youtube") || h === "youtu.be") return "YouTube";
  if (h.includes("threads.net")) return "Threads";
  return host;
}

/**
 * Plain-language “where they came from” for business owners.
 * Avoids the word “referrer”.
 */
export function sourceLabel(visit: SiteVisitEvent): string {
  if (visit.visit_type === "campaign" && visit.slug) {
    return `Scanned a QR or short link (/${visit.slug})`;
  }

  const utm = visit.utm_source?.trim().toLowerCase();
  if (utm) {
    const pretty = prettyHost(utm);
    const medium = visit.utm_medium?.trim();
    if (medium) return `Link tagged as ${pretty} (${medium})`;
    return `Link tagged as ${pretty}`;
  }

  const refPath = pathFromReferrer(visit.referrer);
  if (refPath === "/found" || refPath?.startsWith("/found/")) {
    return "Came from the Found page";
  }

  const host = hostFromReferrer(visit.referrer);
  if (!host) {
    return "Typed the address, used a bookmark, or source unknown";
  }

  // Same-site navigation
  const requestHost = visit.request_host?.replace(/^www\./, "").toLowerCase();
  if (
    requestHost &&
    (host === requestHost || host.endsWith(`.${requestHost}`))
  ) {
    if (refPath && refPath !== "/") return `Browsing from ${pageLabel(refPath)}`;
    return "Browsing another page on your site";
  }

  return `Came from ${prettyHost(host)}`;
}

export function deviceLabel(visit: SiteVisitEvent): string {
  switch (visit.device_type) {
    case "mobile":
      return "Phone";
    case "tablet":
      return "Tablet";
    case "desktop":
      return "Computer";
    default:
      return "Device unknown";
  }
}

export function locationLabel(visit: SiteVisitEvent): string {
  const city = visit.geo_city?.trim();
  const region = visit.geo_region?.trim();
  const country = visit.geo_country?.trim();
  if (city && region) return `${city}, ${region}`;
  if (city) return city;
  if (region && country) return `${region}, ${country}`;
  if (region) return region;
  if (country) return country;
  return "Location unknown";
}

export function formatWhenFriendly(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function primaryLanguage(acceptLanguage: string | null | undefined): string | null {
  if (!acceptLanguage?.trim()) return null;
  const first = acceptLanguage.split(",")[0]?.trim().split(";")[0]?.trim();
  return first || null;
}
