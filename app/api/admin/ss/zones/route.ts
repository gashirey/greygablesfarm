import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { listZonesAdmin } from "@/lib/order/queries";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }
  try {
    return NextResponse.json({ zones: await listZonesAdmin() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = (await request.json()) as {
    name?: string;
    fee_cents?: number;
    sort_order?: number;
    zips?: string[];
    is_active?: boolean;
  };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name required." }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { data: zone, error } = await supabase
    .from("ss_delivery_zones")
    .insert({
      name,
      fee_cents: Math.max(0, Math.round(Number(body.fee_cents) || 0)),
      sort_order: Number(body.sort_order) || 100,
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const zips = (body.zips ?? [])
    .map((z) => z.trim().slice(0, 5))
    .filter((z) => /^\d{5}$/.test(z));
  if (zips.length) {
    await supabase.from("ss_delivery_zone_zips").insert(
      zips.map((zip) => ({ zone_id: zone.id, zip })),
    );
  }
  revalidatePath("/order");
  return NextResponse.json({ zone });
}
