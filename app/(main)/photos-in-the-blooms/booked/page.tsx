import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { bloomsPackage, bloomsPaths } from "@/lib/blooms/package";
import { pageMetadata } from "@/lib/metadata";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = pageMetadata({
  title: "Booking confirmed",
  description: `Your ${bloomsPackage.title} session request is on its way.`,
  path: bloomsPaths.booked,
});

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function BloomsBookedPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  let paid = false;

  if (sessionId && isStripeConfigured()) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      paid = session.payment_status === "paid";

      if (paid && isSupabaseConfigured()) {
        const bookingId =
          session.metadata?.booking_id ?? session.client_reference_id ?? null;
        if (bookingId) {
          const supabase = createServiceClient();
          await supabase
            .from("blooms_bookings")
            .update({
              payment_status: "paid",
              stripe_session_id: session.id,
              stripe_payment_intent_id:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : session.payment_intent?.id ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", bookingId);
        }
      }
    } catch (err) {
      console.error("[blooms booked] session verify", err);
    }
  }

  return (
    <Section density="compact" className="pt-16 md:pt-24">
      <div className="max-w-xl space-y-4">
        <p className="type-eyebrow">{bloomsPackage.title}</p>
        <h1 className="type-section-title text-2xl md:text-3xl">
          {paid ? "Payment received — thank you" : "Request received"}
        </h1>
        <p className="type-page-body leading-relaxed">
          {paid
            ? "Your Epic Date Night session is booked. We'll email you within 1–2 business days to confirm your session time and share what to expect on the farm."
            : "Thanks for your interest. If you haven't completed payment yet, you can return to the booking page or we'll reach out by email to confirm details."}
        </p>
        <Link
          href={bloomsPaths.page}
          className="btn inline-flex border-bark/25 bg-transparent text-bark hover:border-salmon-dark hover:text-salmon-dark"
        >
          Back to {bloomsPackage.title}
        </Link>
      </div>
    </Section>
  );
}
