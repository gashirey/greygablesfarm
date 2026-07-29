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

  for (const key of [
    "slug",
    "name",
    "description",
    "blurb",
    "image_url",
    "image_alt",
  ] as const) {
    if (body[key] != null) patch[key] = String(body[key]).trim();
  }
  if (body.base_price_cents != null) {
    patch.base_price_cents = Math.round(Number(body.base_price_cents));
  }
  if (body.vessel_upgrade_cents != null) {
    patch.vessel_upgrade_cents = Math.max(
      0,
      Math.round(Number(body.vessel_upgrade_cents) || 0),
    );
  }
  if (body.capacity_cost != null) patch.capacity_cost = Number(body.capacity_cost);
  if (body.sort_order != null) patch.sort_order = Number(body.sort_order);
  if (body.requires_vessel != null) patch.requires_vessel = Boolean(body.requires_vessel);
  if (body.allows_delivery != null) patch.allows_delivery = Boolean(body.allows_delivery);
  if (body.allows_pickup != null) patch.allows_pickup = Boolean(body.allows_pickup);
  if (body.is_popular != null) patch.is_popular = Boolean(body.is_popular);
  if (body.is_active != null) patch.is_active = Boolean(body.is_active);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ss_products")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/order");
  revalidatePath(`/order/${data.slug}`);
  return NextResponse.json({ product: data });
}

export async function DELETE(request: Request, { params }: Props) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("ss_products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/order");
  return NextResponse.json({ ok: true });
}
