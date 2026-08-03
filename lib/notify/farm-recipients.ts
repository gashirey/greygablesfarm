import { site } from "@/lib/content";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Parse comma/semicolon/whitespace-separated env lists. */
export function parseEnvList(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Farm alert emails for new paid orders / inquiries.
 * ORDER_NOTIFY_EMAILS always wins when set; otherwise info@ is used.
 * info@ is always included so the shared inbox stays in the loop.
 */
export function getFarmNotifyEmails(): string[] {
  const configured = parseEnvList(process.env.ORDER_NOTIFY_EMAILS).filter((e) =>
    EMAIL_RE.test(e),
  );
  const base = configured.length ? configured : [site.email];
  const withInbox = base.includes(site.email) ? base : [...base, site.email];
  return [...new Set(withInbox.map((e) => e.toLowerCase()))];
}

/** E.164-ish phones from ORDER_NOTIFY_PHONES (+15405551234,5405551234). */
export function getFarmNotifyPhones(): string[] {
  const out: string[] = [];
  for (const raw of parseEnvList(process.env.ORDER_NOTIFY_PHONES)) {
    const digits = raw.replace(/[^\d+]/g, "");
    if (digits.startsWith("+") && digits.length >= 11) {
      out.push(digits);
      continue;
    }
    const only = digits.replace(/\D/g, "");
    if (only.length === 10) {
      out.push(`+1${only}`);
      continue;
    }
    if (only.length === 11 && only.startsWith("1")) {
      out.push(`+${only}`);
    }
  }
  return [...new Set(out)];
}
