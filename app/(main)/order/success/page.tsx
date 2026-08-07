import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/Section";
import { site } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { STRIPE_KIND_FLOWER_ORDER } from "@/lib/order/config";
import { fulfillFlowerOrderPayment } from "@/lib/order/fulfill-payment";
import { orderManageUrl } from "@/lib/order/manage-token";
import type { OrderSuccessSummary } from "@/lib/order/order-display";
import { getOrderSuccessSummary } from "@/lib/order/queries";
import { formatCents } from "@/lib/order/types";
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

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-6 text-sm">
      <dt className="text-stone">{label}</dt>
      <dd className="text-right text-bark">{value}</dd>
    </div>
  );
}

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  let manageHref: string | null = null;
  let summary: OrderSuccessSummary | null = null;
  let verifiedPaid = false;

  if (sessionId && isSupabaseConfigured() && isStripeConfigured()) {
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
        verifiedPaid = true;
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
        summary = await getOrderSuccessSummary(orderId);
      }
    } catch (err) {
      console.error("[order/success]", err);
    }
  }

  return (
    <Section density="compact">
      <div className="mx-auto max-w-xl">
        <div className="flex flex-col items-start gap-5">
          <div className="flex h-14 w-14 items-center justify-center border border-parchment bg-cream">
            <Image
              src="/images/placeholders/foliage.svg"
              alt=""
              width={36}
              height={36}
              className="opacity-80"
              aria-hidden
            />
          </div>
          <div>
            <p className="type-eyebrow">Grey Gables Farm</p>
            <h1 className="type-page-title mt-2 leading-tight">
              Your Grey Gables arrangement is confirmed.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-stone">
              We&apos;ve received your order and will begin creating it with
              care.
            </p>
          </div>
        </div>

        {summary ? (
          <section
            className="mt-10 border border-parchment bg-white px-5 py-6"
            aria-labelledby="order-summary-heading"
          >
            <h2
              id="order-summary-heading"
              className="font-serif text-xl text-bark"
            >
              Your Order
            </h2>
            <dl className="mt-5 space-y-3">
              <SummaryRow
                label="Arrangement"
                value={summary.arrangementLabel}
              />
              <SummaryRow
                label="Presentation"
                value={summary.presentationLabel}
              />
              <SummaryRow
                label="Fulfillment"
                value={summary.fulfillmentLabel}
              />
              {summary.deliveryRegionLabel ? (
                <SummaryRow
                  label="Delivery Area"
                  value={summary.deliveryRegionLabel}
                />
              ) : null}
              {summary.fulfillmentDateLabel ? (
                <SummaryRow
                  label="Requested Date"
                  value={summary.fulfillmentDateLabel}
                />
              ) : null}
              {summary.pickupWindowLabel ? (
                <SummaryRow
                  label="Pickup Window"
                  value={summary.pickupWindowLabel}
                />
              ) : null}
              {summary.inTownLocationLabel ? (
                <SummaryRow
                  label="Pickup Location"
                  value={summary.inTownLocationLabel}
                />
              ) : null}
              <div className="border-t border-parchment pt-3">
                <SummaryRow
                  label="Total Paid"
                  value={formatCents(summary.totalCents)}
                />
              </div>
              <SummaryRow label="Order Number" value={summary.displayNumber} />
            </dl>
            {summary.expectedLabel ? (
              <p className="mt-5 border-t border-parchment pt-4 text-sm text-bark">
                {summary.expectedLabel}
              </p>
            ) : null}
          </section>
        ) : verifiedPaid ? (
          <p className="mt-8 text-sm text-stone">
            Your payment was received. A confirmation email with your full order
            details is on its way.
          </p>
        ) : sessionId ? (
          <p className="mt-8 text-sm text-stone">
            We&apos;re confirming your payment. If you don&apos;t receive an
            email shortly, please contact us at{" "}
            <a
              href={`mailto:${site.email}`}
              className="underline underline-offset-2"
            >
              {site.email}
            </a>
            .
          </p>
        ) : null}

        <section className="mt-10" aria-labelledby="next-steps-heading">
          <h2
            id="next-steps-heading"
            className="font-serif text-xl text-bark"
          >
            What happens next
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-stone">
            <li>
              You&apos;ll receive an email confirmation within the next few
              minutes.
            </li>
            <li>
              We&apos;ll contact you again when your arrangement is prepared for
              delivery or pickup.
            </li>
            <li>
              Your confirmation email includes your receipt and complete order
              details.
            </li>
          </ul>
        </section>

        {manageHref ? (
          <section className="mt-10" aria-labelledby="manage-heading">
            <h2 id="manage-heading" className="font-serif text-xl text-bark">
              Need to make a change?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone">
              You can update your enclosure card, delivery instructions, or
              requested delivery date before your arrangement is prepared.
            </p>
            <div className="mt-5">
              <Link
                href={manageHref}
                className="btn border-bark bg-bark text-cream"
              >
                Manage My Order
              </Link>
            </div>
            <p className="mt-3 text-xs text-stone">
              The same link is included in your confirmation email.
            </p>
          </section>
        ) : null}

        <p className="mt-10 text-sm leading-relaxed text-stone">
          Every Grey Gables arrangement is individually designed shortly before
          delivery using the freshest flowers available.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/order" className="btn btn-secondary">
            Create Another Arrangement
          </Link>
          <Link href="/" className="btn btn-secondary">
            Return Home
          </Link>
        </div>
      </div>
    </Section>
  );
}
