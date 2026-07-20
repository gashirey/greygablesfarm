export type FarmEventStatus = "draft" | "published" | "archived";

export type FarmEventSegmentType = "text" | "bullets" | "cta" | "image";

export type FarmEvent = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: FarmEventStatus;
  eyebrow: string | null;
  subtitle: string | null;
  index_image_url: string | null;
  index_image_alt: string;
  detail_image_url: string | null;
  detail_image_alt: string;
  cta_label: string | null;
  cta_href: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type FarmEventDate = {
  id: string;
  event_id: string;
  starts_on: string;
  ends_on: string | null;
  time_note: string | null;
  label: string | null;
  is_cancelled: boolean;
  sort_order: number;
  created_at: string;
};

export type FarmEventSegment = {
  id: string;
  event_id: string;
  segment_type: FarmEventSegmentType;
  title: string | null;
  body: string;
  image_url: string | null;
  image_alt: string;
  sort_order: number;
  created_at: string;
};

export type FarmEventWithDetails = FarmEvent & {
  dates: FarmEventDate[];
  segments: FarmEventSegment[];
};

export type FarmEventListItem = FarmEvent & {
  date_count: number;
};
