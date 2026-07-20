import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { createServiceClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string; dateId: string }> };

function parseDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id: eventId, dateId } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.starts_on !== undefined) {
    const startsOn = parseDate(body.starts_on);
    if (!startsOn) {
      return NextResponse.json(
        { error: "starts_on must be YYYY-MM-DD." },
        { status: 400 },
      );
    }
    patch.starts_on = startsOn;
  }
  if (body.ends_on !== undefined) {
    if (body.ends_on === null || body.ends_on === "") {
      patch.ends_on = null;
    } else {
      const endsOn = parseDate(body.ends_on);
      if (!endsOn) {
        return NextResponse.json(
          { error: "ends_on must be YYYY-MM-DD or empty." },
          { status: 400 },
        );
      }
      patch.ends_on = endsOn;
    }
  }
  if (typeof body.time_note === "string") {
    patch.time_note = body.time_note.trim() || null;
  }
  if (typeof body.label === "string") {
    patch.label = body.label.trim() || null;
  }
  if (typeof body.is_cancelled === "boolean") {
    patch.is_cancelled = body.is_cancelled;
  }
  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) {
    patch.sort_order = Math.round(body.sort_order);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("farm_event_dates")
    .update(patch)
    .eq("id", dateId)
    .eq("event_id", eventId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ date: data });
}

export async function DELETE(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id: eventId, dateId } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("farm_event_dates")
    .delete()
    .eq("id", dateId)
    .eq("event_id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
