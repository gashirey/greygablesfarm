import type { Metadata } from "next";
import Link from "next/link";
import { BloomsBookingForm } from "@/components/blooms/BloomsBookingForm";
import { Hero } from "@/components/Hero";
import { Section } from "@/components/Section";
import { bloomsPackage, bloomsPaths } from "@/lib/blooms/package";
import { site } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { getStripePaymentLinkUrl } from "@/lib/stripe/config";

export const metadata: Metadata = pageMetadata({
  title: bloomsPackage.title,
  description:
    "Epic Date Night photo session among the flowers — couples portraits, edited gallery, bouquet, and mocktail. Now booking at Grey Gables Farm.",
  path: bloomsPaths.page,
});

export default function PhotosInTheBloomsPage() {
  const paymentLinkUrl = getStripePaymentLinkUrl();

  return (
    <>
      <Hero
        title={bloomsPackage.title}
        subtitle={`${bloomsPackage.status} ${bloomsPackage.packageName} — ${bloomsPackage.priceDisplay}`}
        imageSrc={site.heroImage}
        imageAlt="Couples among cut flowers at Grey Gables Farm"
        primaryCta={{ label: "Book now", href: "#book" }}
        compact
      />

      <Section density="compact">
        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-start">
          <div className="max-w-2xl space-y-6">
            <p className="type-eyebrow">{bloomsPackage.status}</p>
            <h2 className="type-section-title text-2xl md:text-3xl">
              {bloomsPackage.packageName}
            </h2>
            <p className="type-page-body text-base leading-relaxed md:text-lg">
              {bloomsPackage.headline}
            </p>
            <p className="text-3xl font-serif text-bark">{bloomsPackage.priceDisplay}</p>
            <ul className="space-y-3 border-t border-parchment pt-6">
              <li className="text-sm text-stone">{bloomsPackage.sessionLength}</li>
              {bloomsPackage.inclusions.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-bark">
                  <span className="mt-1.5 h-1 w-1 shrink-0 bg-salmon-dark" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="type-page-body text-sm leading-relaxed text-stone">
              {bloomsPackage.bookingNote}
            </p>
          </div>

          <aside className="border border-parchment p-6">
            <p className="type-eyebrow">On the farm</p>
            <p className="mt-2 text-sm leading-relaxed text-bark">
              Sessions take place in our cutting garden and greenhouse at{" "}
              {site.location}. Dress for the field — we&apos;ll guide you to the
              best light and blooms in season.
            </p>
            <p className="mt-4 text-sm text-stone">
              Questions?{" "}
              <Link
                href="/contact?subject=event"
                className="text-bark underline underline-offset-4 decoration-parchment hover:text-salmon-dark"
              >
                Contact the farm
              </Link>
            </p>
          </aside>
        </div>
      </Section>

      <Section
        id="book"
        eyebrow="Book your session"
        title="Reserve your date night"
        description="Tell us who's coming and when you'd like to visit. We'll follow up to confirm your time."
        density="compact"
        variant="muted"
      >
        <div className="max-w-xl">
          <BloomsBookingForm paymentLinkUrl={paymentLinkUrl} />
        </div>
      </Section>
    </>
  );
}
