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
  let query = supabase
    .from("ss_orders")
    .select(
      "id, created_at, buyer_name, buyer_email, buyer_phone, fulfillment_type, fulfillment_date, total_cents, payment_status, fulfillment_status, ss_products(name, slug), ss_vessels(name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("fulfillment_status", status);
  if (payment) query = query.eq("payment_status", payment);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let orders = data ?? [];
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
