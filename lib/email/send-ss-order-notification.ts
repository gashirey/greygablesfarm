import { site } from "@/lib/content";
import { getFarmNotifyEmails, getFarmNotifyPhones } from "@/lib/notify/farm-recipients";
import { orderManageUrl } from "@/lib/order/manage-token";
import { formatCents } from "@/lib/order/types";
import { sendTwilioSmsMany } from "@/lib/sms/send-twilio";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Farm + buyer notifications for paid self-service orders.
 * Email → ORDER_NOTIFY_EMAILS (you + Andrea) and buyer.
 * SMS → ORDER_NOTIFY_PHONES when Twilio is configured.
 */
export async function notifyOrderEvent(
  event: "confirmed" | "status_update",
  payload: { orderId: string; channels?: Array<"email" | "sms"> },
): Promise<void> {
  const channels = payload.channels ?? ["email", "sms"];
  if (event !== "confirmed") return;

  if (channels.includes("email") || channels.includes("sms")) {
    await sendSsOrderNotifications(payload.orderId, { channels });
  }
}

export async function sendSsOrderEmails(orderId: string): Promise<void> {
  await sendSsOrderNotifications(orderId, { channels: ["email", "sms"] });
}

export async function sendSsOrderNotifications(
  orderId: string,
  options?: { channels?: Array<"email" | "sms"> },
): Promise<void> {
  const channels = options?.channels ?? ["email", "sms"];
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
  const zoneName =
    zone?.name ||
    (typeof order.delivery_zone_name === "string"
      ? order.delivery_zone_name
      : null);

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    `https://${site.domain}`;
  const manageLink = orderManageUrl(origin, order.id);
  const adminOrdersUrl = `${origin}/admin/order/orders`;

  const lines = [
    "Grey Gables Farm — Order confirmation",
    "",
    `Order: ${order.id}`,
    `Arrangement: ${product?.name ?? "—"}`,
    vessel ? `Vessel: ${vessel.name}` : null,
    order.presentation ? `Presentation: ${order.presentation}` : null,
    `Fulfillment: ${
      order.fulfillment_type === "in_town_pickup"
        ? "In Town Pickup"
        : order.fulfillment_type === "pickup"
          ? "Farm Pickup"
          : order.fulfillment_type
    }`,
    `Date: ${order.fulfillment_date}`,
    zoneName ? `Delivery zone: ${zoneName}` : null,
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
    `\nFarm orders admin:\n${adminOrdersUrl}`,
  ].filter(Boolean);

  const text = lines.join("\n");
  const subject = `Order confirmed — ${product?.name ?? "Flowers"} — ${order.fulfillment_date}`;

  if (channels.includes("email")) {
    const farmTo = getFarmNotifyEmails();
    await sendResend({
      to: farmTo,
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
        ...lines.slice(2).filter((line) => {
          if (typeof line !== "string") return false;
          return !line.includes("Farm orders admin");
        }),
        "",
        "Questions? Reply to this email or contact info@greygablesfarm.com.",
      ].join("\n"),
    });
  }

  if (channels.includes("sms")) {
    const phones = getFarmNotifyPhones();
    if (phones.length) {
      const fulfillLabel =
        order.fulfillment_type === "pickup"
          ? "farm pickup"
          : order.fulfillment_type === "in_town_pickup"
            ? "in-town pickup"
            : "delivery";
      const smsBody = [
        `Grey Gables order paid: ${product?.name ?? "Arrangement"} ${formatCents(order.total_cents)}`,
        `${fulfillLabel} ${order.fulfillment_date}`,
        `Buyer ${order.buyer_name} ${order.buyer_phone}`,
        adminOrdersUrl,
      ].join(" · ");

      const sms = await sendTwilioSmsMany({ to: phones, body: smsBody });
      if (sms.skipped) {
        console.warn(
          "[sms] ORDER_NOTIFY_PHONES set but Twilio env missing — SMS skipped",
        );
      } else {
        console.info(
          `[sms] farm order alerts sent=${sms.sent} failed=${sms.failed}`,
        );
      }
    }
  }
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

  const to = [...new Set(input.to.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (!to.length) {
    console.warn("[email] no farm/buyer recipients");
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
      to,
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
