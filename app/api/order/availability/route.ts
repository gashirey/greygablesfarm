import { NextResponse } from "next/server";
import { listAvailability } from "@/lib/order/queries";
import { releaseExpiredReservations } from "@/lib/order/reservations";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Ordering is not configured." },
      { status: 503 },
    );
  }

  // Opportunistic cleanup of expired holds
  try {
    await releaseExpiredReservations();
  } catch {
    /* ignore */
  }

  const url = new URL(request.url);
  const fromDate = url.searchParams.get("from") ?? undefined;
  const days = Number(url.searchParams.get("days") ?? "21");

  const dates = await listAvailability({
    fromDate,
    days: Number.isFinite(days) ? days : 21,
  });

  return NextResponse.json({ dates });
}
