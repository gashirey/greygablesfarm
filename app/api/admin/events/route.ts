import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { eventHasRequiredImages } from "@/lib/events/format";
import { listFarmEvents } from "@/lib/events/queries";
import { isEventSlug, normalizeEventSlug } from "@/lib/events/slug";
import type { FarmEventStatus } from "@/lib/events/types";
import { createServiceClient } from "@/lib/supabase/server";

const STATUSES = new Set<FarmEventStatus>(["draft", "published", "archived"]);

function normalizeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed;
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const events = await listFarmEvents({ includeDrafts: true });
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const slug = normalizeEventSlug(
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug
      : title,
  );
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const status =
    typeof body.status === "string" && STATUSES.has(body.status as FarmEventStatus)
      ? (body.status as FarmEventStatus)
      : "draft";

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!slug || !isEventSlug(slug)) {
    return NextResponse.json(
      { error: "Slug must be lowercase letters, numbers, hyphens, or underscores." },
      { status: 400 },
    );
  }
  if (status === "published") {
    const probe = {
      index_image_url:
        typeof body.index_image_url === "string" ? body.index_image_url : null,
      detail_image_url:
        typeof body.detail_image_url === "string" ? body.detail_image_url : null,
    };
    if (!eventHasRequiredImages(probe)) {
      return NextResponse.json(
        { error: "Published events need both index and detail images." },
        { status: 400 },
      );
    }
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("farm_events")
    .insert({
      title,
      slug,
      summary,
      status,
      eyebrow:
        typeof body.eyebrow === "string" ? body.eyebrow.trim() || null : null,
      subtitle:
        typeof body.subtitle === "string" ? body.subtitle.trim() || null : null,
      index_image_url:
        typeof body.index_image_url === "string"
          ? body.index_image_url.trim() || null
          : null,
      index_image_alt:
        typeof body.index_image_alt === "string"
          ? body.index_image_alt.trim()
          : "",
      detail_image_url:
        typeof body.detail_image_url === "string"
          ? body.detail_image_url.trim() || null
          : null,
      detail_image_alt:
        typeof body.detail_image_alt === "string"
          ? body.detail_image_alt.trim()
          : "",
      cta_label:
        typeof body.cta_label === "string" ? body.cta_label.trim() || null : null,
      cta_href: normalizeHref(body.cta_href),
      sort_order:
        typeof body.sort_order === "number" && Number.isFinite(body.sort_order)
          ? Math.round(body.sort_order)
          : 100,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    const hint =
      error.code === "PGRST205" || /farm_events|schema cache/i.test(error.message)
        ? " Run migration 024_events.sql in Supabase."
        : "";
    return NextResponse.json(
      { error: `${error.message}${hint}` },
      { status: 400 },
    );
  }

  return NextResponse.json({ event: data });
}
