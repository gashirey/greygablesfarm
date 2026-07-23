import type {
  SurgeExperienceDetail,
  SurgeExperienceListItem,
  SurgePaymentProfile,
} from "@/lib/surge/types";

/** Local layout preview when Surge business API is not configured. */
export const PREVIEW_EXPERIENCE_ID = "preview-august-u-pick";

export function previewExperienceList(): SurgeExperienceListItem[] {
  return [
    {
      id: PREVIEW_EXPERIENCE_ID,
      slug: "grey-gables-august-you-pick-nights",
      public_title: "Grey Gables August U-Pick Nights",
      short_description:
        "Evening U-Pick nights on the farm. Capacity and booking live in Surge.",
      publication_status: "published",
      base_price_cents: 2500,
      capacity_unit_label: "spots",
      upcoming_occurrence_count: 3,
      next_occurrence_at: "2026-08-07T18:00:00.000-04:00",
    },
  ];
}

export function previewPaymentProfile(): SurgePaymentProfile {
  return {
    status: "pending",
    stripe_account_id: null,
    charges_enabled: false,
    payouts_enabled: false,
    connect_url: null,
    dashboard_url: null,
  };
}

export function previewExperienceDetail(
  id: string,
): SurgeExperienceDetail | null {
  if (id !== PREVIEW_EXPERIENCE_ID) return null;
  return {
    id: PREVIEW_EXPERIENCE_ID,
    slug: "grey-gables-august-you-pick-nights",
    internal_name: "August U-Pick Nights",
    public_title: "Grey Gables August U-Pick Nights",
    short_description:
      "Evening U-Pick nights on the farm. Capacity and booking live in Surge.",
    full_description:
      "Join us for a calm evening U-Pick. Choose your night, reserve your spots, and pick in the fields before dark.",
    image_url: null,
    category: "On-farm experience",
    publication_status: "published",
    location_name: "Grey Gables Farm",
    address_line1: null,
    address_line2: null,
    city: "Keswick",
    state: "VA",
    postal_code: null,
    customer_instructions:
      "Park near the barn. Bring snips if you have them — we have extras.",
    directions_url: null,
    location_public_before_book: true,
    booking_mode: "open",
    min_quantity: 1,
    max_quantity: 6,
    capacity_unit_label: "spots",
    pricing_model: "per_unit",
    base_price_cents: 2500,
    payment_requirement: "full",
    deposit_cents: null,
    cancellation_policy: "Full refund if cancelled 48 hours before the night.",
    rescheduling_policy: null,
    weather_policy: "We may reschedule for severe weather.",
    participation_instructions: "Wear closed-toe shoes; fields can be uneven.",
    arrival_instructions: "Check in at the barn 10 minutes before start.",
    waiver_text: null,
    occurrences: [
      {
        id: "preview-occ-aug-7",
        experience_id: PREVIEW_EXPERIENCE_ID,
        starts_at: "2026-08-07T18:00:00.000-04:00",
        ends_at: "2026-08-07T20:00:00.000-04:00",
        timezone: "America/New_York",
        capacity: 24,
        price_cents_override: null,
        status: "open",
        is_public: true,
        remaining_capacity: 24,
      },
      {
        id: "preview-occ-aug-14",
        experience_id: PREVIEW_EXPERIENCE_ID,
        starts_at: "2026-08-14T18:00:00.000-04:00",
        ends_at: "2026-08-14T20:00:00.000-04:00",
        timezone: "America/New_York",
        capacity: 24,
        price_cents_override: null,
        status: "open",
        is_public: true,
        remaining_capacity: 24,
      },
      {
        id: "preview-occ-aug-21",
        experience_id: PREVIEW_EXPERIENCE_ID,
        starts_at: "2026-08-21T18:00:00.000-04:00",
        ends_at: "2026-08-21T20:00:00.000-04:00",
        timezone: "America/New_York",
        capacity: 20,
        price_cents_override: 3000,
        status: "scheduled",
        is_public: true,
        remaining_capacity: 20,
      },
    ],
  };
}
