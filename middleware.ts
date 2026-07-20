import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/admin/auth";
import { isCampaignPathSegment } from "@/lib/campaigns/slug";
import { geoFromRequest } from "@/lib/tracking/geo";
import {
  CAMPAIGN_COOKIE,
  shouldLogOutsideVisitor,
  VISITOR_COOKIE,
} from "@/lib/tracking/visit";

async function hasAdminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

function ensureVisitorId(request: NextRequest, response: NextResponse): string {
  const existing = request.cookies.get(VISITOR_COOKIE)?.value?.trim();
  if (existing && existing.length >= 8 && existing.length <= 80) {
    return existing;
  }
  const visitorId = crypto.randomUUID();
  response.cookies.set(VISITOR_COOKIE, visitorId, {
    maxAge: 60 * 60 * 24 * 400,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return visitorId;
}

function shouldEnqueueVisitTracking(
  request: NextRequest,
  userAgent: string | null,
): boolean {
  const { pathname, search } = request.nextUrl;
  if (isCampaignPathSegment(pathname)) return false;
  return shouldLogOutsideVisitor({
    pathname,
    search,
    referrer: request.headers.get("referer"),
    userAgent,
    host: request.nextUrl.host,
  });
}

function trackVisit(request: NextRequest, visitorId: string) {
  const { pathname, search } = request.nextUrl;
  const trackUrl = new URL("/api/track", request.url);
  const secret = process.env.TRACKING_SECRET;
  const geo = geoFromRequest(request);
  const attributed = request.cookies.get(CAMPAIGN_COOKIE)?.value?.trim() || null;

  void fetch(trackUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "x-tracking-secret": secret } : {}),
    },
    body: JSON.stringify({
      pathname,
      search,
      referrer: request.headers.get("referer"),
      userAgent: request.headers.get("user-agent"),
      acceptLanguage: request.headers.get("accept-language"),
      geoCity: geo.geoCity,
      geoRegion: geo.geoRegion,
      geoCountry: geo.geoCountry,
      geoTimezone: geo.geoTimezone,
      geoLatitude: geo.geoLatitude,
      geoLongitude: geo.geoLongitude,
      visitorId,
      attributedCampaignSlug: attributed,
      requestHost: request.nextUrl.host,
    }),
  }).catch(() => {});
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminSession = await hasAdminSession(request);
  const userAgent = request.headers.get("user-agent");
  const response = NextResponse.next();
  const visitorId = ensureVisitorId(request, response);

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!adminSession) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  if (shouldEnqueueVisitTracking(request, userAgent)) {
    trackVisit(request, visitorId);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
