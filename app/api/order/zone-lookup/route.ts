import { NextResponse } from "next/server";
import { lookupZoneByZip } from "@/lib/order/queries";
import { formatCents } from "@/lib/order/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Ordering is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const zip =
    typeof (body as { zip?: unknown }).zip === "string"
      ? (body as { zip: string }).zip.trim()
      : "";

  if (!/^\d{5}(-\d{4})?$/.test(zip)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid 5-digit ZIP code." },
      { status: 400 },
    );
  }

  const result = await lookupZoneByZip(zip);
  if (!result) {
    return NextResponse.json({
      ok: false,
      inZone: false,
      message:
        "We don't deliver to that ZIP online yet. Please contact us — we can often make it work for custom orders.",
    });
  }

  return NextResponse.json({
    ok: true,
    inZone: true,
    zip: result.zip,
    zone: {
      id: result.zone.id,
      name: result.zone.name,
      feeCents: result.zone.feeCents,
      feeLabel: formatCents(result.zone.feeCents),
    },
  });
}
