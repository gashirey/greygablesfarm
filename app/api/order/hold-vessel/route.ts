import { NextResponse } from "next/server";
import { getProductBySlug, getVesselById } from "@/lib/order/queries";
import {
  createVesselHold,
  releaseExpiredReservations,
  releaseReservation,
} from "@/lib/order/reservations";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Ordering is not configured." },
      { status: 503 },
    );
  }

  await releaseExpiredReservations();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const productSlug =
    typeof payload.productSlug === "string" ? payload.productSlug.trim() : "";
  const vesselId =
    typeof payload.vesselId === "string" ? payload.vesselId.trim() : "";
  const previousReservationId =
    typeof payload.previousReservationId === "string"
      ? payload.previousReservationId.trim()
      : null;

  if (!productSlug || !vesselId) {
    return NextResponse.json(
      { error: "Product and vessel are required." },
      { status: 400 },
    );
  }

  const product = await getProductBySlug(productSlug);
  if (!product) {
    return NextResponse.json(
      { error: "Product is not available." },
      { status: 404 },
    );
  }

  const vessel = await getVesselById(vesselId);
  if (!vessel) {
    return NextResponse.json(
      { error: "That vessel is no longer available." },
      { status: 409 },
    );
  }

  if (previousReservationId) {
    await releaseReservation(previousReservationId);
  }

  const hold = await createVesselHold({
    productId: product.id,
    vesselId,
  });

  if (!hold.ok) {
    return NextResponse.json({ error: hold.error }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    reservationId: hold.reservationId,
    expiresAt: hold.expiresAt,
    oneOfAKind: vessel.qtyOnHand === 1,
  });
}
