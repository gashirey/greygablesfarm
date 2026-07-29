import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { FALLBACK_FLOWER_TIERS, FLOWERS_OG_IMAGE } from "./tiers";
import {
  mapFlowerTierRow,
  type FlowerTier,
  type FlowerTierRow,
} from "./types";

function sortTiers(tiers: FlowerTier[]): FlowerTier[] {
  return [...tiers].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );
}

async function fetchTierRows(options?: {
  includeHidden?: boolean;
}): Promise<FlowerTierRow[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createServiceClient();
    let query = supabase
      .from("flower_tiers")
      .select(
        "id, slug, name, price, description, cta_label, image_url, image_alt, image_object_position, is_popular, is_visible, sort_order, created_at, updated_at",
      )
      .order("sort_order", { ascending: true });

    if (!options?.includeHidden) {
      query = query.eq("is_visible", true);
    }

    const { data, error } = await query;
    if (error) {
      if (!/does not exist|schema cache|PGRST205/i.test(error.message)) {
        console.error("[flower_tiers]", error.message);
      }
      return null;
    }
    return (data ?? []) as FlowerTierRow[];
  } catch (err) {
    console.error("[flower_tiers]", err);
    return null;
  }
}

/** Public catalog — visible tiers only, fallback if table missing. */
export async function listFlowerTiers(): Promise<FlowerTier[]> {
  const rows = await fetchTierRows({ includeHidden: false });
  if (!rows?.length) return sortTiers(FALLBACK_FLOWER_TIERS.filter((t) => t.isVisible));
  return sortTiers(rows.map(mapFlowerTierRow));
}

export async function getFlowerTierBySlug(
  slug: string | null | undefined,
): Promise<FlowerTier> {
  const tiers = await listFlowerTiers();
  if (!slug) {
    return tiers.find((t) => t.popular) ?? tiers[0];
  }
  return tiers.find((t) => t.slug === slug) ?? tiers.find((t) => t.popular) ?? tiers[0];
}

/** Resolve a tier for order validation (visible only). */
export async function resolveOrderTier(
  slug: string,
): Promise<FlowerTier | null> {
  const tiers = await listFlowerTiers();
  return tiers.find((t) => t.slug === slug) ?? null;
}

export async function getFlowersOgImage(): Promise<string> {
  const tiers = await listFlowerTiers();
  const popular = tiers.find((t) => t.popular && t.imageSrc);
  return popular?.imageSrc || tiers[0]?.imageSrc || FLOWERS_OG_IMAGE;
}

/**
 * Mobile: popular first, then remaining by sort_order.
 * Desktop: pure sort_order (left → right).
 * Class names are static strings so Tailwind includes them.
 */
const MOBILE_ORDER = [
  "order-1",
  "order-2",
  "order-3",
  "order-4",
  "order-5",
  "order-6",
] as const;
const DESKTOP_ORDER = [
  "md:order-1",
  "md:order-2",
  "md:order-3",
  "md:order-4",
  "md:order-5",
  "md:order-6",
] as const;

export function flowerCardOrderClass(
  tier: FlowerTier,
  all: FlowerTier[],
): string {
  const bySort = sortTiers(all);
  const desktopIndex = bySort.findIndex((t) => t.slug === tier.slug);
  const popular = bySort.find((t) => t.popular);
  const mobileIndex = (() => {
    if (popular && tier.slug === popular.slug) return 0;
    const rest = bySort.filter((t) => t.slug !== popular?.slug);
    return rest.findIndex((t) => t.slug === tier.slug) + 1;
  })();

  return [
    MOBILE_ORDER[Math.min(mobileIndex, MOBILE_ORDER.length - 1)],
    DESKTOP_ORDER[Math.min(Math.max(desktopIndex, 0), DESKTOP_ORDER.length - 1)],
  ].join(" ");
}
