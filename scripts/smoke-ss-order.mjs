#!/usr/bin/env node
/**
 * Smoke-test self-service ordering readiness (read-only + soft API checks).
 * Usage: node --env-file=.env.local scripts/smoke-ss-order.mjs
 * Optional: BASE_URL=http://127.0.0.1:3000
 */

import { createClient } from "@supabase/supabase-js";

const base = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

let failed = 0;
function ok(label, pass, detail = "") {
  const mark = pass ? "PASS" : "FAIL";
  if (!pass) failed += 1;
  console.log(`${mark}  ${label}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log(`Smoke SS order @ ${base}\n`);

  ok("SUPABASE url/key", Boolean(url && key));
  ok("STRIPE_SECRET_KEY", Boolean(process.env.STRIPE_SECRET_KEY));
  ok("STRIPE_WEBHOOK_SECRET", Boolean(process.env.STRIPE_WEBHOOK_SECRET));
  ok("RESEND_API_KEY", Boolean(process.env.RESEND_API_KEY));

  if (!url || !key) {
    process.exit(1);
  }

  const sb = createClient(url, key);
  const products = await sb
    .from("ss_products")
    .select("slug,name,base_price_cents,vessel_upgrade_cents,is_active")
    .eq("is_active", true)
    .order("sort_order");
  ok("ss_products load", !products.error, products.error?.message);
  const slugs = (products.data ?? []).map((p) => p.slug);
  ok(
    "Classic/Signature/Grand active",
    ["classic", "signature", "grand"].every((s) => slugs.includes(s)),
    slugs.join(", "),
  );

  const zones = await sb
    .from("ss_delivery_zones")
    .select("id,name,is_active")
    .eq("is_active", true);
  const zips = await sb.from("ss_delivery_zone_zips").select("zip").limit(5);
  ok("Active delivery zones", (zones.data?.length ?? 0) > 0, String(zones.data?.length));
  ok("Zone ZIPs present", (zips.data?.length ?? 0) > 0, String(zips.data?.length));

  const today = new Date().toISOString().slice(0, 10);
  const dates = await sb
    .from("ss_fulfillment_dates")
    .select("fulfillment_date,is_active")
    .eq("is_active", true)
    .gte("fulfillment_date", today);
  ok(
    "Future fulfillment dates",
    (dates.data?.length ?? 0) > 0,
    String(dates.data?.length),
  );

  // HTTP checks (dev server)
  try {
    const orderPage = await fetch(`${base}/order`);
    ok("/order HTTP", orderPage.status === 200, String(orderPage.status));
    const html = await orderPage.text();
    ok(
      "/order shows page-1 CTA",
      /Delivery Instructions|Continue to Order Details/i.test(html),
    );

    const avail = await fetch(`${base}/api/order/availability`);
    const availJson = await avail.json().catch(() => ({}));
    ok(
      "/api/order/availability",
      avail.ok && Array.isArray(availJson.dates ?? availJson.availability ?? availJson),
      String(avail.status),
    );

    const sampleZip = zips.data?.[0]?.zip;
    if (sampleZip) {
      const zoneRes = await fetch(`${base}/api/order/zone-lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip: sampleZip }),
      });
      const zoneJson = await zoneRes.json();
      ok(
        `zone-lookup ${sampleZip}`,
        zoneRes.ok && zoneJson.inZone === true,
        zoneJson.zone?.name || zoneJson.message,
      );
    }

    // Checkout validation (expect 400 without full payload — proves route is up)
    const checkout = await fetch(`${base}/api/order/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const checkoutJson = await checkout.json().catch(() => ({}));
    ok(
      "checkout rejects empty payload",
      checkout.status === 400 || checkout.status === 503,
      `${checkout.status} ${checkoutJson.error || ""}`,
    );
  } catch (err) {
    ok("HTTP checks (is dev server up?)", false, String(err.message || err));
  }

  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
  process.exit(failed ? 1 : 0);
}

main();
