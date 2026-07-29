import { NextResponse } from "next/server";
import { verifyOrderManageToken } from "@/lib/order/manage-token";
import { listAvailability } from "@/lib/order/queries";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const EDITABLE_STATUSES = new Set([
  "checkout_started",
  "confirmed",
  "designing",
]);

function publicOrder(row: Record<string, unknown>) {
  return {
    id: row.id,
    createdAt: row.created_at,
    fulfillmentType: row.fulfillment_type,
    fulfillmentDate: row.fulfillment_date,
    pickupWindowId: row.pickup_window_id,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    addressStreet: row.address_street,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressZip: row.address_zip,
    deliveryInstructions: row.delivery_instructions,
    cardMessage: row.card_message,
    notes: row.notes,
    isGift: row.is_gift,
    hidePricing: row.hide_pricing,
    presentation: row.presentation,
    arrangementCents: row.arrangement_cents,
    vesselCents: row.vessel_cents,
    deliveryFeeCents: row.delivery_fee_cents,
    totalCents: row.total_cents,
    product: row.ss_products,
    vessel: row.ss_vessels,
    editable: EDITABLE_STATUSES.has(String(row.fulfillment_status)),
  };
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  const verified = verifyOrderManageToken(token);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ss_orders")
    .select("*, ss_products(name, slug), ss_vessels(name)")
    .eq("id", verified.orderId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const availability = await listAvailability({ days: 21 });
  return NextResponse.json({
    order: publicOrder(data as Record<string, unknown>),
    availability,
  });
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const verified = verifyOrderManageToken(token);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: existing, error: loadErr } = await supabase
    .from("ss_orders")
    .select("*")
    .eq("id", verified.orderId)
    .maybeSingle();

  if (loadErr || !existing) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (!EDITABLE_STATUSES.has(existing.fulfillment_status)) {
    return NextResponse.json(
      {
        error:
          "This order can no longer be changed online. Please contact the farm.",
      },
      { status: 409 },
    );
  }

  if (body.requestCancel === true) {
    if (existing.payment_status === "paid") {
      return NextResponse.json(
        {
          error:
            "Paid orders cannot be cancelled online. Reply to your confirmation email and we’ll help.",
        },
        { status: 409 },
      );
    }
    const { data, error } = await supabase
      .from("ss_orders")
      .update({
        payment_status: "cancelled",
        fulfillment_status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*, ss_products(name, slug), ss_vessels(name)")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ order: publicOrder(data as Record<string, unknown>) });
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const str = (key: string, col: string, max = 500) => {
    if (typeof body[key] === "string") {
      patch[col] = body[key].trim().slice(0, max);
    }
  };

  str("buyerName", "buyer_name", 120);
  str("buyerPhone", "buyer_phone", 40);
  str("recipientName", "recipient_name", 120);
  str("recipientPhone", "recipient_phone", 40);
  str("addressStreet", "address_street", 200);
  str("addressCity", "address_city", 100);
  str("deliveryInstructions", "delivery_instructions", 500);
  str("cardMessage", "card_message", 250);
  str("notes", "notes", 1000);

  // ZIP locked after paid (fee already charged)
  if (
    existing.payment_status !== "paid" &&
    typeof body.addressZip === "string"
  ) {
    patch.address_zip = body.addressZip.trim().slice(0, 5);
  }

  if (typeof body.fulfillmentDate === "string" && body.fulfillmentDate.trim()) {
    const nextDate = body.fulfillmentDate.trim();
    const availability = await listAvailability({ days: 21 });
    const day = availability.find((d) => d.fulfillmentDate === nextDate);
    if (!day || (day.remainingCapacity ?? 0) < 1) {
      // Allow keeping the current date even if listAvailability filtered it out
      if (nextDate !== existing.fulfillment_date) {
        return NextResponse.json(
          { error: "That date is not available." },
          { status: 400 },
        );
      }
    }
    patch.fulfillment_date = nextDate;

    if (existing.fulfillment_type === "pickup") {
      const windowId =
        typeof body.pickupWindowId === "string"
          ? body.pickupWindowId.trim()
          : existing.pickup_window_id;
      const win = (day?.windows ?? []).find((w) => w.id === windowId);
      if (!win && nextDate !== existing.fulfillment_date) {
        return NextResponse.json(
          { error: "Please choose a pickup window for that date." },
          { status: 400 },
        );
      }
      if (win) patch.pickup_window_id = win.id;
    }
  }

  const { data, error } = await supabase
    .from("ss_orders")
    .update(patch)
    .eq("id", existing.id)
    .select("*, ss_products(name, slug), ss_vessels(name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Keep capacity reservation in sync when date/window changes
  if (
    existing.reservation_id &&
    (patch.fulfillment_date != null || patch.pickup_window_id != null)
  ) {
    await supabase
      .from("ss_reservations")
      .update({
        fulfillment_date:
          (patch.fulfillment_date as string) ?? existing.fulfillment_date,
        pickup_window_id:
          patch.pickup_window_id !== undefined
            ? patch.pickup_window_id
            : existing.pickup_window_id,
      })
      .eq("id", existing.reservation_id)
      .in("status", ["held", "committed"]);
  }

  return NextResponse.json({
    order: publicOrder(data as Record<string, unknown>),
  });
}
