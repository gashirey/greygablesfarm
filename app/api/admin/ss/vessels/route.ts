import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { listAllVesselsAdmin } from "@/lib/order/queries";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function hint(msg: string) {
  return /does not exist|PGRST205|schema cache/i.test(msg)
    ? " Run migration 029_self_service_ordering.sql in Supabase."
    : "";
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }
  try {
    return NextResponse.json({ vessels: await listAllVesselsAdmin() });
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
  if (!slug || !name) {
    return NextResponse.json({ error: "slug and name required." }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ss_vessels")
    .insert({
      slug,
      name,
      description: String(body.description ?? ""),
      image_url: String(body.image_url ?? ""),
      image_alt: String(body.image_alt ?? ""),
      qty_on_hand: Math.max(0, Number(body.qty_on_hand) || 0),
      price_adjustment_cents: Math.round(Number(body.price_adjustment_cents) || 0),
      is_active: body.is_active !== false,
      sort_order: Number(body.sort_order) || 100,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json(
      { error: `${error.message}${hint(error.message)}` },
      { status: 400 },
    );
  }
  revalidatePath("/order");
  return NextResponse.json({ vessel: data });
}
