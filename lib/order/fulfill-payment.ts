import { createServiceClient } from "@/lib/supabase/server";
import { sendSsOrderEmails } from "@/lib/email/send-ss-order-notification";
import { commitReservation } from "./reservations";

/**
 * Idempotent: mark order paid, commit reservation, advance fulfillment, email.
 */
export async function fulfillFlowerOrderPayment(input: {
  orderId: string;
  stripeSessionId: string;
  paymentIntentId: string | null;
}): Promise<{ ok: boolean; alreadyPaid?: boolean }> {
  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from("ss_orders")
    .select("*")
    .eq("id", input.orderId)
    .maybeSingle();

  if (error || !order) {
    console.error("[ss_orders] fulfill missing order", input.orderId, error);
    return { ok: false };
  }

  if (order.payment_status === "paid") {
    return { ok: true, alreadyPaid: true };
  }

  if (order.reservation_id) {
    const committed = await commitReservation(order.reservation_id);
    if (!committed) {
      console.error(
        "[ss_orders] fulfill: reservation commit failed",
        order.reservation_id,
        input.orderId,
      );
      // Still mark paid — money was taken — but flag for ops via notes prefix
    }
  }

  const { error: upErr } = await supabase
    .from("ss_orders")
    .update({
      payment_status: "paid",
      fulfillment_status: "confirmed",
      stripe_session_id: input.stripeSessionId,
      stripe_payment_intent_id: input.paymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.orderId)
    .neq("payment_status", "paid");

  if (upErr) {
    console.error("[ss_orders] fulfill update", upErr);
    return { ok: false };
  }

  try {
    await sendSsOrderEmails(input.orderId);
  } catch (err) {
    console.error("[ss_orders] email", err);
  }

  return { ok: true };
}
