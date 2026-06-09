import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { uploadImageToStorage } from "@/lib/admin/storage-upload";
import { createServiceClient } from "@/lib/supabase/server";
import {
  SITE_MEDIA_SLOTS,
  type SiteMediaSlotKey,
} from "@/lib/site-media/slots";

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const formData = await request.formData();
  const file = formData.get("file");
  const slotKey = formData.get("slot_key") as SiteMediaSlotKey | null;
  const altText = formData.get("alt_text");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (!slotKey || !SITE_MEDIA_SLOTS.includes(slotKey)) {
    return NextResponse.json({ error: "Invalid slot_key." }, { status: 400 });
  }

  const uploaded = await uploadImageToStorage(file, `site/${slotKey}`);
  if ("error" in uploaded) {
    return NextResponse.json({ error: uploaded.error }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("site_media_slots")
    .upsert({
      slot_key: slotKey,
      image_url: uploaded.imageUrl,
      alt_text:
        typeof altText === "string" && altText.trim()
          ? altText.trim()
          : file.name.replace(/\.[^.]+$/, ""),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[site-media upload]", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");

  return NextResponse.json({
    path: uploaded.path,
    imageUrl: uploaded.imageUrl,
    slot: data,
  });
}
