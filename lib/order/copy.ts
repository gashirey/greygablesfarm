/**
 * Default Designer's Choice order-page copy (Concept 5c).
 * Overridable via site_settings.content_overrides.orderPage.
 */

export type OrderPageCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  /** Optional; leave empty to hide the second intro paragraph */
  supporting: string;
  /** Empty = auto season label (e.g. Summer Collection) */
  seasonalLabel: string;
  scaleNote: string;
  presentationEyebrow: string;
  presentationTitle: string;
  presentationLead: string;
  glassName: string;
  glassDescription: string;
  glassPriceLabel: string;
  curatedName: string;
  curatedDescription: string;
  selectionTitle: string;
  continueCta: string;
  continueHint: string;
  summaryEyebrow: string;
  summaryTitle: string;
  progressCreate: string;
  progressDelivery: string;
  progressCheckout: string;
  deliveryEyebrow: string;
  deliveryTitle: string;
  /** Quiet line under the page-two title */
  deliveryReassurance: string;
  deliveryLocalName: string;
  deliveryLocalBlurb: string;
  deliveryPickupName: string;
  deliveryPickupBlurb: string;
  deliveryNote: string;
  pickupNote: string;
  whereGoingTitle: string;
  zipHelper: string;
  /** Shown above the delivery date dropdown */
  deliveryDateRule: string;
  deliveryInstructionsHelper: string;
  deliveryInstructionsPlaceholder: string;
  enclosureTitle: string;
  enclosureYes: string;
  enclosureNo: string;
  enclosureHelper: string;
  enclosurePlaceholder: string;
  designerEyebrow: string;
  designerTitle: string;
  designerLead: string;
  designerPlaceholder: string;
  contactTitle: string;
  rememberLabel: string;
  reviewEyebrow: string;
  reviewTitle: string;
  backCta: string;
  checkoutCta: string;
  editArrangement: string;
  allowCustomerVesselChoice: boolean;
};

export const DEFAULT_ORDER_PAGE_COPY: OrderPageCopy = {
  eyebrow: "Seasonal Collection",
  title: "Designer's Choice Arrangements",
  lead:
    "Every Grey Gables arrangement is individually designed using the freshest flowers from our farm and trusted growers. No two arrangements are ever exactly alike.",
  supporting: "",
  seasonalLabel: "",
  scaleNote:
    "Images illustrate scale and style. Every Grey Gables arrangement is uniquely designed using the freshest seasonal flowers available.",
  presentationEyebrow: "",
  presentationTitle: "Choose Your Vessel",
  presentationLead: "",
  glassName: "Signature Glass Vase",
  glassDescription:
    "A timeless glass vase chosen to complement your arrangement.",
  glassPriceLabel: "Included with every arrangement.",
  curatedName: "Curated Keepsake Vessel",
  curatedDescription:
    "A one-of-a-kind vessel personally selected by our designers to complement your arrangement. Yours to enjoy long after the flowers have faded.",
  selectionTitle: "Your Selection",
  continueCta: "Continue to Order Details",
  continueHint: "",
  summaryEyebrow: "Your Arrangement",
  summaryTitle: "Estimated total",
  progressCreate: "Create Your Arrangement",
  progressDelivery: "Delivery & Personal Details",
  progressCheckout: "Secure Checkout",
  deliveryEyebrow: "Details",
  deliveryTitle: "How would you like to receive your arrangement?",
  deliveryReassurance:
    "Every arrangement is individually designed and prepared fresh before delivery.",
  deliveryLocalName: "Local Delivery",
  deliveryLocalBlurb: "We'll hand-deliver your arrangement to the recipient.",
  deliveryPickupName: "Farm Pickup",
  deliveryPickupBlurb: "Collect your arrangement at Grey Gables Farm in Louisa.",
  deliveryNote: "",
  pickupNote: "",
  whereGoingTitle: "Where is it going?",
  zipHelper: "We'll instantly confirm delivery availability and pricing.",
  deliveryDateRule:
    "Same-day delivery requires a phone call to confirm availability — it can’t be ordered online.",
  deliveryInstructionsHelper:
    "Optional notes for the driver. This does not guarantee a delivery time.",
  deliveryInstructionsPlaceholder:
    "Call ahead, preferred time of day, gate codes, porch notes…",
  enclosureTitle: "Include a handwritten enclosure card?",
  enclosureYes: "Yes",
  enclosureNo: "No thanks",
  enclosureHelper:
    "Your message will be handwritten and included with the arrangement.",
  enclosurePlaceholder: "Your personal message...",
  designerEyebrow: "",
  designerTitle: "Anything you'd like our designer to know?",
  designerLead:
    "Tell us about the occasion, favorite flowers or colors, or anything you'd like us to consider. Every Grey Gables arrangement is uniquely designed using the freshest flowers available.",
  designerPlaceholder: "Occasion, favorite colors, or anything to consider…",
  contactTitle: "Your Information",
  rememberLabel: "Remember me on this device",
  reviewEyebrow: "",
  reviewTitle: "Your Arrangement",
  backCta: "Back to Arrangement",
  checkoutCta: "Continue to Secure Checkout",
  editArrangement: "Edit Arrangement",
  allowCustomerVesselChoice: false,
};

/** Understated seasonal cue when CMS seasonalLabel is empty. */
export function resolveSeasonalLabel(
  override?: string | null,
  date: Date = new Date(),
): string {
  const custom = override?.trim();
  if (custom) return custom;
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "Spring Collection";
  if (month >= 5 && month <= 7) return "Summer Collection";
  if (month >= 8 && month <= 10) return "Autumn Collection";
  return "Winter Collection";
}

export function mergeOrderPageCopy(
  overrides?: Partial<OrderPageCopy> | null,
): OrderPageCopy {
  return {
    ...DEFAULT_ORDER_PAGE_COPY,
    ...(overrides ?? {}),
  };
}
