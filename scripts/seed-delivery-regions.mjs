/**
 * Apply delivery regions + ZIP map via Supabase service role.
 * Prefer migrations 033/034 for schema; this script applies current fees + ZIPs.
 *
 * Run: node --env-file=.env.local scripts/seed-delivery-regions.mjs
 */

import { createClient } from "@supabase/supabase-js";

const REGIONS = [
  {
    name: "Charlottesville Area",
    fee_cents: 2500,
    sort_order: 10,
    kind: "standard",
    notes: "July 2026 pricing revision",
    zips: ["22901", "22902", "22903", "22911"],
  },
  {
    name: "Greene County",
    fee_cents: 2500,
    sort_order: 20,
    kind: "standard",
    notes: "July 2026 pricing revision",
    zips: ["22968", "22973"],
  },
  {
    name: "Orange County",
    fee_cents: 2500,
    sort_order: 30,
    kind: "standard",
    notes: "Barboursville, Gordonsville, Orange",
    zips: ["22923", "22942", "22960"],
  },
  {
    name: "Local Louisa",
    fee_cents: 1500,
    sort_order: 40,
    kind: "standard",
    notes: "ZIP 23093",
    zips: ["23093"],
  },
  {
    name: "Extended Louisa",
    fee_cents: 2500,
    sort_order: 45,
    kind: "standard",
    notes: "ZIP 23024",
    zips: ["23024"],
  },
  {
    name: "Lake Monticello & Fluvanna",
    fee_cents: 2500,
    sort_order: 50,
    kind: "standard",
    notes: "July 2026 pricing revision",
    zips: ["22963"],
  },
  {
    name: "Goochland",
    fee_cents: 4000,
    sort_order: 60,
    kind: "standard",
    notes: "Unchanged",
    zips: ["23063", "23065", "23129"],
  },
  {
    name: "Short Pump / West End",
    fee_cents: 5000,
    sort_order: 70,
    kind: "standard",
    notes: "Limited Richmond-area ZIPs only",
    zips: ["23059", "23233"],
  },
];

const DEACTIVATE_NAMES = [
  "Louisa",
  "Louisa County",
  "Orange",
  "Charlottesville",
  "Extended Delivery",
  "Special Delivery",
];

const OBSOLETE_ZIPS = ["22508", "22932", "22936", "24590"];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function upsertRegion(region) {
  const { data: existing } = await sb
    .from("ss_delivery_zones")
    .select("id")
    .eq("name", region.name)
    .maybeSingle();

  const payloadFull = {
    name: region.name,
    fee_cents: region.fee_cents,
    sort_order: region.sort_order,
    is_active: true,
    kind: region.kind,
    notes: region.notes,
    updated_at: new Date().toISOString(),
  };
  const payloadBasic = {
    name: region.name,
    fee_cents: region.fee_cents,
    sort_order: region.sort_order,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    let { error } = await sb
      .from("ss_delivery_zones")
      .update(payloadFull)
      .eq("id", existing.id);
    if (error && /kind|notes|schema cache|PGRST/i.test(error.message)) {
      ({ error } = await sb
        .from("ss_delivery_zones")
        .update(payloadBasic)
        .eq("id", existing.id));
    }
    if (error) throw new Error(`update ${region.name}: ${error.message}`);
    console.log(
      "Updated",
      region.name,
      `$${(region.fee_cents / 100).toFixed(0)}`,
    );
    return existing.id;
  }

  let { data, error } = await sb
    .from("ss_delivery_zones")
    .insert(payloadFull)
    .select("id")
    .single();
  if (error && /kind|notes|schema cache|PGRST/i.test(error.message)) {
    ({ data, error } = await sb
      .from("ss_delivery_zones")
      .insert(payloadBasic)
      .select("id")
      .single());
  }
  if (error) throw new Error(`insert ${region.name}: ${error.message}`);
  console.log(
    "Inserted",
    region.name,
    `$${(region.fee_cents / 100).toFixed(0)}`,
  );
  return data.id;
}

async function removeEmptyRegions() {
  const { data: zones, error } = await sb
    .from("ss_delivery_zones")
    .select("id, name");
  if (error) throw new Error(error.message);

  const { data: zips } = await sb
    .from("ss_delivery_zone_zips")
    .select("zone_id");
  const withZips = new Set((zips ?? []).map((z) => z.zone_id));

  for (const zone of zones ?? []) {
    if (withZips.has(zone.id)) continue;

    const { count } = await sb
      .from("ss_orders")
      .select("id", { count: "exact", head: true })
      .eq("delivery_zone_id", zone.id);

    if ((count ?? 0) === 0) {
      const { error: delErr } = await sb
        .from("ss_delivery_zones")
        .delete()
        .eq("id", zone.id);
      if (delErr) {
        console.warn(`could not delete empty ${zone.name}:`, delErr.message);
        await sb
          .from("ss_delivery_zones")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("id", zone.id);
      } else {
        console.log("Deleted empty region", zone.name);
      }
    } else {
      await sb
        .from("ss_delivery_zones")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", zone.id);
      console.log("Deactivated empty region (has orders)", zone.name);
    }
  }
}

async function main() {
  const { error: deactErr } = await sb
    .from("ss_delivery_zones")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in("name", DEACTIVATE_NAMES);
  if (deactErr) console.warn("deactivate legacy:", deactErr.message);
  else console.log("Deactivated obsolete regions:", DEACTIVATE_NAMES.join(", "));

  const zoneIds = new Map();
  for (const region of REGIONS) {
    zoneIds.set(region.name, await upsertRegion(region));
  }

  const allLaunchZips = [
    ...REGIONS.flatMap((r) => r.zips),
    ...OBSOLETE_ZIPS,
  ];

  const { error: delErr } = await sb
    .from("ss_delivery_zone_zips")
    .delete()
    .in("zip", allLaunchZips);
  if (delErr) throw new Error(`delete zips: ${delErr.message}`);
  console.log("Cleared ZIP rows for remapping");

  const zipRows = REGIONS.flatMap((r) =>
    r.zips.map((zip) => ({
      zone_id: zoneIds.get(r.name),
      zip,
      is_active: true,
    })),
  );

  if (zipRows.length) {
    let { error } = await sb.from("ss_delivery_zone_zips").insert(zipRows);
    if (error && /is_active|schema cache|PGRST/i.test(error.message)) {
      ({ error } = await sb.from("ss_delivery_zone_zips").insert(
        zipRows.map(({ zone_id, zip }) => ({ zone_id, zip })),
      ));
    }
    if (error) throw new Error(`insert zips: ${error.message}`);
  }

  console.log(`Seeded ${zipRows.length} ZIP mappings`);
  await removeEmptyRegions();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
