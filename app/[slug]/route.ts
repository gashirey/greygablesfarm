import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCampaignBySlug } from "@/lib/campaigns/queries";
import {
  isCampaignSlug,
  isReservedCampaignSlug,
} from "@/lib/campaigns/slug";
import {
  logSiteVisit,
  searchParamsFromUrl,
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

  await logSiteVisit({
    campaignId: campaign?.id ?? null,
    slug,
    pathname: `/${slug}`,
    searchParams,
    referrer,
    userAgent,
    visitType: "campaign",
  });

  const destination =
    campaign?.is_active && campaign.destination_url
      ? campaign.destination_url
      : "/";

  const redirectUrl = new URL(destination, request.url);
  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    redirectUrl.searchParams.set(key, value);
  }

  const response = NextResponse.redirect(redirectUrl, 302);

  if (campaign?.is_active) {
    response.cookies.set("ggf_campaign", slug, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
