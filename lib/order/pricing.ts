import type {
  LineItemKind,
  PresentationMode,
  PriceBreakdown,
  SsProduct,
  SsVessel,
} from "./types";

/**
 * Server-only pricing. Never trust client-supplied amounts.
 * Tax is left at 0 here — Stripe Tax (automatic_tax) applies at Checkout when enabled.
 */
export function computeOrderPricing(input: {
  product: SsProduct;
  presentation?: PresentationMode | null;
  vessel?: SsVessel | null;
  deliveryFeeCents?: number;
  /** Shown on the delivery line when a region is known */
  deliveryLabel?: string | null;
  taxCents?: number;
}): PriceBreakdown {
  const presentation: PresentationMode =
    input.presentation ??
    (input.product.requiresVessel ? "curated-keepsake" : "signature-glass");

  const arrangementCents = input.product.basePriceCents;
  let vesselCents = 0;
  let vesselLabel = "";

  if (presentation === "curated-keepsake") {
    if (input.vessel) {
      vesselCents = input.vessel.priceAdjustmentCents;
      vesselLabel =
        vesselCents > 0
          ? `${input.vessel.name} (+$${vesselCents / 100})`
          : `${input.vessel.name} (included)`;
    } else {
      vesselCents = input.product.vesselUpgradeCents;
      vesselLabel =
        vesselCents > 0
          ? `Curated Keepsake Vessel (+$${vesselCents / 100})`
          : "Curated Keepsake Vessel";
    }
  }

  // Legacy: product still marked requires_vessel and no presentation passed
  if (
    input.product.requiresVessel &&
    !input.presentation &&
    !input.vessel
  ) {
    throw new Error("A vessel selection is required for this arrangement.");
  }

  const deliveryFeeCents = Math.max(0, input.deliveryFeeCents ?? 0);
  const taxCents = Math.max(0, input.taxCents ?? 0);

  const lines: PriceBreakdown["lines"] = [
    {
      kind: "arrangement" as LineItemKind,
      label: input.product.name,
      quantity: 1,
      unitAmountCents: arrangementCents,
    },
  ];

  if (presentation === "curated-keepsake" && vesselCents >= 0 && vesselLabel) {
    lines.push({
      kind: "vessel",
      label: vesselLabel,
      quantity: 1,
      unitAmountCents: vesselCents,
    });
  }

  if (deliveryFeeCents > 0) {
    lines.push({
      kind: "delivery",
      label: (input.deliveryLabel?.trim() || "Local delivery").slice(0, 120),
      quantity: 1,
      unitAmountCents: deliveryFeeCents,
    });
  }

  if (taxCents > 0) {
    lines.push({
      kind: "tax",
      label: "Tax",
      quantity: 1,
      unitAmountCents: taxCents,
    });
  }

  const totalCents =
    arrangementCents + vesselCents + deliveryFeeCents + taxCents;

  return {
    arrangementCents,
    vesselCents,
    deliveryFeeCents,
    taxCents,
    totalCents,
    lines,
  };
}

/** Reject client-supplied totals that don't match server computation. */
export function assertPricingNotTampered(
  server: PriceBreakdown,
  clientClaimedTotal?: number | null,
): void {
  if (
    clientClaimedTotal != null &&
    Number.isFinite(clientClaimedTotal) &&
    clientClaimedTotal !== server.totalCents
  ) {
    throw new Error("Price mismatch. Please refresh and try again.");
  }
}
