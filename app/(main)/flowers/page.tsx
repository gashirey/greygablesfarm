import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { FlowerProductCard } from "@/components/flowers/FlowerProductCard";
import {
  flowerCardOrderClass,
  getFlowersOgImage,
  listFlowerTiers,
} from "@/lib/flowers/queries";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const image = await getFlowersOgImage();
  return pageMetadata({
    title: "Flower Delivery in Charlottesville & Central Virginia",
    description:
      "Designer's choice arrangements cut the morning of delivery. Same-day hand delivery across Charlottesville, Albemarle, Orange, Fluvanna, and Louisa.",
    path: "/flowers",
    image,
  });
}

export default async function FlowersPage() {
  const tiers = await listFlowerTiers();

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
          {tiers.map((tier) => (
            <FlowerProductCard
              key={tier.slug}
              tier={tier}
              orderClassName={flowerCardOrderClass(tier, tiers)}
            />
          ))}
        </div>
      </Section>

      <Section title="How it works" density="compact" variant="muted">
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
