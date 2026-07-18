export type Campaign = {
  id: string;
  slug: string;
  name: string;
  destination_url: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignWithStats = Campaign & {
  visit_count: number;
};

export type SiteVisitEvent = {
  id: string;
  campaign_id: string | null;
  slug: string | null;
  pathname: string;
  search_params: Record<string, string> | null;
  referrer: string | null;
  user_agent: string | null;
  visit_type: "campaign" | "path" | "query";
  /** Approximate city from Vercel IP geo (campaign scans). */
  geo_city?: string | null;
  /** Approximate region / state code from Vercel IP geo. */
  geo_region?: string | null;
  /** Approximate country code from Vercel IP geo. */
  geo_country?: string | null;
  created_at: string;
};
