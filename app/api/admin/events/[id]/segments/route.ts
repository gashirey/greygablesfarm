import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { getFarmEventById } from "@/lib/events/queries";
import type { FarmEventSegmentType } from "@/lib/events/types";
import { createServiceClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

const TYPES = new Set<FarmEventSegmentType>([
  "text",
  "bullets",
  "cta",
  "image",
]);

export async function POST(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id: eventId } = await params;
  const event = await getFarmEventById(eventId);
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const segmentType =
    typeof body.segment_type === "string" &&
    TYPES.has(body.segment_type as FarmEventSegmentType)
      ? (body.segment_type as FarmEventSegmentType)
      : "text";

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("farm_event_segments")
    .insert({
      event_id: eventId,
      segment_type: segmentType,
      title: typeof body.title === "string" ? body.title.trim() || null : null,
      body: typeof body.body === "string" ? body.body : "",
      image_url:
        typeof body.image_url === "string" ? body.image_url.trim() || null : null,
      image_alt:
        typeof body.image_alt === "string" ? body.image_alt.trim() : "",
      sort_order:
        typeof body.sort_order === "number" && Number.isFinite(body.sort_order)
          ? Math.round(body.sort_order)
          : (event.segments.length + 1) * 10,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ segment: data });
}
