export const FLOWER_TIERS = [
  {
    id: "choice",
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
  },
  {
    id: "deluxe",
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
  },
  {
    id: "vessel",
    name: "Deluxe, Curated Vessel",
    price: 300,
    priceLabel: "$300",
    description:
      "Our deluxe arrangement designed in a hand-selected ceramic or artisan vessel chosen to suit the flowers. The vessel is theirs to keep.",
    cta: "Order for delivery",
    popular: false,
    // Same shoot as the classic vase — crop emphasizes the distinctive vessel
    imageSrc:
      "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780672498716-1X3A1176-a2b78286.jpg",
    imageAlt: "Arrangement in a distinctive artisan vessel",
    imageObjectPosition: "50% 85%",
  },
] as const;

export type FlowerTierId = (typeof FLOWER_TIERS)[number]["id"];

export const FLOWER_TIER_IDS = FLOWER_TIERS.map((t) => t.id);

export function getFlowerTier(id: string | null | undefined) {
  return FLOWER_TIERS.find((t) => t.id === id) ?? FLOWER_TIERS[1];
}

export function isFlowerTierId(value: unknown): value is FlowerTierId {
  return typeof value === "string" && FLOWER_TIER_IDS.includes(value as FlowerTierId);
}

/** Strongest arrangement photo — used for Open Graph. */
export const FLOWERS_OG_IMAGE =
  "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780672498716-1X3A1176-a2b78286.jpg";
