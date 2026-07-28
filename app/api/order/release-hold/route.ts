import { NextResponse } from "next/server";
import { releaseReservation } from "@/lib/order/reservations";
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

  const payload = body as Record<string, unknown>;
  const reservationId =
    typeof payload.reservationId === "string"
      ? payload.reservationId.trim()
      : "";

  if (!reservationId) {
    return NextResponse.json(
      { error: "Reservation id is required." },
      { status: 400 },
    );
  }

  await releaseReservation(reservationId);
  return NextResponse.json({ ok: true });
}
