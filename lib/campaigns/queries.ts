import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isOutsideVisitorEvent } from "@/lib/tracking/visit";
import type { Campaign, CampaignWithStats, SiteVisitEvent } from "./types";

export function isCampaignsConfigured(): boolean {
  return isSupabaseConfigured();
}

export async function getCampaignBySlug(
  slug: string,
): Promise<Campaign | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[getCampaignBySlug]", error);
    return null;
  }

  return (data as Campaign | null) ?? null;
}

export async function listCampaignsWithStats(): Promise<CampaignWithStats[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createServiceClient();
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("slug");

  if (error) {
    console.error("[listCampaignsWithStats]", error);
    return [];
  }

  const rows = (campaigns ?? []) as Campaign[];
  if (rows.length === 0) return [];

  const { data: counts, error: countError } = await supabase
    .from("site_visit_events")
    .select("campaign_id, referrer, pathname, user_agent, is_bot")
    .eq("visit_type", "campaign")
    .not("campaign_id", "is", null);

  if (countError) {
    console.error("[listCampaignsWithStats counts]", countError);
  }

  const countByCampaign = new Map<string, number>();
  for (const row of counts ?? []) {
    if (!isOutsideVisitorEvent(row)) continue;
    const id = row.campaign_id as string;
    countByCampaign.set(id, (countByCampaign.get(id) ?? 0) + 1);
  }

  return rows.map((campaign) => ({
    ...campaign,
    visit_count: countByCampaign.get(campaign.id) ?? 0,
  }));
}

export async function listRecentVisitEvents(
  limit = 50,
): Promise<SiteVisitEvent[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("site_visit_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[listRecentVisitEvents]", error);
    return [];
  }

  return (data ?? []) as SiteVisitEvent[];
}

/** Outside visitors only — excludes admin-origin, bots, and scanner noise. */
export async function listOutsideVisitEvents(
  limit = 100,
): Promise<SiteVisitEvent[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createServiceClient();
  // Fetch extra rows so admin/bot/noise can be filtered client-side.
  const { data, error } = await supabase
    .from("site_visit_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(limit * 6, 600));

  if (error) {
    console.error("[listOutsideVisitEvents]", error);
    return [];
  }

  return ((data ?? []) as SiteVisitEvent[])
    .filter((event) => isOutsideVisitorEvent(event))
    .slice(0, limit);
}
