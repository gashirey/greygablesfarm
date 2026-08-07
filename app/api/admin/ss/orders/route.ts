import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const payment = url.searchParams.get("payment")?.trim() ?? "";

  const supabase = createServiceClient();
  const selectFull =
    "id, created_at, buyer_name, buyer_email, buyer_phone, recipient_name, recipient_phone, address_street, address_city, address_state, address_zip, delivery_instructions, card_message, notes, fulfillment_type, fulfillment_date, total_cents, payment_status, fulfillment_status, ss_products(name, slug), ss_vessels(name), ss_in_town_pickup_slots(label, starts_at, ends_at, ss_pickup_locations(name))";
  const selectCore =
    "id, created_at, buyer_name, buyer_email, buyer_phone, recipient_name, recipient_phone, address_street, address_city, address_zip, delivery_instructions, card_message, notes, fulfillment_type, fulfillment_date, total_cents, payment_status, fulfillment_status, ss_products(name, slug), ss_vessels(name)";

  let query = supabase
    .from("ss_orders")
    .select(selectFull)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("fulfillment_status", status);
  if (payment) query = query.eq("payment_status", payment);

  const first = await query;
  let data: unknown[] | null = first.data as unknown[] | null;
  let error = first.error;
  if (
    error &&
    /ss_in_town|address_state|schema cache|PGRST/i.test(error.message)
  ) {
    let fallback = supabase
      .from("ss_orders")
      .select(selectCore)
      .order("created_at", { ascending: false })
      .limit(100);
    if (status) fallback = fallback.eq("fulfillment_status", status);
    if (payment) fallback = fallback.eq("payment_status", payment);
    const retry = await fallback;
    data = retry.data as unknown[] | null;
    error = retry.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let orders = (data ?? []) as Array<{
    buyer_name?: string | null;
    buyer_email?: string | null;
    id: string;
    [key: string]: unknown;
  }>;
  if (q) {
    orders = orders.filter(
      (o) =>
        o.buyer_name?.toLowerCase().includes(q) ||
        o.buyer_email?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q),
    );
  }

  return NextResponse.json({ orders });
}
