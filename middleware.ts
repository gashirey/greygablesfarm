import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/admin/auth";
import { isCampaignPathSegment } from "@/lib/campaigns/slug";
import { geoFromRequest } from "@/lib/tracking/geo";
import { shouldLogOutsideVisitor } from "@/lib/tracking/visit";

async function hasAdminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

function shouldEnqueueVisitTracking(
  request: NextRequest,
  adminSession: boolean,
): boolean {
  const { pathname, search } = request.nextUrl;
  if (isCampaignPathSegment(pathname)) return false;
  return shouldLogOutsideVisitor({
    pathname,
    search,
    referrer: request.headers.get("referer"),
    hasAdminSession: adminSession,
  });
}

function trackVisit(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const trackUrl = new URL("/api/track", request.url);
  const secret = process.env.TRACKING_SECRET;
  const geo = geoFromRequest(request);

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
      geoCity: geo.geoCity,
      geoRegion: geo.geoRegion,
      geoCountry: geo.geoCountry,
    }),
  }).catch(() => {});
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminSession = await hasAdminSession(request);

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!adminSession) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  if (shouldEnqueueVisitTracking(request, adminSession)) {
    trackVisit(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
