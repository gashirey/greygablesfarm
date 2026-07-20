import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import type { FarmEventSegmentType } from "@/lib/events/types";
import { createServiceClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string; segmentId: string }> };

const TYPES = new Set<FarmEventSegmentType>([
  "text",
  "bullets",
  "cta",
  "image",
]);

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id: eventId, segmentId } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.segment_type === "string") {
    if (!TYPES.has(body.segment_type as FarmEventSegmentType)) {
      return NextResponse.json({ error: "Invalid segment type." }, { status: 400 });
    }
    patch.segment_type = body.segment_type;
  }
  if (typeof body.title === "string") {
    patch.title = body.title.trim() || null;
  }
  if (typeof body.body === "string") patch.body = body.body;
  if (typeof body.image_url === "string") {
    patch.image_url = body.image_url.trim() || null;
  }
  if (typeof body.image_alt === "string") {
    patch.image_alt = body.image_alt.trim();
  }
  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) {
    patch.sort_order = Math.round(body.sort_order);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("farm_event_segments")
    .update(patch)
    .eq("id", segmentId)
    .eq("event_id", eventId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ segment: data });
}

export async function DELETE(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id: eventId, segmentId } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("farm_event_segments")
    .delete()
    .eq("id", segmentId)
    .eq("event_id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
