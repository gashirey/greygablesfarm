import { NextResponse } from "next/server";
import { isCampaignPathSegment } from "@/lib/campaigns/slug";
import {
  logSiteVisit,
  searchParamsFromUrl,
  shouldTrackPublicVisit,
} from "@/lib/tracking/visit";

type TrackBody = {
  pathname?: string;
  search?: string;
  referrer?: string | null;
  userAgent?: string | null;
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

  if (!pathname || !shouldTrackPublicVisit(pathname, search)) {
    return new NextResponse(null, { status: 204 });
  }

  if (isCampaignPathSegment(pathname)) {
    return new NextResponse(null, { status: 204 });
  }

  const searchParams = searchParamsFromUrl(search);
  const visitType =
    searchParams && Object.keys(searchParams).length > 0 ? "query" : "path";

  await logSiteVisit({
    pathname,
    searchParams,
    referrer: body.referrer ?? null,
    userAgent: body.userAgent ?? null,
    visitType,
  });

  return new NextResponse(null, { status: 204 });
}
