import { NextResponse } from "next/server";
import { site } from "@/lib/content";
import {
  RESERVATION_MINUTES,
  SMOKE_CHECKOUT_AMOUNTS_CENTS,
  STRIPE_KIND_SMOKE,
} from "@/lib/order/config";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return `https://${site.domain}`;
}

function smokeSecret(): string {
  return process.env.SMOKE_ORDER_SECRET?.trim() || "";
}

function authorize(request: Request, bodySecret?: string): boolean {
  const expected = smokeSecret();
  if (!expected) return false;
  const header = request.headers.get("x-smoke-secret")?.trim();
  return header === expected || bodySecret === expected;
}

/**
 * Secret-gated $5 / $7 Checkout Session for verifying Live Stripe + webhooks.
 * Does not create a flower order. Disable by removing SMOKE_ORDER_SECRET.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  if (!smokeSecret()) {
    return NextResponse.json(
      {
        error:
          "Smoke checkout is disabled. Set SMOKE_ORDER_SECRET on the server to enable.",
      },
      { status: 503 },
    );
  }

  let body: { secret?: string; amountCents?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  if (!authorize(request, body.secret?.trim())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const amountCents = Number(body.amountCents ?? 500);
  if (
    !(SMOKE_CHECKOUT_AMOUNTS_CENTS as readonly number[]).includes(amountCents)
  ) {
    return NextResponse.json(
      { error: "Amount must be $5 (500) or $7 (700)." },
      { status: 400 },
    );
  }

  const origin = siteOrigin(request);
  const stripe = getStripe();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_intent_data: {
        description: "Grey Gables smoke test payment",
        metadata: {
          kind: STRIPE_KIND_SMOKE,
          tenant: "grey_gables_farm",
        },
      },
      metadata: {
        kind: STRIPE_KIND_SMOKE,
        tenant: "grey_gables_farm",
        purpose: "live_stripe_smoke_test",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: "Grey Gables — Stripe smoke test",
              description:
                "Temporary verification charge. Not a floral arrangement.",
            },
          },
        },
      ],
      success_url: `${origin}/order/smoke?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/order/smoke?cancelled=1`,
      expires_at:
        Math.floor(Date.now() / 1000) +
        Math.max(30, RESERVATION_MINUTES) * 60,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "No checkout URL returned." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      amountCents,
    });
  } catch (err) {
    console.error("[smoke-checkout]", err);
    return NextResponse.json(
      { error: "Could not start smoke checkout." },
      { status: 500 },
    );
  }
}
