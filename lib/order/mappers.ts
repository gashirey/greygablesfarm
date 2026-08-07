import type {
  SsDeliveryZone,
  SsFulfillmentDate,
  SsInTownPickupSlot,
  SsPickupLocation,
  SsPickupWindow,
  SsProduct,
  SsVessel,
} from "./types";

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  blurb?: string | null;
  base_price_cents: number;
  vessel_upgrade_cents?: number | null;
  capacity_cost: number;
  requires_vessel: boolean;
  allows_delivery: boolean;
  allows_pickup: boolean;
  image_url: string;
  image_alt: string;
  is_popular?: boolean | null;
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
  kind?: string | null;
  notes?: string | null;
};

export function mapProduct(row: ProductRow): SsProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    blurb: (row.blurb ?? row.description ?? "").trim(),
    basePriceCents: row.base_price_cents,
    vesselUpgradeCents: row.vessel_upgrade_cents ?? 0,
    capacityCost: row.capacity_cost,
    requiresVessel: row.requires_vessel,
    allowsDelivery: row.allows_delivery,
    allowsPickup: row.allows_pickup,
    imageUrl: row.image_url,
    imageAlt: row.image_alt || row.name,
    isPopular: Boolean(row.is_popular),
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
    kind: row.kind === "special" ? "special" : "standard",
    notes: row.notes ?? "",
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

export type PickupLocationRow = {
  id: string;
  name: string;
  address_street: string;
  address_line2: string | null;
  address_city: string;
  address_state: string;
  address_zip: string;
  notes: string;
  is_active: boolean;
};

export type InTownPickupSlotRow = {
  id: string;
  location_id: string;
  pickup_date: string;
  starts_at: string;
  ends_at: string;
  label: string;
  capacity: number;
  is_active: boolean;
  notes: string;
  remaining_capacity?: number;
  ss_pickup_locations?: PickupLocationRow | PickupLocationRow[] | null;
};

export function mapPickupLocation(row: PickupLocationRow): SsPickupLocation {
  return {
    id: row.id,
    name: row.name,
    addressStreet: row.address_street,
    addressLine2: row.address_line2,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressZip: row.address_zip,
    notes: row.notes ?? "",
    isActive: row.is_active,
  };
}

export function mapInTownPickupSlot(row: InTownPickupSlotRow): SsInTownPickupSlot {
  const locRaw = row.ss_pickup_locations;
  const loc = Array.isArray(locRaw) ? locRaw[0] : locRaw;
  return {
    id: row.id,
    locationId: row.location_id,
    pickupDate: row.pickup_date,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    label: row.label ?? "",
    capacity: row.capacity,
    isActive: row.is_active,
    notes: row.notes ?? "",
    remainingCapacity: row.remaining_capacity,
    location: loc ? mapPickupLocation(loc) : undefined,
  };
}
