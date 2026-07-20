/**
 * Read approximate visitor location from Vercel IP geo headers.
 * Empty locally / off-Vercel — fail-open (callers treat missing as null).
 *
 * @see https://vercel.com/docs/headers/request-headers#x-vercel-ip-city
 */
export function geoFromRequest(request: Request): {
  geoCity: string | null;
  geoRegion: string | null;
  geoCountry: string | null;
  geoTimezone: string | null;
  geoLatitude: string | null;
  geoLongitude: string | null;
} {
  return {
    geoCity: decodeHeader(request.headers.get("x-vercel-ip-city")),
    geoRegion: decodeHeader(request.headers.get("x-vercel-ip-country-region")),
    geoCountry: decodeHeader(request.headers.get("x-vercel-ip-country")),
    geoTimezone: decodeHeader(request.headers.get("x-vercel-ip-timezone")),
    geoLatitude: decodeHeader(request.headers.get("x-vercel-ip-latitude")),
    geoLongitude: decodeHeader(request.headers.get("x-vercel-ip-longitude")),
  };
}

function decodeHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value).trim();
    return decoded || null;
  } catch {
    const trimmed = value.trim();
    return trimmed || null;
  }
}

export function formatVisitGeo(event: {
  geo_city?: string | null;
  geo_region?: string | null;
  geo_country?: string | null;
}): string {
  const parts = [event.geo_city, event.geo_region, event.geo_country].filter(
    (p): p is string => Boolean(p?.trim()),
  );
  return parts.length ? parts.join(", ") : "—";
}
