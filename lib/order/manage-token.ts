import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

function secret(): string {
  return (
    process.env.ORDER_MANAGE_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim() ||
    ""
  );
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

/** Signed, time-limited manage token (no DB column required). */
export function createOrderManageToken(
  orderId: string,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): string | null {
  const key = secret();
  if (!key || !orderId) return null;
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${orderId}.${exp}`;
  const sig = createHmac("sha256", key).update(payload).digest();
  return `${b64url(payload)}.${b64url(sig)}`;
}

export function verifyOrderManageToken(
  token: string,
): { ok: true; orderId: string } | { ok: false; error: string } {
  const key = secret();
  if (!key) return { ok: false, error: "Manage links are not configured." };
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, error: "Invalid manage link." };

  let payload: string;
  let sig: Buffer;
  try {
    payload = fromB64url(parts[0]!).toString("utf8");
    sig = fromB64url(parts[1]!);
  } catch {
    return { ok: false, error: "Invalid manage link." };
  }

  const expected = createHmac("sha256", key).update(payload).digest();
  if (
    expected.length !== sig.length ||
    !timingSafeEqual(expected, sig)
  ) {
    return { ok: false, error: "Invalid or expired manage link." };
  }

  const [orderId, expStr] = payload.split(".");
  const exp = Number(expStr);
  if (!orderId || !Number.isFinite(exp)) {
    return { ok: false, error: "Invalid manage link." };
  }
  if (exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, error: "This manage link has expired." };
  }
  return { ok: true, orderId };
}

export function orderManageUrl(origin: string, orderId: string): string | null {
  const token = createOrderManageToken(orderId);
  if (!token) return null;
  return `${origin.replace(/\/$/, "")}/order/manage?token=${encodeURIComponent(token)}`;
}
