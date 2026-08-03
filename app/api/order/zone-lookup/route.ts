import { NextResponse } from "next/server";
import { normalizeDeliveryZip } from "@/lib/order/delivery-regions";
import {
  isSmokeSecretValid,
  LIVE_SMOKE_DELIVERY_CENTS,
  LIVE_SMOKE_ZIP,
  LIVE_SMOKE_ZONE_NAME,
  liveSmokeZoneResponse,
  readSmokeSecretFromRequest,
} from "@/lib/order/live-smoke";
import { lookupZoneByZip } from "@/lib/order/queries";
import { formatCents } from "@/lib/order/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const OUT_OF_AREA_MESSAGE =
  "We don't currently offer regular delivery to this area.";
const OUT_OF_AREA_SUPPORT =
  "We occasionally accommodate weddings, events, and larger custom orders outside our standard delivery area.";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Ordering is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const raw = typeof payload.zip === "string" ? payload.zip : "";
  const smokeAuthorized = isSmokeSecretValid(
    readSmokeSecretFromRequest(request, payload),
  );

  const zip = normalizeDeliveryZip(raw);
  if (!zip) {
    return NextResponse.json(
      {
        eligible: false,
        ok: false,
        inZone: false,
        zipCode: null,
        deliveryFee: null,
        deliveryFeeCents: null,
        error: "Please enter a valid 5-digit ZIP code.",
        message: "Please enter a valid 5-digit ZIP code.",
      },
      { status: 400 },
    );
  }

  if (smokeAuthorized && zip === LIVE_SMOKE_ZIP) {
    const zone = liveSmokeZoneResponse(zip);
    return NextResponse.json({
      eligible: true,
      ok: true,
      inZone: true,
      liveSmoke: true,
      delivery_region_id: zone.id,
      regionName: LIVE_SMOKE_ZONE_NAME,
      zipCode: zip,
      zip,
      deliveryFee: LIVE_SMOKE_DELIVERY_CENTS / 100,
      deliveryFeeCents: LIVE_SMOKE_DELIVERY_CENTS,
      fulfillmentMethod: "delivery",
      message: "Smoke test ZIP — $2 delivery for Live verification.",
      zone,
    });
  }

  const result = await lookupZoneByZip(zip);
  if (!result) {
    return NextResponse.json({
      eligible: false,
      ok: false,
      inZone: false,
      zipCode: zip,
      zip: zip,
      deliveryFee: null,
      deliveryFeeCents: null,
      fulfillmentMethod: "delivery",
      message: OUT_OF_AREA_MESSAGE,
      supportMessage: OUT_OF_AREA_SUPPORT,
    });
  }

  const feeDollars = result.zone.feeCents / 100;

  return NextResponse.json({
    eligible: true,
    ok: true,
    inZone: true,
    delivery_region_id: result.zone.id,
    regionName: result.zone.name,
    zipCode: result.zip,
    zip: result.zip,
    deliveryFee: feeDollars,
    deliveryFeeCents: result.zone.feeCents,
    fulfillmentMethod: "delivery",
    message: "Great news! We deliver to this area.",
    zone: {
      id: result.zone.id,
      name: result.zone.name,
      feeCents: result.zone.feeCents,
      feeLabel: formatCents(result.zone.feeCents),
    },
  });
}
