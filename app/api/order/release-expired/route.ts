import { NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/order/reservations";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Cron / manual sweep for expired vessel+capacity holds.
 * Protect with CRON_SECRET when called from Vercel Cron.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const released = await releaseExpiredReservations();
  return NextResponse.json({ ok: true, released });
}

export async function GET(request: Request) {
  return POST(request);
}
