import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import type { FulfillmentStatus } from "@/lib/order/types";
import { createServiceClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

const STATUSES: FulfillmentStatus[] = [
  "checkout_started",
  "confirmed",
  "designing",
  "ready",
  "out_for_delivery",
  "ready_for_pickup",
  "completed",
  "cancelled",
];

export async function GET(request: Request, { params }: Props) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ss_orders")
    .select(
      "*, ss_products(name, slug), ss_vessels(name), ss_delivery_zones(name), ss_order_line_items(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ order: data });
}

export async function PATCH(request: Request, { params }: Props) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.fulfillment_status != null) {
    if (!STATUSES.includes(body.fulfillment_status as FulfillmentStatus)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    patch.fulfillment_status = body.fulfillment_status;
  }

  for (const [key, col] of [
    ["buyer_name", "buyer_name"],
    ["buyer_email", "buyer_email"],
    ["buyer_phone", "buyer_phone"],
    ["recipient_name", "recipient_name"],
    ["recipient_phone", "recipient_phone"],
    ["address_street", "address_street"],
    ["address_city", "address_city"],
    ["address_state", "address_state"],
    ["address_zip", "address_zip"],
    ["delivery_instructions", "delivery_instructions"],
    ["card_message", "card_message"],
    ["notes", "notes"],
    ["fulfillment_date", "fulfillment_date"],
    ["fulfillment_type", "fulfillment_type"],
  ] as const) {
    if (typeof body[key] === "string") {
      patch[col] = body[key].trim();
    }
  }

  if (Object.keys(patch).length <= 1) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ss_orders")
    .update(patch)
    .eq("id", id)
    .select(
      "*, ss_products(name, slug), ss_vessels(name), ss_delivery_zones(name)",
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order: data });
}
