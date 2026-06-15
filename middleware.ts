import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSessionToken } from "@/lib/admin/auth";
import { isCampaignPathSegment } from "@/lib/campaigns/slug";
import { shouldTrackPublicVisit } from "@/lib/tracking/visit";

function shouldEnqueueVisitTracking(request: NextRequest): boolean {
  const { pathname, search } = request.nextUrl;
  if (!shouldTrackPublicVisit(pathname, search)) return false;
  if (isCampaignPathSegment(pathname)) return false;
  return true;
}

function trackVisit(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const trackUrl = new URL("/api/track", request.url);
  const secret = process.env.TRACKING_SECRET;

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
    }),
  }).catch(() => {});
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("ggf_admin")?.value;
    if (!(await verifyAdminSessionToken(token))) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  if (shouldEnqueueVisitTracking(request)) {
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
