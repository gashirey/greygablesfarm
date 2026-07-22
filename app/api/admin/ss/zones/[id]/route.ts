import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { createServiceClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    fee_cents?: number;
    sort_order?: number;
    is_active?: boolean;
    zips?: string[];
  };

  const supabase = createServiceClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name != null) patch.name = body.name.trim();
  if (body.fee_cents != null) {
    patch.fee_cents = Math.max(0, Math.round(Number(body.fee_cents)));
  }
  if (body.sort_order != null) patch.sort_order = Number(body.sort_order);
  if (body.is_active != null) patch.is_active = Boolean(body.is_active);

  const { data, error } = await supabase
    .from("ss_delivery_zones")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (body.zips) {
    await supabase.from("ss_delivery_zone_zips").delete().eq("zone_id", id);
    const zips = body.zips
      .map((z) => z.trim().slice(0, 5))
      .filter((z) => /^\d{5}$/.test(z));
    if (zips.length) {
      const { error: zipErr } = await supabase
        .from("ss_delivery_zone_zips")
        .insert(zips.map((zip) => ({ zone_id: id, zip })));
      if (zipErr) {
        return NextResponse.json({ error: zipErr.message }, { status: 400 });
      }
    }
  }

  revalidatePath("/order");
  return NextResponse.json({ zone: data });
}

export async function DELETE(request: Request, { params }: Props) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("ss_delivery_zones").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/order");
  return NextResponse.json({ ok: true });
}
