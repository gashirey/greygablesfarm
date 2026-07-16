import { bloomsPackage } from "@/lib/blooms/package";
import type { BloomsBookingPayload } from "@/lib/blooms/types";
import { site } from "@/lib/content";

function formatBloomsBookingEmail(
  payload: BloomsBookingPayload & { bookingId?: string; paymentStatus?: string },
): { subject: string; text: string } {
  const lines = [
    `New ${bloomsPackage.title} booking`,
    payload.bookingId ? `Booking ID: ${payload.bookingId}` : null,
    payload.paymentStatus ? `Payment: ${payload.paymentStatus}` : null,
    "",
    `Contact: ${payload.name}`,
    payload.partnerName ? `Partner: ${payload.partnerName}` : null,
    `Email: ${payload.email}`,
    payload.phone ? `Phone: ${payload.phone}` : null,
    payload.preferredDate ? `Preferred date: ${payload.preferredDate}` : null,
    payload.preferredTime ? `Preferred time: ${payload.preferredTime}` : null,
    payload.notes ? `\nNotes:\n${payload.notes}` : null,
    "",
    `Package: ${bloomsPackage.packageName} (${bloomsPackage.priceDisplay})`,
  ].filter(Boolean);

  return {
    subject: `${bloomsPackage.title} — ${payload.name}`,
    text: lines.join("\n"),
  };
}

/** Sends via Resend when RESEND_API_KEY is set. */
export async function sendBloomsBookingEmail(
  payload: BloomsBookingPayload & { bookingId?: string; paymentStatus?: string },
): Promise<{ sent: boolean; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — blooms booking notification skipped");
    return { sent: false, skipped: true };
  }

  const from =
    process.env.RESEND_FROM?.trim() || `${site.name} <notifications@greygablesfarm.com>`;
  const { subject, text } = formatBloomsBookingEmail(payload);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [site.email],
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
