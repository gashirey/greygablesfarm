import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { releaseReservation } from "@/lib/order/reservations";
import { pageMetadata } from "@/lib/metadata";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Checkout cancelled",
  description: "Your Grey Gables checkout was cancelled.",
  path: "/order/cancelled",
});

type Props = {
  searchParams: Promise<{ order_id?: string }>;
};

export default async function OrderCancelledPage({ searchParams }: Props) {
  const { order_id: orderId } = await searchParams;

  if (orderId && isSupabaseConfigured()) {
    try {
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
    } catch (err) {
      console.error("[order/cancelled]", err);
    }
  }

  return (
    <Section density="compact">
      <div className="mx-auto max-w-xl">
        <h1 className="type-page-title leading-tight">Checkout cancelled</h1>
        <p className="type-page-body mt-4 leading-relaxed">
          No payment was taken. Your vessel and date hold have been released if
          one was started. You can begin again whenever you&apos;re ready.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/order"
            className="btn border-[var(--color-salmon-button)] bg-[var(--color-salmon-button)] text-white"
          >
            Back to arrangements
          </Link>
          <Link href="/contact" className="btn btn-secondary">
            Contact us
          </Link>
        </div>
      </div>
    </Section>
  );
}
