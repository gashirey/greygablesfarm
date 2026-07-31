import type { SsProduct } from "./types";

/**
 * Display seed for Designer's Choice scales (Concept 5c).
 * Used when DB still has legacy slugs or pre-migration 032 columns.
 */
const SCALE_SEED: Record<
  string,
  Partial<SsProduct> & { slug: string; name: string }
> = {
  classic: {
    slug: "classic",
    name: "Classic",
    description:
      "Perfect for thoughtful gestures, smaller tables, and everyday beauty.",
    blurb:
      "Perfect for thoughtful gestures, smaller tables, and everyday beauty.",
    basePriceCents: 15000,
    vesselUpgradeCents: 4000,
    capacityCost: 1,
    requiresVessel: false,
    isPopular: false,
    imageUrl:
      "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780969108915-1X3A1390-b350af98.jpg",
    imageAlt: "Classic-scale Designer's Choice arrangement",
    sortOrder: 10,
  },
  signature: {
    slug: "signature",
    name: "Signature",
    description:
      "Our signature expression of the season—balanced, abundant, and our most popular choice.",
    blurb:
      "Our signature expression of the season—balanced, abundant, and our most popular choice.",
    basePriceCents: 22500,
    vesselUpgradeCents: 5000,
    capacityCost: 2,
    requiresVessel: false,
    isPopular: true,
    imageUrl:
      "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1783597232259-IN7A5280-6d032280.jpg",
    imageAlt: "Signature-scale Designer's Choice arrangement",
    sortOrder: 20,
  },
  grand: {
    slug: "grand",
    name: "Grand",
    description:
      "A dramatic seasonal statement for celebrations, milestones, and unforgettable moments.",
    blurb:
      "A dramatic seasonal statement for celebrations, milestones, and unforgettable moments.",
    basePriceCents: 35000,
    vesselUpgradeCents: 7500,
    capacityCost: 3,
    requiresVessel: false,
    isPopular: false,
    imageUrl:
      "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1781401339985-1X3A1494-3322be5b.jpg",
    imageAlt: "Grand-scale Designer's Choice arrangement",
    sortOrder: 30,
  },
};

const LEGACY_TO_SCALE: Record<string, keyof typeof SCALE_SEED> = {
  choice: "classic",
  deluxe: "signature",
  "curated-vessel": "grand",
  vessel: "grand",
  classic: "classic",
  signature: "signature",
  grand: "grand",
};

/** Overlay seed copy/pricing onto live products; prefer DB values when present. */
export function enrichScaleProduct(product: SsProduct): SsProduct {
  const scaleKey = LEGACY_TO_SCALE[product.slug];
  if (!scaleKey) return product;
  const seed = SCALE_SEED[scaleKey];
  if (!seed) return product;

  const isLegacySlug = Boolean(
    LEGACY_TO_SCALE[product.slug] && !SCALE_SEED[product.slug],
  );
  const hasBlurb = Boolean(product.blurb?.trim());
  const hasUpgrade = product.vesselUpgradeCents > 0;

  return {
    ...product,
    // Keep DB slug for checkout until migration remaps rows
    name: isLegacySlug ? seed.name : product.name || seed.name,
    description: product.description || seed.description || "",
    blurb: hasBlurb ? product.blurb : seed.blurb || product.description,
    basePriceCents: product.basePriceCents || seed.basePriceCents || 0,
    vesselUpgradeCents: hasUpgrade
      ? product.vesselUpgradeCents
      : (seed.vesselUpgradeCents ?? 0),
    requiresVessel: false,
    isPopular: product.isPopular || Boolean(seed.isPopular),
    imageUrl:
      isLegacySlug || !product.imageUrl
        ? seed.imageUrl || product.imageUrl
        : product.imageUrl,
    imageAlt: product.imageAlt || seed.imageAlt || seed.name,
    sortOrder: seed.sortOrder ?? product.sortOrder,
  };
}

export function normalizeOrderScales(products: SsProduct[]): SsProduct[] {
  const enriched = products.map(enrichScaleProduct);

  // Prefer new slugs when present; otherwise use legacy trio
  const bySlug = new Map(enriched.map((p) => [p.slug, p]));
  const modern = ["classic", "signature", "grand"]
    .map((s) => bySlug.get(s))
    .filter((p): p is SsProduct => Boolean(p));
  if (modern.length >= 2) {
    return modern.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const legacy = ["choice", "deluxe", "curated-vessel"]
    .map((s) => bySlug.get(s))
    .filter((p): p is SsProduct => Boolean(p));
  if (legacy.length) {
    return legacy.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return enriched.sort((a, b) => a.sortOrder - b.sortOrder);
}
