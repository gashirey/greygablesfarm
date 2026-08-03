import { site } from "@/lib/content";
import {
  DELIVERY_BUDGETS,
  DELIVERY_OCCASIONS,
  type DeliveryInquiryPayload,
} from "@/lib/delivery/types";
import { getFarmNotifyEmails } from "@/lib/notify/farm-recipients";

function labelFor<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function formatDeliveryEmail(payload: DeliveryInquiryPayload): { subject: string; text: string } {
  const occasion = labelFor(DELIVERY_OCCASIONS, payload.occasion);
  const budget = labelFor(DELIVERY_BUDGETS, payload.budget);

  const lines = [
    "New delivery arrangement inquiry",
    "",
    `From: ${payload.name}`,
    `Email: ${payload.email}`,
    payload.phone ? `Phone: ${payload.phone}` : null,
    "",
    `Recipient: ${payload.recipientName}`,
    `Address: ${payload.recipientAddress}`,
    payload.recipientCounty ? `County: ${payload.recipientCounty}` : null,
    `Delivery date: ${payload.deliveryDate}`,
    `Occasion: ${occasion}`,
    `Budget: ${budget}`,
    payload.notes ? `\nNotes:\n${payload.notes}` : null,
  ].filter(Boolean);

  return {
    subject: `Delivery inquiry — ${payload.recipientName} (${payload.deliveryDate})`,
    text: lines.join("\n"),
  };
}

/** Sends via Resend when RESEND_API_KEY is set. */
export async function sendDeliveryInquiryEmail(
  payload: DeliveryInquiryPayload,
): Promise<{ sent: boolean; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — delivery notification skipped");
    return { sent: false, skipped: true };
  }

  const from =
    process.env.RESEND_FROM?.trim() || `${site.name} <notifications@greygablesfarm.com>`;
  const { subject, text } = formatDeliveryEmail(payload);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: getFarmNotifyEmails(),
      reply_to: payload.email,
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
