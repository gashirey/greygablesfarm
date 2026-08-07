import { NextResponse } from "next/server";
import { site } from "@/lib/content";
import {
  isStripeTaxEnabled,
  RESERVATION_MINUTES,
} from "@/lib/order/config";
import {
  applyLiveSmokeProductPricing,
  isSmokeSecretValid,
  LIVE_SMOKE_DELIVERY_CENTS,
  LIVE_SMOKE_ZIP,
  LIVE_SMOKE_ZONE_NAME,
  readSmokeSecretFromRequest,
  withLiveSmokeNote,
} from "@/lib/order/live-smoke";
import { computeOrderPricing, assertPricingNotTampered } from "@/lib/order/pricing";
import {
  getInTownPickupSlotById,
  getPickupWindowById,
  getProductBySlug,
  getVesselById,
  lookupZoneByZip,
} from "@/lib/order/queries";
import { enrichScaleProduct } from "@/lib/order/scales";
import { createReservation, releaseExpiredReservations } from "@/lib/order/reservations";
import {
  buildStripeCheckoutLineItems,
  buildStripeOrderMetadata,
} from "@/lib/order/stripe-labels";
import type {
  CheckoutInput,
  FulfillmentType,
  PresentationMode,
} from "@/lib/order/types";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return `https://${site.domain}`;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Ordering is not configured." },
      { status: 503 },
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payment is not configured yet." },
      { status: 503 },
    );
  }

  await releaseExpiredReservations();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  if (payload.website) {
    return NextResponse.json({ ok: true });
  }

  const liveSmoke = isSmokeSecretValid(
    readSmokeSecretFromRequest(request, payload),
  );

  const presentationRaw =
    typeof payload.presentation === "string" ? payload.presentation.trim() : "";
  const presentation: PresentationMode | undefined = liveSmoke
    ? "signature-glass"
    : presentationRaw === "curated-keepsake" ||
        presentationRaw === "signature-glass"
      ? presentationRaw
      : undefined;

  const input: CheckoutInput = {
    productSlug:
      typeof payload.productSlug === "string" ? payload.productSlug.trim() : "",
    presentation,
    vesselId:
      typeof payload.vesselId === "string" ? payload.vesselId.trim() : null,
    reservationId:
      typeof payload.reservationId === "string"
        ? payload.reservationId.trim()
        : null,
    fulfillmentType: payload.fulfillmentType as FulfillmentType,
    fulfillmentDate:
      typeof payload.fulfillmentDate === "string"
        ? payload.fulfillmentDate.trim()
        : "",
    pickupWindowId:
      typeof payload.pickupWindowId === "string"
        ? payload.pickupWindowId.trim()
        : null,
    inTownPickupSlotId:
      typeof payload.inTownPickupSlotId === "string"
        ? payload.inTownPickupSlotId.trim()
        : null,
    addressZip:
      typeof payload.addressZip === "string" ? payload.addressZip.trim() : null,
    addressStreet:
      typeof payload.addressStreet === "string"
        ? payload.addressStreet.trim()
        : null,
    addressLine2:
      typeof payload.addressLine2 === "string"
        ? payload.addressLine2.trim()
        : null,
    addressCity:
      typeof payload.addressCity === "string"
        ? payload.addressCity.trim()
        : null,
    addressState:
      typeof payload.addressState === "string"
        ? payload.addressState.trim()
        : "VA",
    recipientName:
      typeof payload.recipientName === "string"
        ? payload.recipientName.trim()
        : null,
    recipientPhone:
      typeof payload.recipientPhone === "string"
        ? payload.recipientPhone.trim()
        : null,
    deliveryInstructions:
      typeof payload.deliveryInstructions === "string"
        ? payload.deliveryInstructions.trim()
        : null,
    buyerName:
      typeof payload.buyerName === "string" ? payload.buyerName.trim() : "",
    buyerEmail:
      typeof payload.buyerEmail === "string" ? payload.buyerEmail.trim() : "",
    buyerPhone:
      typeof payload.buyerPhone === "string" ? payload.buyerPhone.trim() : "",
    cardMessage:
      typeof payload.cardMessage === "string"
        ? payload.cardMessage.trim().slice(0, 250)
        : null,
    notes:
      typeof payload.notes === "string" ? payload.notes.trim() : null,
    // Pricing is never included with the arrangement; receipts go to the buyer.
    isGift: Boolean(payload.isGift),
    hidePricing: true,
  };

  const clientClaimedTotal =
    payload.claimedTotalCents != null
      ? Number(payload.claimedTotalCents)
      : null;

  if (
    !input.productSlug ||
    !input.fulfillmentDate ||
    !input.buyerName ||
    !input.buyerEmail ||
    !input.buyerPhone
  ) {
    return NextResponse.json(
      { error: "Please complete all required fields." },
      { status: 400 },
    );
  }

  if (!EMAIL_RE.test(input.buyerEmail)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  if (
    input.fulfillmentType !== "delivery" &&
    input.fulfillmentType !== "pickup" &&
    input.fulfillmentType !== "in_town_pickup"
  ) {
    return NextResponse.json(
      { error: "Choose delivery, farm pickup, or in-town pickup." },
      { status: 400 },
    );
  }

  const productRaw = await getProductBySlug(input.productSlug);
  if (!productRaw) {
    return NextResponse.json(
      { error: "That arrangement is not available." },
      { status: 400 },
    );
  }
  let product = enrichScaleProduct(productRaw);
  if (liveSmoke) {
    product = applyLiveSmokeProductPricing(product);
  }

  if (input.fulfillmentType === "delivery" && !product.allowsDelivery) {
    return NextResponse.json(
      { error: "This arrangement is pickup only." },
      { status: 400 },
    );
  }
  if (
    (input.fulfillmentType === "pickup" ||
      input.fulfillmentType === "in_town_pickup") &&
    !product.allowsPickup
  ) {
    return NextResponse.json(
      { error: "This arrangement is delivery only." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  let vessel = null;
  let hasActiveVesselHold = false;
  const needsVesselPick = product.requiresVessel;
  if (needsVesselPick || input.vesselId) {
    if (needsVesselPick && !input.vesselId) {
      return NextResponse.json(
        { error: "Please select a vessel." },
        { status: 400 },
      );
    }
    if (input.vesselId) {
      vessel = await getVesselById(input.vesselId);
      if (!vessel || !vessel.isActive) {
        return NextResponse.json(
          { error: "That vessel is no longer available." },
          { status: 400 },
        );
      }

      if (input.reservationId) {
        const { data: hold } = await supabase
          .from("ss_reservations")
          .select("id, vessel_id, status, expires_at")
          .eq("id", input.reservationId)
          .eq("status", "held")
          .maybeSingle();
        const now = new Date().toISOString();
        hasActiveVesselHold = Boolean(
          hold &&
            hold.expires_at >= now &&
            hold.vessel_id === input.vesselId,
        );
      }

      if (!hasActiveVesselHold && vessel.qtyOnHand < 1) {
        return NextResponse.json(
          { error: "That vessel is no longer available." },
          { status: 400 },
        );
      }
    }
  }

  const resolvedPresentation: PresentationMode = liveSmoke
    ? "signature-glass"
    : (input.presentation ??
      (vessel || product.requiresVessel
        ? "curated-keepsake"
        : "signature-glass"));

  if (liveSmoke) {
    vessel = null;
  }

  let deliveryFeeCents = 0;
  let deliveryZoneId: string | null = null;
  let deliveryZoneName: string | null = null;

  if (input.fulfillmentType === "delivery") {
    if (
      !input.addressZip ||
      !input.addressStreet ||
      !input.addressCity ||
      !input.recipientName ||
      !input.recipientPhone
    ) {
      return NextResponse.json(
        { error: "Please complete delivery details." },
        { status: 400 },
      );
    }

    const zip = input.addressZip.replace(/\D/g, "").slice(0, 5);
    if (liveSmoke) {
      if (zip !== LIVE_SMOKE_ZIP) {
        return NextResponse.json(
          {
            error: `Smoke test delivery uses ZIP ${LIVE_SMOKE_ZIP} only ($${LIVE_SMOKE_DELIVERY_CENTS / 100} fee). Or choose Farm Pickup.`,
          },
          { status: 400 },
        );
      }
      deliveryFeeCents = LIVE_SMOKE_DELIVERY_CENTS;
      deliveryZoneId = null;
      deliveryZoneName = LIVE_SMOKE_ZONE_NAME;
      input.addressZip = LIVE_SMOKE_ZIP;
    } else {
      const zoneResult = await lookupZoneByZip(input.addressZip);
      if (!zoneResult) {
        return NextResponse.json(
          {
            error:
              "This address is outside our regular delivery area. Please choose Farm Pickup, enter a different ZIP, or contact Grey Gables.",
          },
          { status: 400 },
        );
      }
      deliveryFeeCents = zoneResult.zone.feeCents;
      deliveryZoneId = zoneResult.zone.id;
      deliveryZoneName = zoneResult.zone.name;
      // Authoritative normalized ZIP from server lookup
      input.addressZip = zoneResult.zip;
    }
  } else if (input.fulfillmentType === "in_town_pickup") {
    if (!input.inTownPickupSlotId) {
      return NextResponse.json(
        { error: "Please select an in-town pickup time." },
        { status: 400 },
      );
    }
    const slot = await getInTownPickupSlotById(input.inTownPickupSlotId);
    if (!slot || slot.pickupDate !== input.fulfillmentDate) {
      return NextResponse.json(
        { error: "That in-town pickup is not available." },
        { status: 400 },
      );
    }
    if ((slot.remainingCapacity ?? 0) < 1) {
      return NextResponse.json(
        { error: "That in-town pickup is full." },
        { status: 400 },
      );
    }
    const loc = slot.location;
    if (!loc) {
      return NextResponse.json(
        { error: "That in-town pickup is not available." },
        { status: 400 },
      );
    }
    // Snapshot location onto the order for receipts / farm ops
    input.addressStreet = loc.addressStreet;
    input.addressLine2 = loc.addressLine2;
    input.addressCity = loc.addressCity;
    input.addressState = loc.addressState;
    input.addressZip = loc.addressZip;
    if (loc.notes.trim() && !input.deliveryInstructions) {
      input.deliveryInstructions = loc.notes.trim();
    }
  } else {
    if (!input.pickupWindowId) {
      return NextResponse.json(
        { error: "Please select a pickup window." },
        { status: 400 },
      );
    }
    const window = await getPickupWindowById(input.pickupWindowId);
    if (!window || window.fulfillmentDate !== input.fulfillmentDate) {
      return NextResponse.json(
        { error: "That pickup window is not available." },
        { status: 400 },
      );
    }
  }

  let pricing;
  try {
    pricing = computeOrderPricing({
      product,
      presentation: resolvedPresentation,
      vessel,
      deliveryFeeCents,
      deliveryLabel: deliveryZoneName
        ? `${deliveryZoneName} delivery`
        : "Local delivery",
      taxCents: 0,
    });
    assertPricingNotTampered(pricing, clientClaimedTotal);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pricing error." },
      { status: 400 },
    );
  }

  const orderBase = {
    product_id: product.id,
    vessel_id: vessel?.id ?? null,
    fulfillment_type: input.fulfillmentType,
    fulfillment_date: input.fulfillmentDate,
    pickup_window_id:
      input.fulfillmentType === "pickup" ? input.pickupWindowId : null,
    in_town_pickup_slot_id:
      input.fulfillmentType === "in_town_pickup"
        ? input.inTownPickupSlotId
        : null,
    delivery_zone_id: deliveryZoneId,
    delivery_zone_name: deliveryZoneName,
    buyer_name: input.buyerName,
    buyer_email: input.buyerEmail.toLowerCase(),
    buyer_phone: input.buyerPhone,
    recipient_name: input.recipientName,
    recipient_phone: input.recipientPhone,
    address_street: input.addressStreet,
    address_line2: input.addressLine2 || null,
    address_city: input.addressCity,
    address_state: input.addressState ?? "VA",
    address_zip: input.addressZip?.slice(0, 5) ?? null,
    delivery_instructions: input.deliveryInstructions,
    card_message: input.cardMessage,
    notes: liveSmoke ? withLiveSmokeNote(input.notes) : input.notes,
    arrangement_cents: pricing.arrangementCents,
    vessel_cents: pricing.vesselCents,
    delivery_fee_cents: pricing.deliveryFeeCents,
    tax_cents: pricing.taxCents,
    total_cents: pricing.totalCents,
    payment_status: "pending",
    fulfillment_status: "checkout_started",
  };

  let { data: order, error: orderErr } = await supabase
    .from("ss_orders")
    .insert({
      ...orderBase,
      presentation: resolvedPresentation,
      is_gift: Boolean(input.isGift),
      hide_pricing: Boolean(input.hidePricing),
    })
    .select("id")
    .single();

  // Before migrations 032/033/035, optional columns may be missing
  if (
    orderErr &&
    /in_town_pickup_slot_id|schema cache|PGRST204/i.test(
      orderErr.message ?? "",
    )
  ) {
    if (input.fulfillmentType === "in_town_pickup") {
      return NextResponse.json(
        {
          error:
            "In-town pickup is not available yet. Please choose delivery or farm pickup.",
        },
        { status: 503 },
      );
    }
    const { in_town_pickup_slot_id: _slot, ...without035 } = orderBase;
    const retry035 = await supabase
      .from("ss_orders")
      .insert({
        ...without035,
        presentation: resolvedPresentation,
        is_gift: Boolean(input.isGift),
        hide_pricing: Boolean(input.hidePricing),
      })
      .select("id")
      .single();
    order = retry035.data;
    orderErr = retry035.error;
  }

  if (
    orderErr &&
    /delivery_zone_name|address_line2|schema cache|PGRST204/i.test(
      orderErr.message ?? "",
    )
  ) {
    const {
      delivery_zone_name: _zn,
      address_line2: _a2,
      in_town_pickup_slot_id: _slot2,
      ...without033
    } = orderBase;
    const retry033 = await supabase
      .from("ss_orders")
      .insert({
        ...without033,
        presentation: resolvedPresentation,
        is_gift: Boolean(input.isGift),
        hide_pricing: Boolean(input.hidePricing),
      })
      .select("id")
      .single();
    order = retry033.data;
    orderErr = retry033.error;
  }

  if (
    orderErr &&
    /presentation|is_gift|hide_pricing|schema cache|PGRST204/i.test(
      orderErr.message ?? "",
    )
  ) {
    const {
      delivery_zone_name: _zn2,
      address_line2: _a22,
      in_town_pickup_slot_id: _slot3,
      ...core
    } = orderBase;
    const retry032 = await supabase
      .from("ss_orders")
      .insert(core)
      .select("id")
      .single();
    order = retry032.data;
    orderErr = retry032.error;
  }

  if (orderErr || !order) {
    console.error("[checkout] order insert", orderErr);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 },
    );
  }

  const reservation = await createReservation({
    productId: product.id,
    vesselId: vessel?.id,
    fulfillmentDate: input.fulfillmentDate,
    pickupWindowId:
      input.fulfillmentType === "pickup" ? input.pickupWindowId : null,
    inTownPickupSlotId:
      input.fulfillmentType === "in_town_pickup"
        ? input.inTownPickupSlotId
        : null,
    orderId: order.id,
    reservationId: input.reservationId,
  });

  if (!reservation.ok) {
    await supabase.from("ss_orders").delete().eq("id", order.id);
    return NextResponse.json({ error: reservation.error }, { status: 409 });
  }

  await supabase
    .from("ss_orders")
    .update({ reservation_id: reservation.reservationId })
    .eq("id", order.id);

  await supabase.from("ss_order_line_items").insert(
    pricing.lines.map((line) => ({
      order_id: order.id,
      kind: line.kind,
      label: line.label,
      quantity: line.quantity,
      unit_amount_cents: line.unitAmountCents,
    })),
  );

  const stripe = getStripe();
  const origin = siteOrigin(request);
  const automaticTax = isStripeTaxEnabled();

  const lineItems = buildStripeCheckoutLineItems(pricing.lines, {
    productName: product.name,
    deliveryRegionName: deliveryZoneName,
  });

  // Signature Glass is included in the arrangement — never a $0 vessel line
  if (lineItems.length === 0) {
    return NextResponse.json(
      { error: "Nothing to charge." },
      { status: 400 },
    );
  }

  const stripeMeta = {
    ...buildStripeOrderMetadata({
      orderId: order.id,
      productSlug: product.slug,
      productName: product.name,
      presentation: resolvedPresentation,
      fulfillmentType: input.fulfillmentType,
      fulfillmentDate: input.fulfillmentDate,
      deliveryRegionName: deliveryZoneName,
      deliveryZip: input.addressZip,
      buyerName: input.buyerName,
    }),
    ...(liveSmoke ? { live_smoke: "1" } : {}),
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.buyerEmail.toLowerCase(),
      client_reference_id: order.id,
      metadata: stripeMeta,
      payment_intent_data: {
        description: liveSmoke
          ? "Grey Gables Farm — Live smoke test order"
          : "Grey Gables Farm Order",
        metadata: stripeMeta,
      },
      line_items: lineItems,
      automatic_tax: automaticTax ? { enabled: true } : undefined,
      success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/order/cancelled?order_id=${order.id}`,
      // Stripe requires ≥ 30 minutes; keep session in lockstep with reservation hold
      expires_at:
        Math.floor(Date.now() / 1000) +
        Math.max(30, RESERVATION_MINUTES) * 60,
    });

    if (!session.url) {
      throw new Error("No checkout URL");
    }

    await supabase
      .from("ss_orders")
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      checkoutUrl: session.url,
      expiresAt: reservation.expiresAt,
      totalCents: pricing.totalCents,
    });
  } catch (err) {
    console.error("[checkout] stripe", err);
    const { releaseReservation } = await import("@/lib/order/reservations");
    await releaseReservation(reservation.reservationId);
    await supabase
      .from("ss_orders")
      .update({
        payment_status: "failed",
        fulfillment_status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
    return NextResponse.json(
      { error: "Could not start payment. Please try again." },
      { status: 500 },
    );
  }
}
