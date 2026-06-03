import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Section } from "@/components/Section";
import {
  DELIVERY_PROMISE_ITEMS,
  DeliveryTrustStrip,
} from "@/components/delivery/DeliveryTrustStrip";
import { DeliveryInquiryForm } from "@/components/delivery/DeliveryInquiryForm";
import { site } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Send Flowers",
  description:
    "Custom arrangements grown on our Louisa County farm and delivered same-day across Central Virginia.",
  path: "/send-flowers",
});

const DELIVERY_AREAS = [
  "Charlottesville & Crozet",
  "Albemarle County",
  "Orange County",
  "Fluvanna County",
  "Louisa County",
] as const;

export default function SendFlowersPage() {
  return (
    <>
      <Hero
        title="Flowers that actually look like flowers."
        subtitle="We grow them here. We arrange them by hand. You tell us when and where."
        imageSrc={site.heroImage}
        imageAlt={site.heroImageAlt}
        primaryCta={{ label: "Start your order", href: "#order-inquiry" }}
        compact
      />

      <DeliveryTrustStrip items={DELIVERY_PROMISE_ITEMS} variant="page" />

      <Section
        title="Where we deliver"
        description="Central Virginia — from our field to their door."
        density="compact"
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          {DELIVERY_AREAS.map((area) => (
            <li
              key={area}
              className="border border-parchment px-4 py-3 text-sm text-bark"
            >
              {area}
            </li>
          ))}
        </ul>
        <p className="type-page-body mt-6 text-sm text-stone">
          Not sure if we reach you?{" "}
          <Link
            href="/contact"
            className="text-bark underline underline-offset-4 decoration-parchment hover:text-salmon-dark"
          >
            Just ask.
          </Link>
        </p>
      </Section>

      <Section
        id="order-inquiry"
        eyebrow="Order inquiry"
        title="Request your arrangement"
        description="Tell us what you need. We'll confirm within 2 hours — no charge until we've spoken with you."
        density="compact"
        variant="muted"
      >
        <div className="max-w-xl">
          <DeliveryInquiryForm />
        </div>
      </Section>

      <Section density="compact" className="!pt-0">
        <div className="max-w-2xl space-y-4">
          <h2 className="type-section-title text-xl text-bark md:text-2xl">
            A note about the flowers
          </h2>
          <p className="type-page-body leading-relaxed">
            Grey Gables is a working flower farm on Brickhouse Road in Louisa County.
            We grow what&apos;s seasonal, what&apos;s beautiful, and what lasts. Every
            arrangement is designed by hand on the farm — no warehouse, no middleman.
          </p>
          <p className="type-page-body leading-relaxed">
            Stems are cut the morning of delivery. If you want something real, local,
            and worth sending, you&apos;re in the right place.
          </p>
        </div>
      </Section>
    </>
  );
}
