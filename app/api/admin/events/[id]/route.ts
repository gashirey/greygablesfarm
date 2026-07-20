import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { eventHasRequiredImages } from "@/lib/events/format";
import { getFarmEventById } from "@/lib/events/queries";
import { isEventSlug, normalizeEventSlug } from "@/lib/events/slug";
import type { FarmEventStatus } from "@/lib/events/types";
import { createServiceClient } from "@/lib/supabase/server";

function revalidateEvents(slug?: string) {
  revalidatePath("/events");
  if (slug) revalidatePath(`/events/${slug}`);
}

type Params = { params: Promise<{ id: string }> };

const STATUSES = new Set<FarmEventStatus>(["draft", "published", "archived"]);

function normalizeHref(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed;
}

export async function GET(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const event = await getFarmEventById(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }
  return NextResponse.json({ event });
}

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const current = await getFarmEventById(id);
  if (!current) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    patch.title = title;
  }

  if (typeof body.slug === "string") {
    const slug = normalizeEventSlug(body.slug);
    if (!slug || !isEventSlug(slug)) {
      return NextResponse.json(
        { error: "Invalid slug." },
        { status: 400 },
      );
    }
    patch.slug = slug;
  }

  if (typeof body.summary === "string") patch.summary = body.summary.trim();
  if (typeof body.eyebrow === "string") {
    patch.eyebrow = body.eyebrow.trim() || null;
  }
  if (typeof body.subtitle === "string") {
    patch.subtitle = body.subtitle.trim() || null;
  }
  if (typeof body.index_image_url === "string") {
    patch.index_image_url = body.index_image_url.trim() || null;
  }
  if (typeof body.index_image_alt === "string") {
    patch.index_image_alt = body.index_image_alt.trim();
  }
  if (typeof body.detail_image_url === "string") {
    patch.detail_image_url = body.detail_image_url.trim() || null;
  }
  if (typeof body.detail_image_alt === "string") {
    patch.detail_image_alt = body.detail_image_alt.trim();
  }
  if (typeof body.cta_label === "string") {
    patch.cta_label = body.cta_label.trim() || null;
  }
  if (body.cta_href !== undefined) {
    const href = normalizeHref(body.cta_href);
    if (href === null && typeof body.cta_href === "string" && body.cta_href.trim()) {
      return NextResponse.json(
        { error: "CTA link must be a site path starting with /." },
        { status: 400 },
      );
    }
    patch.cta_href = href ?? null;
  }
  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) {
    patch.sort_order = Math.round(body.sort_order);
  }
  if (typeof body.status === "string") {
    if (!STATUSES.has(body.status as FarmEventStatus)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    patch.status = body.status;
  }

  const nextStatus = (patch.status as FarmEventStatus | undefined) ?? current.status;
  if (nextStatus === "published") {
    const probe = {
      index_image_url:
        (patch.index_image_url as string | null | undefined) ??
        current.index_image_url,
      detail_image_url:
        (patch.detail_image_url as string | null | undefined) ??
        current.detail_image_url,
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
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const event = await getFarmEventById(id);
  revalidateEvents(event?.slug ?? current.slug);
  return NextResponse.json({ event: event ?? data });
}

export async function DELETE(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const current = await getFarmEventById(id);
  const supabase = createServiceClient();
  const { error } = await supabase.from("farm_events").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  revalidateEvents(current?.slug);
  return NextResponse.json({ ok: true });
}
