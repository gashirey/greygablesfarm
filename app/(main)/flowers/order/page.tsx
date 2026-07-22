import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { FlowerOrderForm } from "@/components/flowers/FlowerOrderForm";
import { FLOWERS_OG_IMAGE, getFlowerTier } from "@/lib/flowers/tiers";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Order Flowers",
  description:
    "Order a Designer's Choice arrangement for same-day hand delivery across Charlottesville and Central Virginia.",
  path: "/flowers/order",
  image: FLOWERS_OG_IMAGE,
});

type Props = {
  searchParams: Promise<{ tier?: string }>;
};

export default async function FlowerOrderPage({ searchParams }: Props) {
  const { tier } = await searchParams;
  const selected = getFlowerTier(tier);

  return (
    <Section density="compact">
      <div className="mb-8 max-w-xl">
        <p className="type-eyebrow tracking-wide">
          <Link
            href="/flowers"
            className="text-stone underline-offset-4 hover:text-salmon-dark hover:underline"
          >
            Designer&apos;s Choice
          </Link>
        </p>
        <h1 className="type-page-title mt-2 leading-tight">Order for delivery</h1>
        <p className="type-page-body mt-3 leading-relaxed">
          Starting with {selected.name} ({selected.priceLabel}). You can change
          the tier below. No payment is collected here — we&apos;ll confirm and
          send a secure link.
        </p>
      </div>
      <div className="max-w-xl">
        <FlowerOrderForm initialTier={tier} />
      </div>
    </Section>
  );
}
