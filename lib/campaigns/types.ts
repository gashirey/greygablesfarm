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
  /** Approximate city from Vercel IP geo. */
  geo_city?: string | null;
  /** Approximate region / state code from Vercel IP geo. */
  geo_region?: string | null;
  /** Approximate country code from Vercel IP geo. */
  geo_country?: string | null;
  geo_timezone?: string | null;
  geo_latitude?: string | null;
  geo_longitude?: string | null;
  /** First-party cookie id for unique-visitor estimates. */
  visitor_id?: string | null;
  /** True when UA matched crawler / probe patterns at insert time. */
  is_bot?: boolean | null;
  accept_language?: string | null;
  device_type?: "mobile" | "tablet" | "desktop" | "unknown" | string | null;
  browser?: string | null;
  os?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  /** Prior QR/short-link from ggf_campaign cookie. */
  attributed_campaign_slug?: string | null;
  request_host?: string | null;
  created_at: string;
};
