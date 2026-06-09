import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { createServiceClient } from "@/lib/supabase/server";
import {
  SITE_MEDIA_SLOT_LABELS,
  SITE_MEDIA_SLOTS,
  type SiteMediaSlotKey,
} from "@/lib/site-media/slots";

function revalidatePublicPages() {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/available-now");
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const body = (await request.json()) as {
    asset_id?: string;
    target?: "site_slot" | "product" | "hero_slide";
    slot_key?: string;
    product_id?: string;
    is_primary?: boolean;
  };

  if (!body.asset_id) {
    return NextResponse.json({ error: "asset_id is required." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: asset, error: assetError } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", body.asset_id)
    .maybeSingle();

  if (assetError || !asset) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  if (body.target === "site_slot") {
    const slotKey = body.slot_key as SiteMediaSlotKey | undefined;
    if (!slotKey || !SITE_MEDIA_SLOTS.includes(slotKey)) {
      return NextResponse.json({ error: "Invalid slot_key." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("site_media_slots")
      .upsert({
        slot_key: slotKey,
        image_url: asset.public_url,
        alt_text: asset.alt_text ?? asset.filename,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      const hint =
        error.code === "PGRST205"
          ? " Run migration 007_site_media_slots.sql in Supabase."
          : "";
      return NextResponse.json(
        { error: `${error.message}${hint}` },
        { status: 400 },
      );
    }

    revalidatePublicPages();

    return NextResponse.json({
      message: `Live site updated: ${SITE_MEDIA_SLOT_LABELS[slotKey]}. Hard-refresh the homepage if you still see the old image.`,
      slot: data,
    });
  }

  if (body.target === "hero_slide") {
    const { data: slide, error } = await supabase
      .from("site_hero_slides")
      .insert({
        image_url: asset.public_url,
        alt_text: asset.alt_text ?? asset.filename,
        display_order: 100,
      })
      .select()
      .single();

    if (error) {
      const hint =
        error.code === "PGRST205"
          ? " Run migration 010_site_hero_slides.sql in Supabase."
          : "";
      return NextResponse.json(
        { error: `${error.message}${hint}` },
        { status: 400 },
      );
    }

    revalidatePublicPages();

    return NextResponse.json({
      message:
        "Added to hero slideshow. Add one more image for a slow crossfade on the homepage.",
      slide,
    });
  }

  if (body.target === "product") {
    if (!body.product_id) {
      return NextResponse.json({ error: "product_id is required." }, { status: 400 });
    }

    const { data: product } = await supabase
      .from("farm_products")
      .select("id, name")
      .eq("id", body.product_id)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const isPrimary = body.is_primary ?? false;

    if (isPrimary) {
      await supabase
        .from("farm_product_photos")
        .update({ is_primary: false })
        .eq("product_id", body.product_id)
        .is("availability_id", null);
    }

    const { count } = await supabase
      .from("farm_product_photos")
      .select("id", { count: "exact", head: true })
      .eq("product_id", body.product_id)
      .is("availability_id", null);

    const { data: photo, error } = await supabase
      .from("farm_product_photos")
      .insert({
        product_id: body.product_id,
        image_url: asset.public_url,
        alt_text: asset.alt_text ?? product.name,
        is_primary: isPrimary || !count,
        display_order: 10,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePublicPages();

    return NextResponse.json({
      message: `Added to ${product.name}. Check Available Now on the site.`,
      photo,
    });
  }

  return NextResponse.json({ error: "Invalid target." }, { status: 400 });
}
