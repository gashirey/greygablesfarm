import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/admin/require";
import { createServiceClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const BUCKET = "product-photos";
const DEFAULT_LIMIT = 40;

/**
 * Backfill width/height for media_assets missing dimensions.
 * Reads files from Storage (already EXIF-rotated at upload).
 */
export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const shootId =
    typeof body.shoot_id === "string" && body.shoot_id ? body.shoot_id : null;
  const limit =
    typeof body.limit === "number" && body.limit > 0
      ? Math.min(Math.floor(body.limit), 80)
      : DEFAULT_LIMIT;

  // Client-probed dimensions: [{ id, width, height }]
  const probed = Array.isArray(body.assets) ? body.assets : null;
  if (probed) {
    return saveProbedDimensions(probed);
  }

  const supabase = createServiceClient();
  let query = supabase
    .from("media_assets")
    .select("id, storage_path, width, height")
    .is("width", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (shootId) {
    query = query.eq("shoot_id", shootId);
  }

  const { data: rows, error } = await query;
  if (error) {
    const hint = /width|column/i.test(error.message)
      ? " Run migration 020_media_asset_dimensions.sql in Supabase."
      : "";
    return NextResponse.json(
      { error: `${error.message}.${hint}` },
      { status: 400 },
    );
  }

  let updated = 0;
  const failures: { id: string; error: string }[] = [];

  for (const row of rows ?? []) {
    const { data: file, error: dlError } = await supabase.storage
      .from(BUCKET)
      .download(row.storage_path);

    if (dlError || !file) {
      failures.push({
        id: row.id,
        error: dlError?.message ?? "Download failed.",
      });
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const meta = await sharp(buffer).rotate().metadata();
      const width = meta.width ?? null;
      const height = meta.height ?? null;
      if (!width || !height) {
        failures.push({ id: row.id, error: "No dimensions in file." });
        continue;
      }

      const { error: upError } = await supabase
        .from("media_assets")
        .update({ width, height })
        .eq("id", row.id);

      if (upError) {
        failures.push({ id: row.id, error: upError.message });
        continue;
      }
      updated += 1;
    } catch (err) {
      failures.push({
        id: row.id,
        error: err instanceof Error ? err.message : "Sharp failed.",
      });
    }
  }

  return NextResponse.json({
    updated,
    remaining: Math.max(0, (rows?.length ?? 0) - updated),
    failures,
    message:
      updated > 0
        ? `Saved dimensions for ${updated} image(s).`
        : rows?.length
          ? "Could not read dimensions for these files."
          : "All images in this shoot already have dimensions.",
  });
}

async function saveProbedDimensions(
  assets: unknown[],
): Promise<NextResponse> {
  const supabase = createServiceClient();
  let updated = 0;
  const failures: { id: string; error: string }[] = [];

  for (const item of assets) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    const width = typeof row.width === "number" ? Math.round(row.width) : 0;
    const height = typeof row.height === "number" ? Math.round(row.height) : 0;
    if (!id || width <= 0 || height <= 0) continue;

    const { error } = await supabase
      .from("media_assets")
      .update({ width, height })
      .eq("id", id);

    if (error) {
      failures.push({ id, error: error.message });
      continue;
    }
    updated += 1;
  }

  return NextResponse.json({
    updated,
    failures,
    message: `Saved dimensions for ${updated} image(s).`,
  });
}
