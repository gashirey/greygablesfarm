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
  const body = (await request.json()) as { fulfillment_status?: string };

  if (
    !body.fulfillment_status ||
    !STATUSES.includes(body.fulfillment_status as FulfillmentStatus)
  ) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ss_orders")
    .update({
      fulfillment_status: body.fulfillment_status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order: data });
}
