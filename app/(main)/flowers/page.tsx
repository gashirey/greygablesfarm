import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { FlowerProductCard } from "@/components/flowers/FlowerProductCard";
import { FLOWER_TIERS, FLOWERS_OG_IMAGE } from "@/lib/flowers/tiers";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Flower Delivery in Charlottesville & Central Virginia",
  description:
    "Designer's choice arrangements cut the morning of delivery. Same-day hand delivery across Charlottesville, Albemarle, Orange, Fluvanna, and Louisa.",
  path: "/flowers",
  image: FLOWERS_OG_IMAGE,
});

const ORDER_CLASSES: Record<(typeof FLOWER_TIERS)[number]["id"], string> = {
  // Mobile: $225 first; desktop LTR: $150 → $225 → $300
  choice: "order-2 md:order-1",
  deluxe: "order-1 md:order-2",
  vessel: "order-3 md:order-3",
};

export default function FlowersPage() {
  return (
    <>
      <Section density="compact">
        <header className="max-w-2xl">
          <h1 className="type-page-title leading-tight">Designer&apos;s Choice</h1>
          <p className="type-page-body mt-4 text-base leading-relaxed md:text-lg">
            Cut this morning. Arranged by hand. Delivered today across
            Charlottesville, Albemarle, Orange, Fluvanna, and Louisa.
          </p>
        </header>

        <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-3 md:gap-5 lg:gap-6">
          {FLOWER_TIERS.map((tier) => (
            <FlowerProductCard
              key={tier.id}
              tier={tier}
              orderClassName={ORDER_CLASSES[tier.id]}
            />
          ))}
        </div>
      </Section>

      <Section
        title="How it works"
        density="compact"
        variant="muted"
      >
        <div className="max-w-2xl space-y-5">
          <p className="type-page-body leading-relaxed">
            Order by 10am for same-day delivery, Tuesday through Saturday.
          </p>
          <p className="type-page-body leading-relaxed">
            We cut and design that morning. Every arrangement is built from
            what&apos;s at its peak in the field.
          </p>
          <p className="type-page-body leading-relaxed">
            We deliver by hand to Charlottesville, Crozet, and all of Albemarle,
            Orange, Fluvanna, and Louisa counties.
          </p>
        </div>
        <p className="type-page-body mt-10 max-w-2xl leading-relaxed text-bark">
          Sending flowers from out of town? This is what we do. Your recipient
          gets flowers that were growing in Virginia soil this morning — not
          shipped in a box.
        </p>
      </Section>
    </>
  );
}
