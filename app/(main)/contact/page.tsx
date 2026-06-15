import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/ContactForm";
import { LocationBlock } from "@/components/LocationBlock";
import { Section } from "@/components/Section";
import { SiteMediaImage } from "@/components/SiteMediaImage";
import { site } from "@/lib/content";
import { getSiteMediaSlots } from "@/lib/site-media/queries";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: `Contact ${site.name} — orders and questions.`,
  path: "/contact",
});

export default async function ContactPage() {
  const siteMedia = await getSiteMediaSlots();
  const contact = siteMedia.contact;

  return (
    <Section density="compact" className="pt-20 md:pt-28">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div className="min-h-[280px] lg:sticky lg:top-28">
          <SiteMediaImage
            media={contact}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        <div className="max-w-md">
          <h1 className="type-page-title leading-tight">Contact</h1>
          <Suspense
            fallback={
              <div className="card mt-8 h-96 bg-cream" aria-hidden />
            }
          >
            <div className="mt-6">
              <ContactForm />
            </div>
          </Suspense>
          <LocationBlock className="mt-10 border-t border-parchment pt-10" />
        </div>
      </div>
    </Section>
  );
}
