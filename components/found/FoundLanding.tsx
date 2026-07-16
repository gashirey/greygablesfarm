import { Suspense } from "react";
import Image from "next/image";
import { ContactForm } from "@/components/ContactForm";
import {
  FOUND_BODY,
  FOUND_FORM_PLACEHOLDER,
  FOUND_HEADLINE,
  FOUND_HEADLINE_ACCENT,
  FOUND_IMAGE,
} from "@/lib/found/content";

function FoundInquireForm() {
  return (
    <Suspense fallback={<div className="card h-64 bg-cream" aria-hidden />}>
      <ContactForm
        defaultSubject="flowers"
        source="campaign_found_al"
        contextNote="Found us — /al QR"
        messagePlaceholder={FOUND_FORM_PLACEHOLDER}
        compact
        hideSubject
      />
    </Suspense>
  );
}

/** Production QR landing: soft band → form → photo end cap. */
export function FoundLanding() {
  return (
    <div className="bg-site-page text-bark">
      <div className="border-b border-site-border bg-site-muted-band">
        <div className="mx-auto w-full max-w-md px-5 py-7 sm:px-6 sm:py-8">
          <h1 className="font-serif text-[1.55rem] font-medium leading-[1.25] tracking-tight sm:text-[1.85rem]">
            <span className="block text-bark">{FOUND_HEADLINE}</span>
            <span className="mt-2 block text-stone sm:mt-2.5">
              {FOUND_HEADLINE_ACCENT}
            </span>
          </h1>
          <p className="mt-5 text-[0.95rem] leading-relaxed text-stone">
            {FOUND_BODY}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md px-5 py-8 sm:px-6">
        <FoundInquireForm />
      </div>

      <figure className="mx-auto w-full max-w-md px-5 pb-12 sm:px-6">
        <div className="image-frame relative aspect-[4/3] overflow-hidden bg-parchment">
          <Image
            src={FOUND_IMAGE}
            alt="Seasonal blooms from Grey Gables Farm"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 448px) 100vw, 448px"
          />
        </div>
      </figure>
    </div>
  );
}
