import { NextResponse } from "next/server";
import { fulfillFlowerOrderPayment } from "@/lib/order/fulfill-payment";
import {
  STRIPE_KIND_BLOOMS,
  STRIPE_KIND_FLOWER_ORDER,
  STRIPE_KIND_SMOKE,
} from "@/lib/order/config";
import { releaseReservation } from "@/lib/order/reservations";
import { getStripeWebhookSecret } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ received: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const kind = session.metadata?.kind ?? null;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    if (kind === STRIPE_KIND_SMOKE) {
      console.info(
        "[stripe webhook] smoke_checkout paid",
        session.id,
        session.amount_total,
      );
      return NextResponse.json({ received: true, smoke: true });
    }

    if (kind === STRIPE_KIND_FLOWER_ORDER) {
      const orderId =
        session.metadata?.order_id ?? session.client_reference_id ?? null;
      if (!orderId) {
        console.error("[stripe webhook] flower_order missing order_id");
        return NextResponse.json({ error: "Missing order_id." }, { status: 500 });
      }

      // Amount check when tax is off (tax-enabled totals can exceed our pre-tax total)
      const supabase = createServiceClient();
      const { data: orderRow } = await supabase
        .from("ss_orders")
        .select("total_cents, payment_status")
        .eq("id", orderId)
        .maybeSingle();

      if (
        orderRow &&
        orderRow.payment_status !== "paid" &&
        typeof session.amount_total === "number" &&
        session.amount_total > 0 &&
        !session.automatic_tax?.enabled &&
        session.amount_total !== orderRow.total_cents
      ) {
        console.error(
          "[stripe webhook] amount mismatch",
          orderId,
          session.amount_total,
          orderRow.total_cents,
        );
        return NextResponse.json({ error: "Amount mismatch." }, { status: 500 });
      }

      const result = await fulfillFlowerOrderPayment({
        orderId,
        stripeSessionId: session.id,
        paymentIntentId,
      });
      if (!result.ok) {
        console.error("[stripe webhook] fulfill failed", orderId);
        return NextResponse.json({ error: "Fulfill failed." }, { status: 500 });
      }
    } else {
      // Blooms (legacy sessions without kind still use booking_id)
      const bookingId =
        session.metadata?.booking_id ??
        (kind === STRIPE_KIND_BLOOMS ? session.client_reference_id : null) ??
        session.client_reference_id ??
        null;

      if (bookingId && kind !== STRIPE_KIND_FLOWER_ORDER) {
        const supabase = createServiceClient();
        const { error } = await supabase
          .from("blooms_bookings")
          .update({
            payment_status: "paid",
            stripe_session_id: session.id,
            stripe_payment_intent_id: paymentIntentId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId);

        if (error) {
          console.error("[stripe webhook] update booking", error);
          return NextResponse.json({ error: "Booking update failed." }, { status: 500 });
        }
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    if (session.metadata?.kind === STRIPE_KIND_FLOWER_ORDER) {
      const orderId =
        session.metadata?.order_id ?? session.client_reference_id ?? null;
      if (orderId) {
        const supabase = createServiceClient();
        const { data: order } = await supabase
          .from("ss_orders")
          .select("id, reservation_id, payment_status")
          .eq("id", orderId)
          .maybeSingle();

        if (order && order.payment_status === "pending") {
          if (order.reservation_id) {
            await releaseReservation(order.reservation_id);
          }
          await supabase
            .from("ss_orders")
            .update({
              payment_status: "cancelled",
              fulfillment_status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId)
            .eq("payment_status", "pending");
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
