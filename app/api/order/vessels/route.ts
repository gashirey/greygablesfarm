import { NextResponse } from "next/server";
import { listAvailableVessels } from "@/lib/order/queries";
import { formatCents } from "@/lib/order/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Ordering is not configured." },
      { status: 503 },
    );
  }

  const vessels = await listAvailableVessels();
  return NextResponse.json({
    vessels: vessels.map((v) => ({
      ...v,
      adjustmentLabel:
        v.priceAdjustmentCents === 0
          ? "Included"
          : `+${formatCents(v.priceAdjustmentCents)}`,
    })),
  });
}
