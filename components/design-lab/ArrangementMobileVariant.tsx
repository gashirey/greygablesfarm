import { Suspense } from "react";
import Image from "next/image";
import { ContactForm } from "@/components/ContactForm";
import {
  CAMPAIGN_MOBILE_IMAGE,
  type ArrangementMobileVariant,
} from "@/lib/design-lab/arrangement-mobile-variants";

function MobileInquireForm({
  variantId,
  placeholder,
}: {
  variantId: string;
  placeholder: string;
}) {
  return (
    <Suspense fallback={<div className="card h-64 bg-cream" aria-hidden />}>
      <ContactForm
        defaultSubject="flowers"
        source={`campaign_found_m${variantId}`}
        contextNote={`Found us — mobile M${variantId}`}
        messagePlaceholder={placeholder}
        compact
        hideSubject
      />
    </Suspense>
  );
}

type Props = {
  variant: ArrangementMobileVariant;
  siteChrome?: boolean;
};

/**
 * Soft-band layout: muted opening band → form → photo end cap.
 * Header brand color is set per /found/n via Header.
 */
export function ArrangementMobileVariantView({
  variant,
  siteChrome = false,
}: Props) {
  return (
    <div className={siteChrome ? "bg-site-page text-bark" : "bg-[#f7f4f0] text-bark"}>
      <div className="border-b border-site-border bg-site-muted-band">
        <div className="mx-auto w-full max-w-md px-5 py-7 sm:px-6 sm:py-8">
          <h1 className="font-serif text-[1.55rem] font-medium leading-[1.25] tracking-tight sm:text-[1.85rem]">
            <span className="block text-bark">{variant.headline}</span>
            {variant.headlineAccent ? (
              <span className="mt-2 block text-stone sm:mt-2.5">
                {variant.headlineAccent}
              </span>
            ) : null}
          </h1>
          <p className="mt-5 text-[0.95rem] leading-relaxed text-stone">
            {variant.body}
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md px-5 py-8 sm:px-6">
        <MobileInquireForm
          variantId={variant.id}
          placeholder={variant.formPlaceholder}
        />
      </div>
      <figure className="mx-auto w-full max-w-md px-5 pb-12 sm:px-6">
        <div className="image-frame relative aspect-[4/3] overflow-hidden bg-parchment">
          <Image
            src={CAMPAIGN_MOBILE_IMAGE}
            alt="Seasonal blooms from Grey Gables Farm"
            fill
            className={variant.imageObjectClass}
            sizes="(max-width: 448px) 100vw, 448px"
          />
        </div>
      </figure>
    </div>
  );
}
