import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SiteVisitEvent } from "@/lib/campaigns/types";

export type VisitLogInput = {
  campaignId?: string | null;
  slug?: string | null;
  pathname: string;
  searchParams?: Record<string, string> | null;
  referrer?: string | null;
  userAgent?: string | null;
  visitType: SiteVisitEvent["visit_type"];
};

export function searchParamsFromUrl(search: string): Record<string, string> | null {
  if (!search || search === "?") return null;
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const out: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function shouldTrackPublicVisit(pathname: string, search: string): boolean {
  if (pathname.startsWith("/api")) return false;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname === "/") {
    return Boolean(search && search !== "?");
  }
  return true;
}

export async function logSiteVisit(input: VisitLogInput): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("site_visit_events").insert({
      campaign_id: input.campaignId ?? null,
      slug: input.slug ?? null,
      pathname: input.pathname,
      search_params: input.searchParams ?? null,
      referrer: input.referrer ?? null,
      user_agent: input.userAgent ?? null,
      visit_type: input.visitType,
    });

    if (error) {
      console.error("[logSiteVisit]", error);
    }
  } catch (err) {
    console.error("[logSiteVisit]", err);
  }
}
