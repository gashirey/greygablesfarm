import { STRIPE_KIND_FLOWER_ORDER } from "./config";
import type { LineItemKind, PriceBreakdown } from "./types";

/** Customer-facing region name → Stripe receipt wording */
const DELIVERY_REGION_DISPLAY: Record<string, string> = {
  "Local Louisa": "Louisa County",
  "Extended Louisa": "Extended Louisa",
  "Charlottesville Area": "Charlottesville Area",
  "Greene County": "Greene County",
  "Orange County": "Orange County",
  "Lake Monticello & Fluvanna": "Lake Monticello & Fluvanna",
  Goochland: "Goochland",
  "Short Pump / West End": "Short Pump / West End",
};

/**
 * Branded arrangement name for Stripe Checkout / receipts.
 * Classic → Grey Gables Classic Arrangement
 */
export function brandedArrangementName(productName: string): string {
  const base = productName
    .replace(/\bGrey\s+Gables\b/gi, "")
    .replace(/\barrangement\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return `Grey Gables ${base} Arrangement`;
}

export function stripeDeliveryLabel(regionName: string | null | undefined): string {
  if (!regionName?.trim()) return "Local Delivery";
  const display =
    DELIVERY_REGION_DISPLAY[regionName.trim()] ?? regionName.trim();
  return `Local Delivery — ${display}`;
}

export function stripeVesselUpgradeLabel(): string {
  return "Curated Keepsake Vessel Upgrade";
}

export function stripeLineItemName(
  line: PriceBreakdown["lines"][number],
  ctx: {
    productName: string;
    deliveryRegionName?: string | null;
  },
): string {
  switch (line.kind as LineItemKind) {
    case "arrangement":
      return brandedArrangementName(ctx.productName);
    case "vessel":
      return stripeVesselUpgradeLabel();
    case "delivery":
      return stripeDeliveryLabel(ctx.deliveryRegionName);
    default:
      return line.label;
  }
}

/** Build Stripe Checkout line_items from priced lines (positive amounts only). */
export function buildStripeCheckoutLineItems(
  lines: PriceBreakdown["lines"],
  ctx: {
    productName: string;
    deliveryRegionName?: string | null;
  },
): Array<{
  quantity: number;
  price_data: {
    currency: "usd";
    unit_amount: number;
    product_data: { name: string };
  };
}> {
  return lines
    .filter((l) => l.kind !== "tax" && l.unitAmountCents > 0)
    .map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: "usd" as const,
        unit_amount: l.unitAmountCents,
        product_data: {
          name: stripeLineItemName(l, ctx).slice(0, 120),
        },
      },
    }));
}

/** Stripe metadata values must be strings; omit empties. */
export function buildStripeOrderMetadata(input: {
  orderId: string;
  productSlug: string;
  productName: string;
  presentation: string;
  fulfillmentType: string;
  fulfillmentDate: string;
  deliveryRegionName?: string | null;
  deliveryZip?: string | null;
  buyerName: string;
}): Record<string, string> {
  const meta: Record<string, string> = {
    kind: STRIPE_KIND_FLOWER_ORDER,
    order_id: input.orderId,
    product_slug: input.productSlug,
    arrangement_type: input.productName.trim(),
    arrangement_name: brandedArrangementName(input.productName),
    presentation: input.presentation,
    fulfillment_method: input.fulfillmentType,
    fulfillment_date: input.fulfillmentDate,
    customer_name: input.buyerName.trim().slice(0, 200),
    tenant: "grey_gables_farm",
    organization: "Grey Gables Farm",
  };

  if (input.fulfillmentType === "delivery") {
    if (input.deliveryRegionName?.trim()) {
      meta.delivery_region = input.deliveryRegionName.trim();
    }
    if (input.deliveryZip?.trim()) {
      meta.delivery_zip = input.deliveryZip.trim().slice(0, 10);
    }
  }

  return meta;
}
