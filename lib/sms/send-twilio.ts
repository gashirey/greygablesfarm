/**
 * Minimal Twilio SMS sender (no SDK). Skips quietly when not configured.
 *
 * Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 */

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim(),
  );
}

export async function sendTwilioSms(input: {
  to: string;
  body: string;
}): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();

  if (!sid || !token || !from) {
    return { sent: false, skipped: true };
  }

  const body = input.body.trim().slice(0, 1500);
  if (!body || !input.to) {
    return { sent: false, error: "Missing to/body" };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({
    To: input.to,
    From: from,
    Body: body,
  });

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("[sms] Twilio error", res.status, text);
      return { sent: false, error: text.slice(0, 200) };
    }
    return { sent: true };
  } catch (err) {
    console.error("[sms] Twilio fetch failed", err);
    return {
      sent: false,
      error: err instanceof Error ? err.message : "Twilio failed",
    };
  }
}

export async function sendTwilioSmsMany(input: {
  to: string[];
  body: string;
}): Promise<{ sent: number; failed: number; skipped: boolean }> {
  if (!isTwilioConfigured()) {
    return { sent: 0, failed: 0, skipped: true };
  }
  let sent = 0;
  let failed = 0;
  for (const to of input.to) {
    const result = await sendTwilioSms({ to, body: input.body });
    if (result.sent) sent += 1;
    else if (!result.skipped) failed += 1;
  }
  return { sent, failed, skipped: false };
}
