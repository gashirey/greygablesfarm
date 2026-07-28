import { NextResponse } from "next/server";
import { site } from "@/lib/content";
import {
  isStripeTaxEnabled,
  STRIPE_KIND_FLOWER_ORDER,
} from "@/lib/order/config";
import { computeOrderPricing, assertPricingNotTampered } from "@/lib/order/pricing";
import {
  getPickupWindowById,
  getProductBySlug,
  getVesselById,
  lookupZoneByZip,
} from "@/lib/order/queries";
import { createReservation, releaseExpiredReservations } from "@/lib/order/reservations";
import type { CheckoutInput, FulfillmentType } from "@/lib/order/types";
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

  const input: CheckoutInput = {
    productSlug:
      typeof payload.productSlug === "string" ? payload.productSlug.trim() : "",
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
    addressZip:
      typeof payload.addressZip === "string" ? payload.addressZip.trim() : null,
    addressStreet:
      typeof payload.addressStreet === "string"
        ? payload.addressStreet.trim()
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
    input.fulfillmentType !== "pickup"
  ) {
    return NextResponse.json(
      { error: "Choose delivery or farm pickup." },
      { status: 400 },
    );
  }

  const product = await getProductBySlug(input.productSlug);
  if (!product) {
    return NextResponse.json(
      { error: "That arrangement is not available." },
      { status: 400 },
    );
  }

  if (input.fulfillmentType === "delivery" && !product.allowsDelivery) {
    return NextResponse.json(
      { error: "This arrangement is pickup only." },
      { status: 400 },
    );
  }
  if (input.fulfillmentType === "pickup" && !product.allowsPickup) {
    return NextResponse.json(
      { error: "This arrangement is delivery only." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  let vessel = null;
  let hasActiveVesselHold = false;
  if (product.requiresVessel) {
    if (!input.vesselId) {
      return NextResponse.json(
        { error: "Please select a vessel." },
        { status: 400 },
      );
    }
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

  let deliveryFeeCents = 0;
  let deliveryZoneId: string | null = null;

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
    const zoneResult = await lookupZoneByZip(input.addressZip);
    if (!zoneResult) {
      return NextResponse.json(
        {
          error:
            "We don't deliver to that ZIP online. Please choose pickup or contact us.",
        },
        { status: 400 },
      );
    }
    deliveryFeeCents = zoneResult.zone.feeCents;
    deliveryZoneId = zoneResult.zone.id;
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
      vessel,
      deliveryFeeCents,
      taxCents: 0,
    });
    assertPricingNotTampered(pricing, clientClaimedTotal);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pricing error." },
      { status: 400 },
    );
  }

  const { data: order, error: orderErr } = await supabase
    .from("ss_orders")
    .insert({
      product_id: product.id,
      vessel_id: vessel?.id ?? null,
      fulfillment_type: input.fulfillmentType,
      fulfillment_date: input.fulfillmentDate,
      pickup_window_id:
        input.fulfillmentType === "pickup" ? input.pickupWindowId : null,
      delivery_zone_id: deliveryZoneId,
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail.toLowerCase(),
      buyer_phone: input.buyerPhone,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone,
      address_street: input.addressStreet,
      address_city: input.addressCity,
      address_state: input.addressState ?? "VA",
      address_zip: input.addressZip?.slice(0, 5) ?? null,
      delivery_instructions: input.deliveryInstructions,
      card_message: input.cardMessage,
      notes: input.notes,
      arrangement_cents: pricing.arrangementCents,
      vessel_cents: pricing.vesselCents,
      delivery_fee_cents: pricing.deliveryFeeCents,
      tax_cents: pricing.taxCents,
      total_cents: pricing.totalCents,
      payment_status: "pending",
      fulfillment_status: "checkout_started",
    })
    .select("id")
    .single();

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

  const lineItems = pricing.lines
    .filter((l) => l.kind !== "tax" && l.unitAmountCents > 0)
    .map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: "usd" as const,
        unit_amount: l.unitAmountCents,
        product_data: {
          name: l.label,
        },
      },
    }));

  // Include $0 vessel as description-only via arrangement name when included
  if (lineItems.length === 0) {
    return NextResponse.json(
      { error: "Nothing to charge." },
      { status: 400 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.buyerEmail.toLowerCase(),
      client_reference_id: order.id,
      metadata: {
        kind: STRIPE_KIND_FLOWER_ORDER,
        order_id: order.id,
        product_slug: product.slug,
      },
      line_items: lineItems,
      automatic_tax: automaticTax ? { enabled: true } : undefined,
      success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/order/cancelled?order_id=${order.id}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
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
