export type ArrangementBVariantId = "1" | "2" | "3" | "4" | "5";

export type ArrangementBVariant = {
  id: ArrangementBVariantId;
  name: string;
  pitch: string;
  /** Locked to B1 structure: photo left, copy right */
  imageSide: "left";
  imageSrc: string;
  imageAlt: string;
  imageObjectClass: string;
  eyebrow: string;
  headline: string;
  headlineAccent?: string;
  body: string;
  safetyLine: string;
  formPlaceholder: string;
};

/** Chosen arrangement photo for the “found us” campaign landing */
export const CAMPAIGN_ARRANGEMENT_IMAGE =
  "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1780672498716-1X3A1176-a2b78286.jpg";

/**
 * Pass B structure (B1 layout): photo left · copy + form right.
 * Tight: headline, paragraph, safety, form — nothing else.
 */
export const arrangementBVariants: ArrangementBVariant[] = [
  {
    id: "1",
    name: "Make it your own",
    pitch: "B4 body energy + Make it your own + B1 layout.",
    imageSide: "left",
    imageSrc: CAMPAIGN_ARRANGEMENT_IMAGE,
    imageAlt: "Hand-tied seasonal arrangement from Grey Gables Farm",
    imageObjectClass: "object-cover object-center",
    eyebrow: "Grey Gables Farm",
    headline: "Saw something you loved?",
    headlineAccent: "Make it your own!",
    body: "Custom arrangements from our fields — for the home that wants real flowers, the business that wants something local, or an intimate gathering that needs a quiet kind of beauty.",
    safetyLine:
      "Grown without chemicals or pesticides. Safe to have in your home.",
    formPlaceholder: "Where you saw us, and what you're imagining…",
  },
  {
    id: "2",
    name: "Local farm headliner",
    pitch: "Real flowers · local farm as the headline pair.",
    imageSide: "left",
    imageSrc: CAMPAIGN_ARRANGEMENT_IMAGE,
    imageAlt: "Seasonal arrangement from Grey Gables Farm",
    imageObjectClass: "object-cover object-[center_40%]",
    eyebrow: "Grey Gables · Louisa County",
    headline: "Real flowers.",
    headlineAccent: "From a local farm.",
    body: "Custom arrangements from our fields — for homes, businesses, and intimate gatherings. If you saw our work out in the world and wanted that feeling for yourself, we can arrange something of your own.",
    safetyLine:
      "No chemicals. No pesticides. Safe to have in your home.",
    formPlaceholder: "The space, the season, what you noticed…",
  },
  {
    id: "3",
    name: "Safe & intimate",
    pitch: "Chemical-free lead + intimate gatherings.",
    imageSide: "left",
    imageSrc: CAMPAIGN_ARRANGEMENT_IMAGE,
    imageAlt: "Close view of a Grey Gables arrangement",
    imageObjectClass: "object-cover object-[center_55%]",
    eyebrow: "Grown for living with",
    headline: "Saw something you loved?",
    headlineAccent: "Make it your own!",
    body: "We grow seasonal blooms on our Louisa County farm and arrange them by hand — for homes, local businesses, and intimate gatherings where the flowers can still feel personal.",
    safetyLine:
      "Safe to have in your home — we grow without chemicals or pesticides.",
    formPlaceholder: "What you saw — and what you need…",
  },
  {
    id: "4",
    name: "From the field",
    pitch: "Farm-first headline + B4 paragraph.",
    imageSide: "left",
    imageSrc: CAMPAIGN_ARRANGEMENT_IMAGE,
    imageAlt: "Grey Gables Farm arrangement",
    imageObjectClass: "object-cover object-[center_45%]",
    eyebrow: "Brickhouse Road · Louisa County",
    headline: "Real flowers from a local farm.",
    headlineAccent: "Make it your own!",
    body: "Custom arrangements from our fields — for the home that wants real flowers, the business that wants something local, or an intimate gathering that needs a quiet kind of beauty.",
    safetyLine:
      "Grown without chemicals or pesticides. Safe to have in your home.",
    formPlaceholder: "Home, business, or an intimate event — and when…",
  },
  {
    id: "5",
    name: "Quiet & clear",
    pitch: "Short lines; local-farm headline; intimate events.",
    imageSide: "left",
    imageSrc: CAMPAIGN_ARRANGEMENT_IMAGE,
    imageAlt: "Grey Gables Farm arrangement",
    imageObjectClass: "object-cover object-[center_50%]",
    eyebrow: "Central Virginia · Farm-grown",
    headline: "Real flowers.",
    headlineAccent: "From a local farm.",
    body: "You saw our arrangements. This is who grows them — for homes, businesses, and intimate events. Make it your own.",
    safetyLine: "No chemicals. No pesticides. Safe in your home.",
    formPlaceholder: "A few sentences is plenty…",
  },
];

export function getArrangementBVariant(
  id: string,
): ArrangementBVariant | undefined {
  return arrangementBVariants.find((v) => v.id === id);
}
