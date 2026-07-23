export type PublicationStatus = "draft" | "published" | "archived";
export type BookingMode = "open" | "operator_only";
export type PricingModel = "free" | "per_reservation" | "per_unit";
export type PaymentRequirement = "full" | "deposit" | "none";
export type OccurrenceStatus =
  | "draft"
  | "scheduled"
  | "open"
  | "sold_out"
  | "closed"
  | "cancelled"
  | "completed";
export type PaymentProfileStatus = "pending" | "active" | "disabled";

export type SurgeExperienceListItem = {
  id: string;
  slug: string;
  public_title: string;
  short_description: string | null;
  publication_status: PublicationStatus;
  base_price_cents: number;
  capacity_unit_label: string;
  upcoming_occurrence_count: number;
  next_occurrence_at: string | null;
};

export type SurgeOccurrence = {
  id: string;
  experience_id: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  capacity: number;
  price_cents_override: number | null;
  status: OccurrenceStatus;
  is_public: boolean;
  remaining_capacity?: number | null;
};

export type SurgeExperienceDetail = {
  id: string;
  slug: string;
  internal_name: string;
  public_title: string;
  short_description: string | null;
  full_description: string | null;
  image_url: string | null;
  category: string | null;
  publication_status: PublicationStatus;
  location_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  customer_instructions: string | null;
  directions_url: string | null;
  location_public_before_book: boolean;
  booking_mode: BookingMode;
  min_quantity: number;
  max_quantity: number | null;
  capacity_unit_label: string;
  pricing_model: PricingModel;
  base_price_cents: number;
  payment_requirement: PaymentRequirement;
  deposit_cents: number | null;
  cancellation_policy: string | null;
  rescheduling_policy: string | null;
  weather_policy: string | null;
  participation_instructions: string | null;
  arrival_instructions: string | null;
  waiver_text: string | null;
  occurrences: SurgeOccurrence[];
};

export type ExperiencePatch = Partial<
  Omit<SurgeExperienceDetail, "id" | "slug" | "occurrences">
>;

export type OccurrencePatch = {
  starts_at?: string;
  ends_at?: string;
  capacity?: number;
  price_cents_override?: number | null;
  status?: OccurrenceStatus;
};

export type SurgePaymentProfile = {
  status: PaymentProfileStatus;
  stripe_account_id: string | null;
  charges_enabled: boolean | null;
  payouts_enabled: boolean | null;
  connect_url: string | null;
  dashboard_url: string | null;
};
