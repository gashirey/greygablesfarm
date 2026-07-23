import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { patchOccurrence } from "@/lib/surge/business-api";
import type { OccurrencePatch, OccurrenceStatus } from "@/lib/surge/types";

const OCCURRENCE_STATUSES: OccurrenceStatus[] = [
  "draft",
  "scheduled",
  "open",
  "sold_out",
  "closed",
  "cancelled",
  "completed",
];

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const body = (await request.json()) as OccurrencePatch;

  const patch: OccurrencePatch = {};
  if (typeof body.starts_at === "string") patch.starts_at = body.starts_at;
  if (typeof body.ends_at === "string") patch.ends_at = body.ends_at;
  if (typeof body.capacity === "number") {
    patch.capacity = Math.max(0, Math.round(body.capacity));
  }
  if (body.price_cents_override !== undefined) {
    patch.price_cents_override =
      body.price_cents_override === null
        ? null
        : Math.max(0, Math.round(Number(body.price_cents_override)));
  }
  if (
    typeof body.status === "string" &&
    OCCURRENCE_STATUSES.includes(body.status)
  ) {
    patch.status = body.status;
  }

  const result = await patchOccurrence(id, patch);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, preview: result.preview },
      { status: result.status },
    );
  }

  return NextResponse.json({
    occurrence: result.data.occurrence,
    preview: result.preview,
  });
}
