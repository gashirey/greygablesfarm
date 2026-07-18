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
  geoCity?: string | null;
  geoRegion?: string | null;
  geoCountry?: string | null;
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

  if (
    !pathname ||
    !shouldLogOutsideVisitor({
      pathname,
      search,
      referrer,
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

  // Prefer geo forwarded from middleware (original visitor request).
  // Fall back to headers on this request (empty for internal middleware fetch).
  const headerGeo = geoFromRequest(request);
  const geoCity = body.geoCity ?? headerGeo.geoCity;
  const geoRegion = body.geoRegion ?? headerGeo.geoRegion;
  const geoCountry = body.geoCountry ?? headerGeo.geoCountry;

  await logSiteVisit({
    pathname,
    searchParams,
    referrer,
    userAgent: body.userAgent ?? null,
    visitType,
    geoCity,
    geoRegion,
    geoCountry,
  });

  return new NextResponse(null, { status: 204 });
}
