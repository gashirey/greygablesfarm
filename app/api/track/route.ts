import { NextResponse } from "next/server";
import { isCampaignPathSegment } from "@/lib/campaigns/slug";
import { geoFromRequest } from "@/lib/tracking/geo";
import {
  logSiteVisit,
  searchParamsFromUrl,
  shouldLogOutsideVisitor,
} from "@/lib/tracking/visit";

type TrackBody = {
  pathname?: string;
  search?: string;
  referrer?: string | null;
  userAgent?: string | null;
  acceptLanguage?: string | null;
  geoCity?: string | null;
  geoRegion?: string | null;
  geoCountry?: string | null;
  geoTimezone?: string | null;
  geoLatitude?: string | null;
  geoLongitude?: string | null;
  visitorId?: string | null;
  attributedCampaignSlug?: string | null;
  requestHost?: string | null;
};

function isAuthorized(request: Request): boolean {
  const secret = process.env.TRACKING_SECRET;
  if (!secret) return true;
  return request.headers.get("x-tracking-secret") === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: TrackBody;
  try {
    body = (await request.json()) as TrackBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const pathname = body.pathname?.trim() ?? "";
  const search = body.search ?? "";
  const referrer = body.referrer ?? null;
  const userAgent = body.userAgent ?? null;
  const host = body.requestHost ?? new URL(request.url).host;

  if (
    !pathname ||
    !shouldLogOutsideVisitor({
      pathname,
      search,
      referrer,
      userAgent,
      host,
    })
  ) {
    return new NextResponse(null, { status: 204 });
  }

  if (isCampaignPathSegment(pathname)) {
    return new NextResponse(null, { status: 204 });
  }

  const searchParams = searchParamsFromUrl(search);
  const visitType =
    searchParams && Object.keys(searchParams).length > 0 ? "query" : "path";

  const headerGeo = geoFromRequest(request);

  await logSiteVisit({
    pathname,
    searchParams,
    referrer,
    userAgent,
    visitType,
    geoCity: body.geoCity ?? headerGeo.geoCity,
    geoRegion: body.geoRegion ?? headerGeo.geoRegion,
    geoCountry: body.geoCountry ?? headerGeo.geoCountry,
    geoTimezone: body.geoTimezone ?? headerGeo.geoTimezone,
    geoLatitude: body.geoLatitude ?? headerGeo.geoLatitude,
    geoLongitude: body.geoLongitude ?? headerGeo.geoLongitude,
    visitorId: body.visitorId ?? null,
    acceptLanguage: body.acceptLanguage ?? request.headers.get("accept-language"),
    attributedCampaignSlug: body.attributedCampaignSlug ?? null,
    requestHost: host,
  });

  return new NextResponse(null, { status: 204 });
}
