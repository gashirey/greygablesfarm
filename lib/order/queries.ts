import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  mapFulfillmentDate,
  mapPickupWindow,
  mapProduct,
  mapVessel,
  mapZone,
  type ProductRow,
  type VesselRow,
  type ZoneRow,
} from "./mappers";
import type {
  SsDeliveryZone,
  SsFulfillmentDate,
  SsPickupWindow,
  SsProduct,
  SsVessel,
} from "./types";

function client() {
  if (!isSupabaseConfigured()) return null;
  return createServiceClient();
}

const PRODUCT_SELECT_CORE =
  "id,slug,name,description,base_price_cents,capacity_cost,requires_vessel,allows_delivery,allows_pickup,image_url,image_alt,is_active,sort_order";
const PRODUCT_SELECT_FULL = `${PRODUCT_SELECT_CORE},blurb,vessel_upgrade_cents,is_popular`;

async function selectProducts(
  activeOnly: boolean,
): Promise<{ rows: ProductRow[]; error: string | null }> {
  const supabase = client();
  if (!supabase) return { rows: [], error: null };

  let q = supabase
    .from("ss_products")
    .select(PRODUCT_SELECT_FULL)
    .order("sort_order", { ascending: true });
  if (activeOnly) q = q.eq("is_active", true);

  const { data, error } = await q;
  if (!error) {
    return { rows: (data ?? []) as ProductRow[], error: null };
  }

  // Pre-migration 032: new columns may be missing
  if (/blurb|vessel_upgrade|is_popular|schema cache|PGRST/i.test(error.message)) {
    let fallback = supabase
      .from("ss_products")
      .select(PRODUCT_SELECT_CORE)
      .order("sort_order", { ascending: true });
    if (activeOnly) fallback = fallback.eq("is_active", true);
    const retry = await fallback;
    if (retry.error) {
      return { rows: [], error: retry.error.message };
    }
    return { rows: (retry.data ?? []) as ProductRow[], error: null };
  }

  return { rows: [], error: error.message };
}

export async function listActiveProducts(): Promise<SsProduct[]> {
  const { rows, error } = await selectProducts(true);
  if (error) {
    console.error("[ss_products]", error);
    return [];
  }
  return rows.map(mapProduct);
}

export async function listAllProductsAdmin(): Promise<ProductRow[]> {
  const { rows, error } = await selectProducts(false);
  if (error) throw new Error(error);
  return rows;
}

export async function getProductBySlug(slug: string): Promise<SsProduct | null> {
  const supabase = client();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ss_products")
    .select(PRODUCT_SELECT_FULL)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!error && data) return mapProduct(data as ProductRow);

  if (error && /blurb|vessel_upgrade|is_popular|schema cache|PGRST/i.test(error.message)) {
    const retry = await supabase
      .from("ss_products")
      .select(PRODUCT_SELECT_CORE)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (retry.error || !retry.data) return null;
    return mapProduct(retry.data as ProductRow);
  }

  return null;
}

export async function getProductById(id: string): Promise<SsProduct | null> {
  const supabase = client();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ss_products")
    .select(PRODUCT_SELECT_FULL)
    .eq("id", id)
    .maybeSingle();
  if (!error && data) return mapProduct(data as ProductRow);
  if (error && /blurb|vessel_upgrade|is_popular|schema cache|PGRST/i.test(error.message)) {
    const retry = await supabase
      .from("ss_products")
      .select(PRODUCT_SELECT_CORE)
      .eq("id", id)
      .maybeSingle();
    if (retry.error || !retry.data) return null;
    return mapProduct(retry.data as ProductRow);
  }
  return null;
}

/** Available vessels for sale (active + qty > 0). Includes held qty for accuracy when includeHeld=false for display. */
export async function listAvailableVessels(): Promise<SsVessel[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ss_vessels")
    .select("*")
    .eq("is_active", true)
    .gt("qty_on_hand", 0)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("[ss_vessels]", error.message);
    return [];
  }
  return ((data ?? []) as VesselRow[]).map(mapVessel);
}

export async function listAllVesselsAdmin(): Promise<VesselRow[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ss_vessels")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as VesselRow[];
}

export async function getVesselById(id: string): Promise<SsVessel | null> {
  const supabase = client();
  if (!supabase) return null;
  const { data } = await supabase
    .from("ss_vessels")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? mapVessel(data as VesselRow) : null;
}

export async function lookupZoneByZip(
  zipRaw: string,
): Promise<{ zone: SsDeliveryZone; zip: string } | null> {
  const zip = zipRaw.trim().slice(0, 5);
  if (!/^\d{5}$/.test(zip)) return null;

  const supabase = client();
  if (!supabase) return null;

  const { data: zipRow } = await supabase
    .from("ss_delivery_zone_zips")
    .select("zip, zone_id")
    .eq("zip", zip)
    .maybeSingle();

  if (!zipRow) return null;

  const { data: zoneRow } = await supabase
    .from("ss_delivery_zones")
    .select("*")
    .eq("id", zipRow.zone_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!zoneRow) return null;
  return { zone: mapZone(zoneRow as ZoneRow), zip };
}

