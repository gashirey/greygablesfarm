export type FulfillmentType = "delivery" | "pickup";

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export type FulfillmentStatus =
  | "checkout_started"
  | "confirmed"
  | "designing"
  | "ready"
  | "out_for_delivery"
  | "ready_for_pickup"
  | "completed"
  | "cancelled";

export type ReservationStatus = "held" | "committed" | "released";

export type LineItemKind = "arrangement" | "vessel" | "delivery" | "tax" | "other";

export type SsProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  basePriceCents: number;
  capacityCost: number;
  requiresVessel: boolean;
  allowsDelivery: boolean;
  allowsPickup: boolean;
  imageUrl: string;
  imageAlt: string;
  isActive: boolean;
  sortOrder: number;
};

export type SsVessel = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  qtyOnHand: number;
  priceAdjustmentCents: number;
  isActive: boolean;
  sortOrder: number;
};

export type SsDeliveryZone = {
  id: string;
  name: string;
  feeCents: number;
  isActive: boolean;
  sortOrder: number;
  zips?: string[];
};

export type SsPickupWindow = {
  id: string;
  fulfillmentDateId: string;
  label: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  isActive: boolean;
  fulfillmentDate?: string;
};

export type SsFulfillmentDate = {
  id: string;
  fulfillmentDate: string;
  maxCapacity: number;
  isActive: boolean;
  remainingCapacity?: number;
  windows?: SsPickupWindow[];
};

export type PriceBreakdown = {
  arrangementCents: number;
  vesselCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  totalCents: number;
  lines: Array<{
    kind: LineItemKind;
    label: string;
    quantity: number;
    unitAmountCents: number;
  }>;
};

export type CheckoutInput = {
  productSlug: string;
  vesselId?: string | null;
  fulfillmentType: FulfillmentType;
  fulfillmentDate: string;
  pickupWindowId?: string | null;
  addressZip?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  deliveryInstructions?: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  cardMessage?: string | null;
  notes?: string | null;
};

export const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  checkout_started: "Checkout started",
  confirmed: "Confirmed",
  designing: "Designing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  ready_for_pickup: "Ready for pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
