import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { createServiceClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  for (const key of ["slug", "name", "description", "image_url", "image_alt"] as const) {
    if (body[key] != null) patch[key] = String(body[key]).trim();
  }
  if (body.qty_on_hand != null) patch.qty_on_hand = Math.max(0, Number(body.qty_on_hand));
  if (body.price_adjustment_cents != null) {
    patch.price_adjustment_cents = Math.round(Number(body.price_adjustment_cents));
  }
  if (body.sort_order != null) patch.sort_order = Number(body.sort_order);
  if (body.is_active != null) patch.is_active = Boolean(body.is_active);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ss_vessels")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/order");
  return NextResponse.json({ vessel: data });
}

export async function DELETE(request: Request, { params }: Props) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("ss_vessels").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/order");
  return NextResponse.json({ ok: true });
}
