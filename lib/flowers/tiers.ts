import type { FlowerTier } from "./types";

/** Static fallback when Supabase is empty / unavailable */
export const FALLBACK_FLOWER_TIERS: FlowerTier[] = [
  {
    id: "choice",
    slug: "choice",
    name: "Designer's Choice",
    price: 150,
    priceLabel: "$150",
    description:
      "The best of this morning's harvest, arranged in a classic vase. Ande designs every arrangement from what's freshest in the field — no two are alike.",
    cta: "Order for delivery",
    popular: false,
    imageSrc:
      "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780672498716-1X3A1176-a2b78286.jpg",
    imageAlt: "Designer's Choice arrangement in a classic fluted vase",
    sortOrder: 10,
    isVisible: true,
  },
  {
    id: "deluxe",
    slug: "deluxe",
    name: "Designer's Choice Deluxe",
    price: 225,
    priceLabel: "$225",
    description:
      "A fuller, more abundant arrangement with premium focal flowers and greater variety. Our most-sent gift.",
    cta: "Order for delivery",
    popular: true,
    imageSrc:
      "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/81c656df-c2b0-40fc-a269-43912145ccb8/1779243921399-1X3A0640-ebe20511.jpg",
    imageAlt: "Full harvest bunches of blue and white nigella",
    sortOrder: 20,
    isVisible: true,
  },
  {
    id: "vessel",
    slug: "vessel",
    name: "Deluxe, Curated Vessel",
    price: 300,
    priceLabel: "$300",
    description:
      "Our deluxe arrangement designed in a hand-selected ceramic or artisan vessel chosen to suit the flowers. The vessel is theirs to keep.",
    cta: "Order for delivery",
    popular: false,
    imageSrc:
      "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780672498716-1X3A1176-a2b78286.jpg",
    imageAlt: "Arrangement in a distinctive artisan vessel",
    imageObjectPosition: "50% 85%",
    sortOrder: 30,
    isVisible: true,
  },
];

/** @deprecated Prefer listFlowerTiers() / getFlowerTierBySlug() */
export const FLOWER_TIERS = FALLBACK_FLOWER_TIERS;

export type FlowerTierId = string;

export function getFlowerTier(id: string | null | undefined): FlowerTier {
  return (
    FALLBACK_FLOWER_TIERS.find((t) => t.slug === id || t.id === id) ??
    FALLBACK_FLOWER_TIERS.find((t) => t.popular) ??
    FALLBACK_FLOWER_TIERS[0]
  );
}

export function isFlowerTierId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    FALLBACK_FLOWER_TIERS.some((t) => t.slug === value)
  );
}

export const FLOWERS_OG_IMAGE =
  FALLBACK_FLOWER_TIERS.find((t) => t.popular)?.imageSrc ??
  FALLBACK_FLOWER_TIERS[0].imageSrc;
