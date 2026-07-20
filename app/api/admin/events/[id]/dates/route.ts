import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { getFarmEventById } from "@/lib/events/queries";
import { createServiceClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

function parseDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

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

  const startsOn = parseDate(body.starts_on);
  if (!startsOn) {
    return NextResponse.json(
      { error: "starts_on must be YYYY-MM-DD." },
      { status: 400 },
    );
  }
  const endsOn = body.ends_on == null || body.ends_on === ""
    ? null
    : parseDate(body.ends_on);
  if (body.ends_on && !endsOn) {
    return NextResponse.json(
      { error: "ends_on must be YYYY-MM-DD or empty." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("farm_event_dates")
    .insert({
      event_id: eventId,
      starts_on: startsOn,
      ends_on: endsOn,
      time_note:
        typeof body.time_note === "string" ? body.time_note.trim() || null : null,
      label: typeof body.label === "string" ? body.label.trim() || null : null,
      is_cancelled: body.is_cancelled === true,
      sort_order:
        typeof body.sort_order === "number" && Number.isFinite(body.sort_order)
          ? Math.round(body.sort_order)
          : (event.dates.length + 1) * 10,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ date: data });
}
