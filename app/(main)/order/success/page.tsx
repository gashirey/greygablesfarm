import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { fulfillFlowerOrderPayment } from "@/lib/order/fulfill-payment";
import { STRIPE_KIND_FLOWER_ORDER } from "@/lib/order/config";
import { orderManageUrl } from "@/lib/order/manage-token";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/content";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Order confirmed",
  description: "Your Grey Gables flower order is confirmed.",
  path: "/order/success",
});

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  let manageHref: string | null = null;

  if (
    sessionId &&
    isSupabaseConfigured() &&
    isStripeConfigured()
  ) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const orderId =
        session.metadata?.order_id ?? session.client_reference_id ?? null;
      if (
        orderId &&
        session.payment_status === "paid" &&
        session.metadata?.kind === STRIPE_KIND_FLOWER_ORDER
      ) {
        const pi =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;
        await fulfillFlowerOrderPayment({
          orderId,
          stripeSessionId: session.id,
          paymentIntentId: pi,
        });
        const origin =
          process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
          `https://${site.domain}`;
        manageHref = orderManageUrl(origin, orderId);
      }
    } catch (err) {
      console.error("[order/success]", err);
    }
  }

  return (
    <Section density="compact">
      <div className="mx-auto max-w-xl">
        <h1 className="type-page-title leading-tight">Thank you</h1>
        <p className="type-page-body mt-4 leading-relaxed">
          Your order is confirmed. We&apos;ll be in touch by email with any
          fulfillment details. A receipt is available from Stripe as well.
        </p>
        {manageHref ? (
          <p className="mt-4 text-sm text-stone">
            Need to update a card message, delivery note, or date?{" "}
            <Link
              href={manageHref}
              className="underline underline-offset-2 text-bark"
            >
              Manage your order
            </Link>
            . The same link is in your confirmation email.
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          {manageHref ? (
            <Link
              href={manageHref}
              className="btn border-[var(--color-salmon-button)] bg-[var(--color-salmon-button)] text-white"
            >
              Manage order
            </Link>
          ) : null}
          <Link
            href="/order"
            className={
              manageHref
                ? "btn btn-secondary"
                : "btn border-[var(--color-salmon-button)] bg-[var(--color-salmon-button)] text-white"
            }
          >
            Order again
          </Link>
          <Link href="/" className="btn btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </Section>
  );
}
