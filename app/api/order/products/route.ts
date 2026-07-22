import { NextResponse } from "next/server";
import { listActiveProducts } from "@/lib/order/queries";
import { formatCents } from "@/lib/order/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Ordering is not configured." },
      { status: 503 },
    );
  }

  const products = await listActiveProducts();
  return NextResponse.json({
    products: products.map((p) => ({
      ...p,
      priceLabel: formatCents(p.basePriceCents),
    })),
  });
}
