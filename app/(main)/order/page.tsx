import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { DesignersChoiceFlow } from "@/components/order/DesignersChoiceFlow";
import {
  listActiveProducts,
  listAvailability,
  listUpcomingInTownPickupSlots,
} from "@/lib/order/queries";
import { normalizeOrderScales } from "@/lib/order/scales";
import { pageMetadata } from "@/lib/metadata";
import { getPublicSiteConfig } from "@/lib/site-cms/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Order Flowers",
  description:
    "Order Designer's Choice arrangements for delivery or farm pickup. Cut the morning of fulfillment across Central Virginia.",
  path: "/order",
});

/** Legacy product slugs → current scale slugs */
const SCALE_ALIASES: Record<string, string> = {
  choice: "classic",
  deluxe: "signature",
  "curated-vessel": "grand",
  vessel: "grand",
};

type Props = {
  searchParams: Promise<{ scale?: string }>;
};

export default async function OrderIndexPage({ searchParams }: Props) {
  const { scale: rawScale } = await searchParams;
  const [{ copy }, products, availability, inTownSlots] = await Promise.all([
    getPublicSiteConfig(),
    listActiveProducts(),
    listAvailability({ days: 21 }),
    listUpcomingInTownPickupSlots({ days: 60 }),
  ]);

  const requested = rawScale?.trim().toLowerCase() ?? "";
  const initialScaleSlug =
    SCALE_ALIASES[requested] ?? (requested || undefined);

  const scales = normalizeOrderScales(products);

  // Match initial scale whether DB still uses legacy slugs or modern ones
  const resolvedInitial =
    initialScaleSlug &&
    (scales.find((p) => p.slug === initialScaleSlug)?.slug ||
      scales.find(
        (p) =>
          SCALE_ALIASES[p.slug] === initialScaleSlug ||
          p.slug === SCALE_ALIASES[initialScaleSlug],
      )?.slug);

  return (
    <Section density="compact">
      <DesignersChoiceFlow
        products={scales}
        availability={availability}
        inTownSlots={inTownSlots}
        copy={copy.orderPage}
        initialScaleSlug={resolvedInitial || initialScaleSlug}
      />
    </Section>
  );
}
