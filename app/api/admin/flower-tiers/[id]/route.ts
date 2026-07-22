import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = { params: Promise<{ id: string }> };

const SLUG_RE = /^[a-z][a-z0-9_-]*$/;

export async function PATCH(request: Request, { params }: Props) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.slug != null) {
    const slug = String(body.slug).trim().toLowerCase();
    if (!SLUG_RE.test(slug)) {
      return NextResponse.json(
        { error: "Invalid slug format." },
        { status: 400 },
      );
    }
    patch.slug = slug;
  }
  if (body.name != null) patch.name = String(body.name).trim();
  if (body.price != null) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(price)) {
      return NextResponse.json(
        { error: "Price must be a whole number greater than 0." },
        { status: 400 },
      );
    }
    patch.price = price;
  }
  if (body.description != null) patch.description = String(body.description);
  if (body.cta_label != null) {
    const cta = String(body.cta_label).trim();
    patch.cta_label = cta || "Order for delivery";
  }
  if (body.image_url != null) patch.image_url = String(body.image_url).trim();
  if (body.image_alt != null) patch.image_alt = String(body.image_alt).trim();
  if (body.image_object_position !== undefined) {
    const pos =
      body.image_object_position == null
        ? null
        : String(body.image_object_position).trim() || null;
    patch.image_object_position = pos;
  }
  if (body.is_popular != null) patch.is_popular = Boolean(body.is_popular);
  if (body.is_visible != null) patch.is_visible = Boolean(body.is_visible);
  if (body.sort_order != null) {
    const sort_order = Number(body.sort_order);
    if (Number.isNaN(sort_order)) {
      return NextResponse.json(
        { error: "sort_order must be a number." },
        { status: 400 },
      );
    }
    patch.sort_order = sort_order;
  }

  if (Object.keys(patch).length <= 1) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("flower_tiers")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/flowers");
  revalidatePath("/flowers/order");
  return NextResponse.json({ tier: data });
}

export async function DELETE(request: Request, { params }: Props) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("flower_tiers").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/flowers");
  revalidatePath("/flowers/order");
  return NextResponse.json({ ok: true });
}
