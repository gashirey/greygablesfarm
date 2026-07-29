import { site } from "@/lib/content";
import { orderManageUrl } from "@/lib/order/manage-token";
import { formatCents } from "@/lib/order/types";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * SMS-ready notification stub — email only in v1.
 * Later: add sendSms alongside without changing call sites much.
 */
export async function notifyOrderEvent(
  event: "confirmed" | "status_update",
  payload: { orderId: string; channels?: Array<"email" | "sms"> },
): Promise<void> {
  const channels = payload.channels ?? ["email"];
  if (channels.includes("email")) {
    if (event === "confirmed") {
      await sendSsOrderEmails(payload.orderId);
    }
  }
  // SMS intentionally not implemented in v1
}

export async function sendSsOrderEmails(orderId: string): Promise<void> {
  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("ss_orders")
    .select(
      "*, ss_products(name, slug), ss_vessels(name), ss_delivery_zones(name)",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return;

  const product = order.ss_products as { name: string; slug: string } | null;
  const vessel = order.ss_vessels as { name: string } | null;
  const zone = order.ss_delivery_zones as { name: string } | null;

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    `https://${site.domain}`;
  const manageLink = orderManageUrl(origin, order.id);

  const lines = [
    "Grey Gables Farm — Order confirmation",
    "",
    `Order: ${order.id}`,
    `Arrangement: ${product?.name ?? "—"}`,
    vessel ? `Vessel: ${vessel.name}` : null,
    order.presentation ? `Presentation: ${order.presentation}` : null,
    `Fulfillment: ${order.fulfillment_type}`,
    `Date: ${order.fulfillment_date}`,
    zone ? `Delivery zone: ${zone.name}` : null,
    "",
    `Buyer: ${order.buyer_name}`,
    `Email: ${order.buyer_email}`,
    `Phone: ${order.buyer_phone}`,
    order.recipient_name ? `Recipient: ${order.recipient_name}` : null,
    order.address_street
      ? `Address: ${order.address_street}, ${order.address_city}, ${order.address_state} ${order.address_zip}`
      : null,
    order.card_message ? `\nCard message:\n${order.card_message}` : null,
    order.notes ? `\nNotes:\n${order.notes}` : null,
    "",
    `Arrangement: ${formatCents(order.arrangement_cents)}`,
    order.vessel_cents
      ? `Vessel: ${formatCents(order.vessel_cents)}`
      : null,
    order.delivery_fee_cents
      ? `Delivery: ${formatCents(order.delivery_fee_cents)}`
      : null,
    `Total: ${formatCents(order.total_cents)}`,
    `Payment: ${order.payment_status}`,
    `Status: ${order.fulfillment_status}`,
    manageLink ? `\nManage / update this order:\n${manageLink}` : null,
  ].filter(Boolean);

  const text = lines.join("\n");
  const subject = `Order confirmed — ${product?.name ?? "Flowers"} — ${order.fulfillment_date}`;

  await sendResend({
    to: [site.email],
    replyTo: order.buyer_email,
    subject: `[Farm] ${subject}`,
    text,
  });

  await sendResend({
    to: [order.buyer_email],
    subject,
    text: [
      `Thank you, ${order.buyer_name}.`,
      "",
      "Your Grey Gables order is confirmed.",
      "",
      ...lines.slice(2),
      "",
      "Questions? Reply to this email or contact info@greygablesfarm.com.",
    ].join("\n"),
  });
}

async function sendResend(input: {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — ss order email skipped");
    return { sent: false };
  }

  const from =
    process.env.RESEND_FROM?.trim() ||
    `${site.name} <notifications@greygablesfarm.com>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      reply_to: input.replyTo,
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!res.ok) {
    console.error("[email] Resend error", res.status, await res.text());
    return { sent: false };
  }
  return { sent: true };
}
