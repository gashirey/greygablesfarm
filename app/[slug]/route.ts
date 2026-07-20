import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCampaignBySlug } from "@/lib/campaigns/queries";
import {
  isCampaignSlug,
  isReservedCampaignSlug,
} from "@/lib/campaigns/slug";
import { geoFromRequest } from "@/lib/tracking/geo";
import {
  CAMPAIGN_COOKIE,
  logSiteVisit,
  searchParamsFromUrl,
  shouldLogOutsideVisitor,
  VISITOR_COOKIE,
} from "@/lib/tracking/visit";

type Params = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: Params) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();

  if (!isCampaignSlug(slug) || isReservedCampaignSlug(slug)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const campaign = await getCampaignBySlug(slug);
  const searchParams = searchParamsFromUrl(request.nextUrl.search);
  const referrer = request.headers.get("referer");
  const userAgent = request.headers.get("user-agent");

  const destination =
    campaign?.is_active && campaign.destination_url
      ? campaign.destination_url
      : "/";

  const redirectUrl = new URL(destination, request.url);
  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    redirectUrl.searchParams.set(key, value);
  }

  const response = NextResponse.redirect(redirectUrl, 302);

  let visitorId = request.cookies.get(VISITOR_COOKIE)?.value?.trim() ?? null;
  if (!visitorId || visitorId.length < 8) {
    visitorId = crypto.randomUUID();
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      maxAge: 60 * 60 * 24 * 400,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  if (
    shouldLogOutsideVisitor({
      pathname: `/${slug}`,
      search: request.nextUrl.search,
      referrer,
      userAgent,
      host: request.nextUrl.host,
    })
  ) {
    const geo = geoFromRequest(request);
    const priorCampaign =
      request.cookies.get(CAMPAIGN_COOKIE)?.value?.trim() || null;
    await logSiteVisit({
      campaignId: campaign?.id ?? null,
      slug,
      pathname: `/${slug}`,
      searchParams,
      referrer,
      userAgent,
      visitType: "campaign",
      geoCity: geo.geoCity,
      geoRegion: geo.geoRegion,
      geoCountry: geo.geoCountry,
      geoTimezone: geo.geoTimezone,
      geoLatitude: geo.geoLatitude,
      geoLongitude: geo.geoLongitude,
      visitorId,
      acceptLanguage: request.headers.get("accept-language"),
      attributedCampaignSlug: priorCampaign,
      requestHost: request.nextUrl.host,
    });
  }

  if (campaign?.is_active) {
    response.cookies.set(CAMPAIGN_COOKIE, slug, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
