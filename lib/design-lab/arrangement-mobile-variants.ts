export type ArrangementMobileId = "1" | "2" | "3" | "4" | "5";

export type FoundLayoutId = "soft-band";

export type ArrangementMobileVariant = {
  id: ArrangementMobileId;
  name: string;
  pitch: string;
  layout: FoundLayoutId;
  /** Header brand text color for this mock */
  brandColor: string;
  imageObjectClass: string;
  eyebrow: string;
  headline: string;
  headlineAccent?: string;
  body: string;
  formPlaceholder: string;
};

/** End-cap arrangement photo */
export const CAMPAIGN_MOBILE_IMAGE =
  "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1783597334234-IN7A6007-1aec4705.jpg";

const FOUND_HEADLINE = "Local flowers.";
const FOUND_HEADLINE_ACCENT = "Inspired design.";
const FOUND_BODY =
  "Custom arrangements designed with fresh flowers harvested from Grey Gables in Louisa, Virginia. If you have a need for a stunning, flower-forward arrangement, we'd love to create something unique and special for your home, office or next intimate gathering.";

/** Locked brand color (chosen: chartreuse) */
const FOUND_BRAND_COLOR = "#9aab5c";

/**
 * Soft-band + chartreuse brand locked.
 * found/1–5 = message placeholder options.
 */
export const arrangementMobileVariants: ArrangementMobileVariant[] = [
  {
    id: "1",
    name: "Occasion + space",
    pitch: "Placeholder: occasion and where it goes.",
    layout: "soft-band",
    brandColor: FOUND_BRAND_COLOR,
    imageObjectClass: "object-cover object-center",
    eyebrow: "",
    headline: FOUND_HEADLINE,
    headlineAccent: FOUND_HEADLINE_ACCENT,
    body: FOUND_BODY,
    formPlaceholder: "Occasion, space, and any colors or flowers you love…",
  },
  {
    id: "2",
    name: "Home office event",
    pitch: "Placeholder: home, office, or gathering.",
    layout: "soft-band",
    brandColor: FOUND_BRAND_COLOR,
    imageObjectClass: "object-cover object-center",
    eyebrow: "",
    headline: FOUND_HEADLINE,
    headlineAccent: FOUND_HEADLINE_ACCENT,
    body: FOUND_BODY,
    formPlaceholder: "Home, office, or intimate gathering — and when you need it…",
  },
  {
    id: "3",
    name: "Tell us more",
    pitch: "Placeholder: open invite.",
    layout: "soft-band",
    brandColor: FOUND_BRAND_COLOR,
    imageObjectClass: "object-cover object-center",
    eyebrow: "",
    headline: FOUND_HEADLINE,
    headlineAccent: FOUND_HEADLINE_ACCENT,
    body: FOUND_BODY,
    formPlaceholder: "Tell us a little about the arrangement you have in mind…",
  },
  {
    id: "4",
    name: "Style + date",
    pitch: "Placeholder: style and timing.",
    layout: "soft-band",
    brandColor: FOUND_BRAND_COLOR,
    imageObjectClass: "object-cover object-center",
    eyebrow: "",
    headline: FOUND_HEADLINE,
    headlineAccent: FOUND_HEADLINE_ACCENT,
    body: FOUND_BODY,
    formPlaceholder: "Style, size, and the date you have in mind…",
  },
  {
    id: "5",
    name: "Where you saw us",
    pitch: "Placeholder: where they found the work.",
    layout: "soft-band",
    brandColor: FOUND_BRAND_COLOR,
    imageObjectClass: "object-cover object-center",
    eyebrow: "",
    headline: FOUND_HEADLINE,
    headlineAccent: FOUND_HEADLINE_ACCENT,
    body: FOUND_BODY,
    formPlaceholder: "Where you saw our work, and what you’d like us to create…",
  },
];

export function getArrangementMobileVariant(
  id: string,
): ArrangementMobileVariant | undefined {
  return arrangementMobileVariants.find((v) => v.id === id);
}

export function foundBrandColorForPath(pathname: string): string | null {
  const match = pathname.match(/^\/found\/([1-5])\/?$/);
  if (!match) return null;
  const variant = getArrangementMobileVariant(match[1]);
  return variant?.brandColor ?? null;
}
