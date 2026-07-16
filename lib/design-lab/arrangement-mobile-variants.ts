export type ArrangementMobileId = "1" | "2" | "3" | "4" | "5";

export type ArrangementMobileVariant = {
  id: ArrangementMobileId;
  name: string;
  pitch: string;
  /** object-position crop into the landscape source for a phone strip */
  imageObjectClass: string;
  eyebrow: string;
  headline: string;
  headlineAccent?: string;
  body: string;
  formPlaceholder: string;
};

/** End-cap arrangement photo (below the form) */
export const CAMPAIGN_MOBILE_IMAGE =
  "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1783597334234-IN7A6007-1aec4705.jpg";

/**
 * Phone-first QR landing variants.
 * Copy + form first; image as end cap.
 */
export const arrangementMobileVariants: ArrangementMobileVariant[] = [
  {
    id: "1",
    name: "Make it your own",
    pitch: "Your favorite headline + paragraph.",
    imageObjectClass: "object-cover object-center",
    eyebrow: "Grey Gables Farm",
    headline: "Saw something you loved?",
    headlineAccent: "Make it your own!",
    body: "Custom arrangements from our fields — for the home that wants real flowers, the business that wants something local, or an intimate gathering that needs a quiet kind of beauty.",
    formPlaceholder: "Where you saw us, and what you need…",
  },
  {
    id: "2",
    name: "Local farm",
    pitch: "Real flowers / local farm headliner.",
    imageObjectClass: "object-cover object-[50%_45%]",
    eyebrow: "Grey Gables · Louisa County",
    headline: "Real flowers.",
    headlineAccent: "From a local farm.",
    body: "Custom arrangements from our fields — for homes, businesses, and intimate gatherings. If you saw our work out in the world, we can arrange something of your own.",
    formPlaceholder: "Home, business, or an intimate event…",
  },
  {
    id: "3",
    name: "Own it short",
    pitch: "Make it your own as the lead line.",
    imageObjectClass: "object-cover object-[55%_40%]",
    eyebrow: "Farm-grown · Central Virginia",
    headline: "Make it your own!",
    body: "You saw our arrangements. We grow them here — for homes, businesses, and intimate gatherings. Real flowers from a local farm.",
    formPlaceholder: "What you saw — and what you're hoping for…",
  },
  {
    id: "4",
    name: "Farm + own",
    pitch: "Local-farm line + Make it your own.",
    imageObjectClass: "object-cover object-[45%_50%]",
    eyebrow: "Grey Gables Farm",
    headline: "Real flowers from a local farm.",
    headlineAccent: "Make it your own!",
    body: "Custom arrangements from our fields — for the home that wants real flowers, the business that wants something local, or an intimate gathering that needs a quiet kind of beauty.",
    formPlaceholder: "A few sentences about what you need…",
  },
  {
    id: "5",
    name: "Quiet ask",
    pitch: "Shortest copy; same photo language.",
    imageObjectClass: "object-cover object-[60%_42%]",
    eyebrow: "Grey Gables · Louisa",
    headline: "Saw something you loved?",
    headlineAccent: "Make it your own!",
    body: "Arrangements grown and made on our farm — for homes, businesses, and intimate events.",
    formPlaceholder: "Tell us what you need…",
  },
];

export function getArrangementMobileVariant(
  id: string,
): ArrangementMobileVariant | undefined {
  return arrangementMobileVariants.find((v) => v.id === id);
}
