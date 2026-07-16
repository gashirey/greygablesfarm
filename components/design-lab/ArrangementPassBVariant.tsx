import { Suspense } from "react";
import Image from "next/image";
import { ContactForm } from "@/components/ContactForm";
import type { ArrangementBVariant } from "@/lib/design-lab/arrangement-b-variants";

function InquireForm({
  variantId,
  placeholder,
}: {
  variantId: string;
  placeholder: string;
}) {
  return (
    <Suspense fallback={<div className="card h-80 bg-cream" aria-hidden />}>
      <ContactForm
        defaultSubject="flowers"
        source={`campaign_found_b${variantId}`}
        contextNote={`Found us — B${variantId}`}
        messagePlaceholder={placeholder}
      />
    </Suspense>
  );
}

/** Shared Pass B structure — wording and image supplied by variant data. */
export function ArrangementPassBVariant({
  variant,
}: {
  variant: ArrangementBVariant;
}) {
  const photo = (
    <div className="relative min-h-[40vh] lg:min-h-full lg:sticky lg:top-0 lg:h-screen">
      <Image
        src={variant.imageSrc}
        alt={variant.imageAlt}
        fill
        priority
        className={variant.imageObjectClass}
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
    </div>
  );

  const copy = (
    <div className="flex flex-col justify-center px-8 py-12 md:px-14 lg:py-16">
      <p className="text-xs uppercase tracking-[0.22em] text-stone">
        {variant.eyebrow}
      </p>
      <h1 className="mt-6 font-serif text-4xl font-medium leading-[1.15] md:text-5xl">
        {variant.headline}
        {variant.headlineAccent ? (
          <>
            <br />
            <span className="text-stone">{variant.headlineAccent}</span>
          </>
        ) : null}
      </h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-stone">
        {variant.body}
      </p>
      <p className="mt-5 max-w-md text-sm font-medium leading-relaxed text-bark">
        {variant.safetyLine}
      </p>
      <div className="mt-8 max-w-md">
        <InquireForm
          variantId={variant.id}
          placeholder={variant.formPlaceholder}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-[#f7f4f0] text-bark">
      <div className="mx-auto grid max-w-6xl lg:grid-cols-2 lg:items-start">
        {variant.imageSide === "left" ? (
          <>
            {photo}
            {copy}
          </>
        ) : (
          <>
            {copy}
            {photo}
          </>
        )}
      </div>
    </div>
  );
}
