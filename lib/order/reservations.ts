import { createServiceClient } from "@/lib/supabase/server";
import { RESERVATION_MINUTES } from "./config";
import {
  getCapacityUsed,
  getFulfillmentDate,
  getPickupWindowBooked,
  getPickupWindowById,
  getProductById,
  getVesselById,
} from "./queries";

export type CreateReservationInput = {
  productId: string;
  vesselId?: string | null;
  fulfillmentDate: string;
  pickupWindowId?: string | null;
  orderId?: string | null;
  /** Existing vessel-only hold to upgrade instead of creating a new row. */
  reservationId?: string | null;
};

export type ReservationResult =
  | { ok: true; reservationId: string; expiresAt: string }
  | { ok: false; error: string };

async function decrementVesselQty(vesselId: string): Promise<ReservationResult | null> {
  const supabase = createServiceClient();
  const { data: vesselRow, error: vErr } = await supabase
    .from("ss_vessels")
    .select("qty_on_hand")
    .eq("id", vesselId)
    .single();
  if (vErr || !vesselRow || vesselRow.qty_on_hand < 1) {
    return { ok: false, error: "That vessel is no longer available." };
  }
  const { data: updated, error: decErr } = await supabase
    .from("ss_vessels")
    .update({
      qty_on_hand: vesselRow.qty_on_hand - 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vesselId)
    .eq("qty_on_hand", vesselRow.qty_on_hand)
    .select("id")
    .maybeSingle();
  if (decErr || !updated) {
    return {
      ok: false,
      error: "That vessel was just reserved. Please choose another.",
    };
  }
  return null;
}

/**
 * Hold a vessel before fulfillment details are known (no date capacity yet).
 */
export async function createVesselHold(input: {
  productId: string;
  vesselId: string;
}): Promise<ReservationResult> {
  const supabase = createServiceClient();
  const product = await getProductById(input.productId);
  if (!product || !product.isActive) {
    return { ok: false, error: "Product is not available." };
  }
  if (!product.requiresVessel) {
    return { ok: false, error: "This arrangement does not use a vessel." };
  }

  const vessel = await getVesselById(input.vesselId);
  if (!vessel || !vessel.isActive || vessel.qtyOnHand < 1) {
    return { ok: false, error: "That vessel is no longer available." };
  }

  const dec = await decrementVesselQty(input.vesselId);
  if (dec) return dec;

  const expiresAt = new Date(
    Date.now() + RESERVATION_MINUTES * 60 * 1000,
  ).toISOString();

  const { data: reservation, error } = await supabase
    .from("ss_reservations")
    .insert({
      product_id: input.productId,
      vessel_id: input.vesselId,
      fulfillment_date: null,
      pickup_window_id: null,
      capacity_cost: 0,
      order_id: null,
      status: "held",
      expires_at: expiresAt,
    })
    .select("id, expires_at")
    .single();

  if (error || !reservation) {
    await restoreVesselQty(input.vesselId, 1);
    console.error("[reservation] vessel hold", error);
    return { ok: false, error: "Could not hold that vessel. Please try again." };
  }

  return {
    ok: true,
    reservationId: reservation.id,
    expiresAt: reservation.expires_at,
  };
}

/**
 * Hold vessel qty + date capacity for RESERVATION_MINUTES.
 * Vessel qty is decremented on hold and restored on release;
 * capacity is tracked via reservation rows (not a column).
 * If reservationId points at a valid vessel-only hold, upgrade it instead.
 */
export async function createReservation(
  input: CreateReservationInput,
): Promise<ReservationResult> {
  const supabase = createServiceClient();
  const product = await getProductById(input.productId);
  if (!product || !product.isActive) {
    return { ok: false, error: "Product is not available." };
  }

  if (product.requiresVessel) {
    if (!input.vesselId) {
      return { ok: false, error: "Please select a vessel." };
    }
  }

  const day = await getFulfillmentDate(input.fulfillmentDate);
  if (!day) {
    return { ok: false, error: "That date is not available." };
  }
  const used = await getCapacityUsed(input.fulfillmentDate);
  if (used + product.capacityCost > day.maxCapacity) {
    return { ok: false, error: "That date is fully booked." };
  }

  if (input.pickupWindowId) {
    const window = await getPickupWindowById(input.pickupWindowId);
    if (!window || window.fulfillmentDate !== input.fulfillmentDate) {
      return { ok: false, error: "That pickup window is not available." };
    }
    const booked = await getPickupWindowBooked(input.pickupWindowId);
    if (booked >= window.capacity) {
      return { ok: false, error: "That pickup window is full." };
    }
  }

  const now = new Date().toISOString();
  if (input.reservationId) {
    const { data: existing } = await supabase
      .from("ss_reservations")
      .select("*")
      .eq("id", input.reservationId)
      .eq("status", "held")
      .maybeSingle();

    if (existing && existing.expires_at >= now) {
      const matches =
        existing.product_id === input.productId &&
        (existing.vessel_id ?? null) === (input.vesselId ?? null);

      if (matches) {
        const expiresAt = new Date(
          Date.now() + RESERVATION_MINUTES * 60 * 1000,
        ).toISOString();
        const { data: upgraded, error: upErr } = await supabase
          .from("ss_reservations")
          .update({
            fulfillment_date: input.fulfillmentDate,
            pickup_window_id: input.pickupWindowId ?? null,
            capacity_cost: product.capacityCost,
            order_id: input.orderId ?? null,
            expires_at: expiresAt,
          })
          .eq("id", existing.id)
          .eq("status", "held")
          .select("id, expires_at")
          .maybeSingle();

        if (!upErr && upgraded) {
          return {
            ok: true,
            reservationId: upgraded.id,
            expiresAt: upgraded.expires_at,
          };
        }
        return {
          ok: false,
          error: "Could not reserve inventory. Please try again.",
        };
      }

      // Different vessel on this hold — free it before creating a new one
      await releaseReservation(existing.id);
    }
  }

  if (product.requiresVessel && input.vesselId) {
    const vessel = await getVesselById(input.vesselId);
    if (!vessel || !vessel.isActive || vessel.qtyOnHand < 1) {
      return { ok: false, error: "That vessel is no longer available." };
    }
    const dec = await decrementVesselQty(input.vesselId);
    if (dec) return dec;
  }

  const expiresAt = new Date(
    Date.now() + RESERVATION_MINUTES * 60 * 1000,
  ).toISOString();

  const { data: reservation, error } = await supabase
    .from("ss_reservations")
    .insert({
      product_id: input.productId,
      vessel_id: input.vesselId ?? null,
      fulfillment_date: input.fulfillmentDate,
      pickup_window_id: input.pickupWindowId ?? null,
      capacity_cost: product.capacityCost,
      order_id: input.orderId ?? null,
      status: "held",
      expires_at: expiresAt,
    })
    .select("id, expires_at")
    .single();

  if (error || !reservation) {
    if (product.requiresVessel && input.vesselId) {
      await restoreVesselQty(input.vesselId, 1);
    }
    console.error("[reservation] insert", error);
    return { ok: false, error: "Could not reserve inventory. Please try again." };
  }

  return {
    ok: true,
    reservationId: reservation.id,
    expiresAt: reservation.expires_at,
  };
}

async function restoreVesselQty(vesselId: string, qty: number) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("ss_vessels")
    .select("qty_on_hand")
    .eq("id", vesselId)
    .single();
  if (!data) return;
  await supabase
    .from("ss_vessels")
    .update({
      qty_on_hand: data.qty_on_hand + qty,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vesselId);
}

export async function commitReservation(reservationId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ss_reservations")
    .update({
      status: "committed",
      committed_at: new Date().toISOString(),
    })
    .eq("id", reservationId)
    .eq("status", "held")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[reservation] commit", error);
    return false;
  }
  // Already committed is OK (idempotent webhook)
  if (!data) {
    const { data: existing } = await supabase
      .from("ss_reservations")
      .select("status")
      .eq("id", reservationId)
      .maybeSingle();
    return existing?.status === "committed";
  }
  return true;
}

export async function releaseReservation(reservationId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data: row } = await supabase
    .from("ss_reservations")
    .select("*")
    .eq("id", reservationId)
    .maybeSingle();

  if (!row) return false;
  if (row.status === "released") return true;
  if (row.status === "committed") return false;

  const { error } = await supabase
    .from("ss_reservations")
    .update({
      status: "released",
      released_at: new Date().toISOString(),
    })
    .eq("id", reservationId)
    .eq("status", "held");

  if (error) {
    console.error("[reservation] release", error);
    return false;
  }

  if (row.vessel_id) {
    await restoreVesselQty(row.vessel_id, 1);
  }
  return true;
}

/** Release all expired holds. Safe to call repeatedly. */
export async function releaseExpiredReservations(): Promise<number> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const { data: expired } = await supabase
    .from("ss_reservations")
    .select("id")
    .eq("status", "held")
    .lt("expires_at", now);

  let count = 0;
  for (const row of expired ?? []) {
    const ok = await releaseReservation(row.id);
    if (ok) count += 1;
  }
  return count;
}
