import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { listFlowerTiersAdmin } from "@/lib/flowers/queries";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const SLUG_RE = /^[a-z][a-z0-9_-]*$/;

function migrationHint(message: string) {
  return /does not exist|schema cache|PGRST205/i.test(message)
    ? " Run migration 028_flower_tiers.sql in Supabase."
    : "";
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const tiers = await listFlowerTiersAdmin();
  if (tiers === null) {
    return NextResponse.json(
      {
        error: `Could not load flower tiers.${migrationHint("PGRST205")}`,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ tiers });
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const slug =
    typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const price = Number(body.price);
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const cta_label =
    typeof body.cta_label === "string" && body.cta_label.trim()
      ? body.cta_label.trim()
      : "Order for delivery";
  const image_url =
    typeof body.image_url === "string" ? body.image_url.trim() : "";
  const image_alt =
    typeof body.image_alt === "string" ? body.image_alt.trim() : "";
  const image_object_position =
    typeof body.image_object_position === "string" &&
    body.image_object_position.trim()
      ? body.image_object_position.trim()
      : null;
  const is_popular = Boolean(body.is_popular);
  const is_visible = body.is_visible !== false;
  const sort_order =
    body.sort_order != null && !Number.isNaN(Number(body.sort_order))
      ? Number(body.sort_order)
      : 100;

  if (!slug || !SLUG_RE.test(slug)) {
    return NextResponse.json(
      {
        error:
          "Slug is required (lowercase letters, numbers, hyphens — e.g. deluxe).",
      },
      { status: 400 },
    );
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(price)) {
    return NextResponse.json(
      { error: "Price must be a whole number greater than 0." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("flower_tiers")
    .insert({
      slug,
      name,
      price,
      description,
      cta_label,
      image_url,
      image_alt,
      image_object_position,
      is_popular,
      is_visible,
      sort_order,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: `${error.message}${migrationHint(error.message)}` },
      { status: 400 },
    );
  }

  revalidatePath("/flowers");
  revalidatePath("/flowers/order");
  return NextResponse.json({ tier: data });
}
