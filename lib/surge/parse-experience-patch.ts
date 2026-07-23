import type {
  ExperiencePatch,
  PaymentRequirement,
  PricingModel,
  PublicationStatus,
  BookingMode,
} from "@/lib/surge/types";

function optString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value).trim();
}

function optBool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  return undefined;
}

function optInt(value: unknown, min = 0): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return Math.max(min, Math.round(value));
}

export function parseExperiencePatch(body: unknown): ExperiencePatch {
  const raw = (body ?? {}) as Record<string, unknown>;
  const patch: ExperiencePatch = {};

  const internal = optString(raw.internal_name);
  if (internal !== undefined && internal !== null) patch.internal_name = internal;

  const title = optString(raw.public_title);
  if (title !== undefined && title !== null) patch.public_title = title;

  if (raw.short_description !== undefined) {
    patch.short_description = optString(raw.short_description) ?? null;
  }
  if (raw.full_description !== undefined) {
    patch.full_description = optString(raw.full_description) ?? null;
  }
  if (raw.image_url !== undefined) {
    patch.image_url = optString(raw.image_url) ?? null;
  }
  if (raw.category !== undefined) {
    patch.category = optString(raw.category) ?? null;
  }

  if (
    raw.publication_status === "draft" ||
    raw.publication_status === "published" ||
    raw.publication_status === "archived"
  ) {
    patch.publication_status = raw.publication_status as PublicationStatus;
  }

  if (raw.location_name !== undefined) {
    patch.location_name = optString(raw.location_name) ?? null;
  }
  if (raw.address_line1 !== undefined) {
    patch.address_line1 = optString(raw.address_line1) ?? null;
  }
  if (raw.address_line2 !== undefined) {
    patch.address_line2 = optString(raw.address_line2) ?? null;
  }
  if (raw.city !== undefined) patch.city = optString(raw.city) ?? null;
  if (raw.state !== undefined) patch.state = optString(raw.state) ?? null;
  if (raw.postal_code !== undefined) {
    patch.postal_code = optString(raw.postal_code) ?? null;
  }
  if (raw.customer_instructions !== undefined) {
    patch.customer_instructions = optString(raw.customer_instructions) ?? null;
  }
  if (raw.directions_url !== undefined) {
    patch.directions_url = optString(raw.directions_url) ?? null;
  }

  const locPublic = optBool(raw.location_public_before_book);
  if (locPublic !== undefined) patch.location_public_before_book = locPublic;

  if (raw.booking_mode === "open" || raw.booking_mode === "operator_only") {
    patch.booking_mode = raw.booking_mode as BookingMode;
  }

  const minQ = optInt(raw.min_quantity, 1);
  if (minQ !== undefined) patch.min_quantity = minQ;

  if (raw.max_quantity === null) patch.max_quantity = null;
  else {
    const maxQ = optInt(raw.max_quantity, 1);
    if (maxQ !== undefined) patch.max_quantity = maxQ;
  }

  const unit = optString(raw.capacity_unit_label);
  if (unit !== undefined && unit !== null) patch.capacity_unit_label = unit;

  if (
    raw.pricing_model === "free" ||
    raw.pricing_model === "per_reservation" ||
    raw.pricing_model === "per_unit"
  ) {
    patch.pricing_model = raw.pricing_model as PricingModel;
  }

  const base = optInt(raw.base_price_cents, 0);
  if (base !== undefined) patch.base_price_cents = base;

  if (
    raw.payment_requirement === "full" ||
    raw.payment_requirement === "deposit" ||
    raw.payment_requirement === "none"
  ) {
    patch.payment_requirement = raw.payment_requirement as PaymentRequirement;
  }

  if (raw.deposit_cents === null) patch.deposit_cents = null;
  else {
    const deposit = optInt(raw.deposit_cents, 0);
    if (deposit !== undefined) patch.deposit_cents = deposit;
  }

  if (raw.cancellation_policy !== undefined) {
    patch.cancellation_policy = optString(raw.cancellation_policy) ?? null;
  }
  if (raw.rescheduling_policy !== undefined) {
    patch.rescheduling_policy = optString(raw.rescheduling_policy) ?? null;
  }
  if (raw.weather_policy !== undefined) {
    patch.weather_policy = optString(raw.weather_policy) ?? null;
  }
  if (raw.participation_instructions !== undefined) {
    patch.participation_instructions =
      optString(raw.participation_instructions) ?? null;
  }
  if (raw.arrival_instructions !== undefined) {
    patch.arrival_instructions = optString(raw.arrival_instructions) ?? null;
  }
  if (raw.waiver_text !== undefined) {
    patch.waiver_text = optString(raw.waiver_text) ?? null;
  }

  return patch;
}