export async function listZonesAdmin(): Promise<
  Array<ZoneRow & { zips: string[] }>
> {
  const supabase = client();
  if (!supabase) return [];
  const { data: zones, error } = await supabase
    .from("ss_delivery_zones")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);

  const { data: zips } = await supabase
    .from("ss_delivery_zone_zips")
    .select("zone_id, zip");

  const byZone = new Map<string, string[]>();
  for (const z of zips ?? []) {
    const list = byZone.get(z.zone_id) ?? [];
    list.push(z.zip);
    byZone.set(z.zone_id, list);
  }

  return ((zones ?? []) as ZoneRow[]).map((z) => ({
    ...z,
    zips: (byZone.get(z.id) ?? []).sort(),
  }));
}

/** Capacity used on a date by held + committed reservations. */
export async function getCapacityUsed(fulfillmentDate: string): Promise<number> {
  const supabase = client();
  if (!supabase) return 0;
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("ss_reservations")
    .select("capacity_cost, status, expires_at")
    .eq("fulfillment_date", fulfillmentDate)
    .in("status", ["held", "committed"]);

  let used = 0;
  for (const row of data ?? []) {
    if (row.status === "held" && row.expires_at < now) continue;
    used += row.capacity_cost ?? 0;
  }
  return used;
}

export async function getPickupWindowBooked(
  windowId: string,
): Promise<number> {
  const supabase = client();
  if (!supabase) return 0;
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("ss_reservations")
    .select("id, status, expires_at")
    .eq("pickup_window_id", windowId)
    .in("status", ["held", "committed"]);

  return (data ?? []).filter(
    (r) => r.status === "committed" || r.expires_at >= now,
  ).length;
}

export async function listAvailability(options?: {
  fromDate?: string;
  days?: number;
}): Promise<SsFulfillmentDate[]> {
  const supabase = client();
  if (!supabase) return [];

  const from = options?.fromDate ?? new Date().toISOString().slice(0, 10);
  const days = options?.days ?? 21;
  const toDate = new Date(`${from}T12:00:00Z`);
  toDate.setUTCDate(toDate.getUTCDate() + days);
  const to = toDate.toISOString().slice(0, 10);

  const { data: dates, error } = await supabase
    .from("ss_fulfillment_dates")
    .select("*")
    .eq("is_active", true)
    .gte("fulfillment_date", from)
    .lte("fulfillment_date", to)
    .order("fulfillment_date", { ascending: true });

  if (error || !dates?.length) return [];

  const dateIds = dates.map((d) => d.id);
  const { data: windows } = await supabase
    .from("ss_pickup_windows")
    .select("*")
    .in("fulfillment_date_id", dateIds)
    .eq("is_active", true)
    .order("starts_at", { ascending: true });

  const result: SsFulfillmentDate[] = [];
  for (const d of dates) {
    const used = await getCapacityUsed(d.fulfillment_date);
    const remaining = Math.max(0, d.max_capacity - used);
    const dayWindows: SsPickupWindow[] = [];
    for (const w of windows ?? []) {
      if (w.fulfillment_date_id !== d.id) continue;
      const booked = await getPickupWindowBooked(w.id);
      if (booked >= w.capacity) continue;
      dayWindows.push(
        mapPickupWindow({
          ...w,
          fulfillment_date: d.fulfillment_date,
        }),
      );
    }
    result.push({
      ...mapFulfillmentDate({
        ...d,
        remaining_capacity: remaining,
      }),
      windows: dayWindows,
    });
  }

  return result.filter((d) => (d.remainingCapacity ?? 0) > 0);
}

export async function getFulfillmentDate(
  date: string,
): Promise<SsFulfillmentDate | null> {
  const supabase = client();
  if (!supabase) return null;
  const { data } = await supabase
    .from("ss_fulfillment_dates")
    .select("*")
    .eq("fulfillment_date", date)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return null;
  const used = await getCapacityUsed(date);
  return mapFulfillmentDate({
    ...data,
    remaining_capacity: Math.max(0, data.max_capacity - used),
  });
}

export async function getPickupWindowById(
  id: string,
): Promise<SsPickupWindow | null> {
  const supabase = client();
  if (!supabase) return null;
  const { data } = await supabase
    .from("ss_pickup_windows")
    .select("*, ss_fulfillment_dates(fulfillment_date)")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return null;
  const fd = data.ss_fulfillment_dates as
    | { fulfillment_date: string }
    | { fulfillment_date: string }[]
    | null;
  const fulfillmentDate = Array.isArray(fd)
    ? fd[0]?.fulfillment_date
    : fd?.fulfillment_date;
  return mapPickupWindow({
    ...data,
    fulfillment_date: fulfillmentDate,
  });
}
