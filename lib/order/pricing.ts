import type {
  LineItemKind,
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
  vessel?: SsVessel | null;
  deliveryFeeCents?: number;
  taxCents?: number;
}): PriceBreakdown {
  const arrangementCents = input.product.basePriceCents;
  const vesselCents = input.product.requiresVessel
    ? (input.vessel?.priceAdjustmentCents ?? 0)
    : 0;
  const deliveryFeeCents = Math.max(0, input.deliveryFeeCents ?? 0);
  const taxCents = Math.max(0, input.taxCents ?? 0);

  if (input.product.requiresVessel && !input.vessel) {
    throw new Error("A vessel selection is required for this arrangement.");
  }

  const lines: PriceBreakdown["lines"] = [
    {
      kind: "arrangement" as LineItemKind,
      label: input.product.name,
      quantity: 1,
      unitAmountCents: arrangementCents,
    },
  ];

  if (input.product.requiresVessel && input.vessel) {
    lines.push({
      kind: "vessel",
      label:
        vesselCents > 0
          ? `${input.vessel.name} (+$${vesselCents / 100})`
          : `${input.vessel.name} (included)`,
      quantity: 1,
      unitAmountCents: vesselCents,
    });
  }

  if (deliveryFeeCents > 0) {
    lines.push({
      kind: "delivery",
      label: "Delivery",
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
