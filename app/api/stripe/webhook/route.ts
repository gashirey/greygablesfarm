import { NextResponse } from "next/server";
import { fulfillFlowerOrderPayment } from "@/lib/order/fulfill-payment";
import {
  STRIPE_KIND_BLOOMS,
  STRIPE_KIND_FLOWER_ORDER,
} from "@/lib/order/config";
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

    if (kind === STRIPE_KIND_FLOWER_ORDER) {
      const orderId =
        session.metadata?.order_id ?? session.client_reference_id ?? null;
      if (orderId) {
        await fulfillFlowerOrderPayment({
          orderId,
          stripeSessionId: session.id,
          paymentIntentId,
        });
      }
    } else {
      // Blooms (legacy sessions without kind still use booking_id)
      const bookingId =
        session.metadata?.booking_id ??
        (kind === STRIPE_KIND_BLOOMS ? session.client_reference_id : null) ??
        session.client_reference_id ??
        null;

      // Prefer blooms only when not a flower order
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
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
