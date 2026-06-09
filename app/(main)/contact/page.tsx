import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { Section } from "@/components/Section";
import { ContactForm } from "@/components/ContactForm";
import { LocationBlock } from "@/components/LocationBlock";
import { site } from "@/lib/content";
import { focalObjectPosition } from "@/lib/site-cms/focal";
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
        <div className="relative aspect-[4/5] min-h-[320px] w-full bg-parchment lg:aspect-[3/4]">
          <Image
            src={contact.imageUrl}
            alt={contact.alt}
            fill
            priority
            className="object-cover"
            style={{
              objectPosition: focalObjectPosition(contact.focalX, contact.focalY),
            }}
            sizes="(max-width: 1024px) 100vw, 50vw"
            unoptimized={contact.imageUrl.startsWith("http")}
          />
        </div>

        <div className="max-w-md">
          <h1 className="type-page-title leading-tight">Contact</h1>
          <Suspense
            fallback={<div className="card mt-8 h-96 bg-parchment" aria-hidden />}
          >
            <div className="mt-8">
              <ContactForm />
            </div>
          </Suspense>
          <LocationBlock className="mt-12 border-t border-parchment pt-12" />
        </div>
      </div>
    </Section>
  );
}
