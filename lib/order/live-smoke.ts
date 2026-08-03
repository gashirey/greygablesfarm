import type { SsProduct } from "./types";
import { formatCents } from "./types";

/** Secret-gated Live verification through the real Designer's Choice order flow. */
export const LIVE_SMOKE_ZIP = "27606";
export const LIVE_SMOKE_ARRANGEMENT_CENTS = 200;
export const LIVE_SMOKE_DELIVERY_CENTS = 200;
export const LIVE_SMOKE_ZONE_NAME = "Smoke Test Delivery";
export const LIVE_SMOKE_PRODUCT_NAME = "Smoke Test";
export const LIVE_SMOKE_NOTE_TAG = "[LIVE SMOKE]";

export function getSmokeOrderSecret(): string {
  return process.env.SMOKE_ORDER_SECRET?.trim() ?? "";
}

export function isSmokeSecretValid(secret: string | null | undefined): boolean {
  const expected = getSmokeOrderSecret();
  if (!expected || !secret) return false;
  return secret.trim() === expected;
}

/** Read secret from header or JSON body field. */
export function readSmokeSecretFromRequest(
  request: Request,
  body?: Record<string, unknown> | null,
): string {
  const header = request.headers.get("x-smoke-secret")?.trim() ?? "";
  if (header) return header;
  const fromBody =
    typeof body?.smokeSecret === "string" ? body.smokeSecret.trim() : "";
  return fromBody;
}

/** Collapse catalog to a single $2 arrangement cloned from a real product row. */
export function toLiveSmokeProducts(products: SsProduct[]): SsProduct[] {
  const base =
    products.find((p) => p.slug === "classic") ??
    products.find((p) => p.isPopular) ??
    products[0];
  if (!base) return [];

  return [
    {
      ...base,
      name: LIVE_SMOKE_PRODUCT_NAME,
      description:
        "Internal Live Stripe verification through the full order flow. Not a customer product.",
      blurb: `$${LIVE_SMOKE_ARRANGEMENT_CENTS / 100} test arrangement. Use ZIP ${LIVE_SMOKE_ZIP} for $${LIVE_SMOKE_DELIVERY_CENTS / 100} delivery.`,
      basePriceCents: LIVE_SMOKE_ARRANGEMENT_CENTS,
      vesselUpgradeCents: 0,
      requiresVessel: false,
      isPopular: true,
      isActive: true,
    },
  ];
}

export function applyLiveSmokeProductPricing(product: SsProduct): SsProduct {
  return {
    ...product,
    name: LIVE_SMOKE_PRODUCT_NAME,
    basePriceCents: LIVE_SMOKE_ARRANGEMENT_CENTS,
    vesselUpgradeCents: 0,
    requiresVessel: false,
  };
}

export function liveSmokeZoneResponse(zip: string) {
  return {
    id: "live-smoke-zone",
    name: LIVE_SMOKE_ZONE_NAME,
    feeCents: LIVE_SMOKE_DELIVERY_CENTS,
    feeLabel: formatCents(LIVE_SMOKE_DELIVERY_CENTS),
    zip,
  };
}

export function withLiveSmokeNote(notes: string | null | undefined): string {
  const existing = notes?.trim() ?? "";
  if (existing.includes(LIVE_SMOKE_NOTE_TAG)) return existing;
  return existing
    ? `${LIVE_SMOKE_NOTE_TAG} ${existing}`
    : `${LIVE_SMOKE_NOTE_TAG} Full-flow Live verification order.`;
}
