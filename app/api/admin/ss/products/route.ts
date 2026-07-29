import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { listAllProductsAdmin } from "@/lib/order/queries";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function hint(msg: string) {
  return /does not exist|PGRST205|schema cache/i.test(msg)
    ? " Run migrations 029_self_service_ordering.sql and 032_designers_choice_scales.sql in Supabase."
    : "";
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }
  try {
    const products = await listAllProductsAdmin();
    return NextResponse.json({ products });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Load failed";
    return NextResponse.json(
      { error: `${message}${hint(message)}` },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = (await request.json()) as Record<string, unknown>;
  const slug = String(body.slug ?? "")
    .trim()
    .toLowerCase();
  const name = String(body.name ?? "").trim();
  const base_price_cents = Number(body.base_price_cents);
  if (!slug || !name || !Number.isFinite(base_price_cents) || base_price_cents <= 0) {
    return NextResponse.json({ error: "slug, name, and price required." }, { status: 400 });
  }
  const supabase = createServiceClient();
  const baseRow = {
    slug,
    name,
    description: String(body.description ?? ""),
    base_price_cents: Math.round(base_price_cents),
    capacity_cost: Number(body.capacity_cost) || 1,
    requires_vessel: Boolean(body.requires_vessel),
    allows_delivery: body.allows_delivery !== false,
    allows_pickup: body.allows_pickup !== false,
    image_url: String(body.image_url ?? ""),
    image_alt: String(body.image_alt ?? ""),
    is_active: body.is_active !== false,
    sort_order: Number(body.sort_order) || 100,
    updated_at: new Date().toISOString(),
  };
  let { data, error } = await supabase
    .from("ss_products")
    .insert({
      ...baseRow,
      blurb: String(body.blurb ?? ""),
      vessel_upgrade_cents: Math.max(
        0,
        Math.round(Number(body.vessel_upgrade_cents) || 0),
      ),
      is_popular: Boolean(body.is_popular),
    })
    .select()
    .single();
  if (
    error &&
    /blurb|vessel_upgrade|is_popular|schema cache|PGRST/i.test(error.message)
  ) {
    const retry = await supabase.from("ss_products").insert(baseRow).select().single();
    data = retry.data;
    error = retry.error;
  }
  if (error) {
    return NextResponse.json(
      { error: `${error.message}${hint(error.message)}` },
      { status: 400 },
    );
  }
  revalidatePath("/order");
  return NextResponse.json({ product: data });
}
