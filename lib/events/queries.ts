import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  FarmEvent,
  FarmEventDate,
  FarmEventListItem,
  FarmEventSegment,
  FarmEventWithDetails,
} from "./types";

export function isEventsConfigured(): boolean {
  return isSupabaseConfigured();
}

export async function listFarmEvents(options?: {
  includeDrafts?: boolean;
}): Promise<FarmEventListItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createServiceClient();
  let query = supabase
    .from("farm_events")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (!options?.includeDrafts) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;
  if (error) {
    console.error("[listFarmEvents]", error);
    return [];
  }

  const events = (data ?? []) as FarmEvent[];
  if (events.length === 0) return [];

  const { data: dates, error: datesError } = await supabase
    .from("farm_event_dates")
    .select("event_id")
    .in(
      "event_id",
      events.map((e) => e.id),
    );

  if (datesError) {
    console.error("[listFarmEvents dates]", datesError);
  }

  const countByEvent = new Map<string, number>();
  for (const row of dates ?? []) {
    const id = row.event_id as string;
    countByEvent.set(id, (countByEvent.get(id) ?? 0) + 1);
  }

  return events.map((event) => ({
    ...event,
    date_count: countByEvent.get(event.id) ?? 0,
  }));
}

export async function getFarmEventBySlug(
  slug: string,
  options?: { includeDrafts?: boolean },
): Promise<FarmEventWithDetails | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createServiceClient();
  let query = supabase.from("farm_events").select("*").eq("slug", slug);

  if (!options?.includeDrafts) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("[getFarmEventBySlug]", error);
    return null;
  }
  if (!data) return null;

  return attachDetails(data as FarmEvent);
}

export async function getFarmEventById(
  id: string,
): Promise<FarmEventWithDetails | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("farm_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getFarmEventById]", error);
    return null;
  }
  if (!data) return null;

  return attachDetails(data as FarmEvent);
}

async function attachDetails(event: FarmEvent): Promise<FarmEventWithDetails> {
  const supabase = createServiceClient();
  const [datesRes, segmentsRes] = await Promise.all([
    supabase
      .from("farm_event_dates")
      .select("*")
      .eq("event_id", event.id)
      .order("sort_order", { ascending: true })
      .order("starts_on", { ascending: true }),
    supabase
      .from("farm_event_segments")
      .select("*")
      .eq("event_id", event.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (datesRes.error) console.error("[attachDetails dates]", datesRes.error);
  if (segmentsRes.error) {
    console.error("[attachDetails segments]", segmentsRes.error);
  }

  return {
    ...event,
    dates: (datesRes.data ?? []) as FarmEventDate[],
    segments: (segmentsRes.data ?? []) as FarmEventSegment[],
  };
}
