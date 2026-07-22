import { site } from "@/lib/content";
import { getFlowerTier } from "@/lib/flowers/tiers";
import type { FlowerOrderPayload } from "@/lib/flowers/types";

function formatFlowerOrderEmail(payload: FlowerOrderPayload): {
  subject: string;
  text: string;
} {
  const tier = getFlowerTier(payload.tier);

  const lines = [
    "New Designer's Choice flower order",
    "",
    `Tier: ${tier.name} (${tier.priceLabel})`,
    `Delivery date: ${payload.deliveryDate}`,
    "",
    "Sender",
    `  Name: ${payload.senderName}`,
    `  Email: ${payload.senderEmail}`,
    `  Phone: ${payload.senderPhone}`,
    "",
    "Recipient",
    `  Name: ${payload.recipientName}`,
    `  Phone: ${payload.recipientPhone}`,
    `  Address: ${payload.addressStreet}`,
    `  ${payload.addressCity}, ${payload.addressZip}`,
    payload.cardMessage ? `\nCard message:\n${payload.cardMessage}` : null,
    payload.notes ? `\nNotes:\n${payload.notes}` : null,
    "",
    "Status: new — confirm and send Stripe payment link.",
  ].filter(Boolean);

  return {
    subject: `Flower order — ${tier.name} — ${payload.recipientName} (${payload.deliveryDate})`,
    text: lines.join("\n"),
  };
}

/** Sends via Resend when RESEND_API_KEY is set. */
export async function sendFlowerOrderEmail(
  payload: FlowerOrderPayload,
): Promise<{ sent: boolean; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — flower order notification skipped");
    return { sent: false, skipped: true };
  }

  const from =
    process.env.RESEND_FROM?.trim() || `${site.name} <notifications@greygablesfarm.com>`;
  const { subject, text } = formatFlowerOrderEmail(payload);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [site.email],
      reply_to: payload.senderEmail,
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend error", res.status, body);
    return { sent: false };
  }

  return { sent: true };
}
