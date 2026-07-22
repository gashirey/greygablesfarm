import type {
  SsDeliveryZone,
  SsFulfillmentDate,
  SsPickupWindow,
  SsProduct,
  SsVessel,
} from "./types";

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  base_price_cents: number;
  capacity_cost: number;
  requires_vessel: boolean;
  allows_delivery: boolean;
  allows_pickup: boolean;
  image_url: string;
  image_alt: string;
  is_active: boolean;
  sort_order: number;
};

export type VesselRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  image_alt: string;
  qty_on_hand: number;
  price_adjustment_cents: number;
  is_active: boolean;
  sort_order: number;
};

export type ZoneRow = {
  id: string;
  name: string;
  fee_cents: number;
  is_active: boolean;
  sort_order: number;
};

export function mapProduct(row: ProductRow): SsProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    basePriceCents: row.base_price_cents,
    capacityCost: row.capacity_cost,
    requiresVessel: row.requires_vessel,
    allowsDelivery: row.allows_delivery,
    allowsPickup: row.allows_pickup,
    imageUrl: row.image_url,
    imageAlt: row.image_alt || row.name,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export function mapVessel(row: VesselRow): SsVessel {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    imageAlt: row.image_alt || row.name,
    qtyOnHand: row.qty_on_hand,
    priceAdjustmentCents: row.price_adjustment_cents,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export function mapZone(row: ZoneRow, zips?: string[]): SsDeliveryZone {
  return {
    id: row.id,
    name: row.name,
    feeCents: row.fee_cents,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    zips,
  };
}

export function mapPickupWindow(row: {
  id: string;
  fulfillment_date_id: string;
  label: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  is_active: boolean;
  fulfillment_date?: string;
}): SsPickupWindow {
  return {
    id: row.id,
    fulfillmentDateId: row.fulfillment_date_id,
    label: row.label,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    capacity: row.capacity,
    isActive: row.is_active,
    fulfillmentDate: row.fulfillment_date,
  };
}

export function mapFulfillmentDate(row: {
  id: string;
  fulfillment_date: string;
  max_capacity: number;
  is_active: boolean;
  remaining_capacity?: number;
}): SsFulfillmentDate {
  return {
    id: row.id,
    fulfillmentDate: row.fulfillment_date,
    maxCapacity: row.max_capacity,
    isActive: row.is_active,
    remainingCapacity: row.remaining_capacity,
  };
}
