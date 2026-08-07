import { brandedArrangementName } from "./stripe-labels";

const REGION_DISPLAY: Record<string, string> = {
  "Local Louisa": "Louisa County",
  "Extended Louisa": "Extended Louisa",
  "Charlottesville Area": "Charlottesville Area",
  "Greene County": "Greene County",
  "Orange County": "Orange County",
  "Lake Monticello & Fluvanna": "Lake Monticello & Fluvanna",
  Goochland: "Goochland",
  "Short Pump / West End": "Short Pump / West End",
};

/** Short customer-facing order number from UUID (e.g. GG-A1B2C3). */
export function formatOrderDisplayNumber(orderId: string): string {
  const compact = orderId.replace(/-/g, "").slice(-6).toUpperCase();
  return `GG-${compact}`;
}

export function displayDeliveryRegionName(
  regionName: string | null | undefined,
): string | null {
  if (!regionName?.trim()) return null;
  return REGION_DISPLAY[regionName.trim()] ?? regionName.trim();
}

export function displayPresentationLabel(
  presentation: string | null | undefined,
  vesselCents: number,
): string {
  if (presentation === "curated-keepsake" || vesselCents > 0) {
    return "Curated Keepsake Vessel";
  }
  return "Signature Glass Vase";
}

export function displayArrangementLabel(productName: string | null | undefined): string {
  if (!productName?.trim()) return "Grey Gables Arrangement";
  return brandedArrangementName(productName);
}

export function formatFulfillmentDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
}

export type OrderSuccessSummary = {
  orderId: string;
  displayNumber: string;
  arrangementLabel: string;
  presentationLabel: string;
  fulfillmentType: "delivery" | "pickup" | "in_town_pickup";
  fulfillmentLabel: string;
  deliveryRegionLabel: string | null;
  fulfillmentDateLabel: string | null;
  pickupWindowLabel: string | null;
  /** In-town location name + address line when applicable */
  inTownLocationLabel: string | null;
  expectedLabel: string | null;
  totalCents: number;
};
