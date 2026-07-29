/**
 * Default Designer's Choice order-page copy (Concept 5c).
 * Overridable via site_settings.content_overrides.orderPage.
 */

export type OrderPageCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  supporting: string;
  scaleNote: string;
  presentationEyebrow: string;
  presentationTitle: string;
  presentationLead: string;
  glassName: string;
  glassDescription: string;
  glassPriceLabel: string;
  curatedName: string;
  curatedDescription: string;
  continueCta: string;
  continueHint: string;
  summaryEyebrow: string;
  summaryTitle: string;
  progressCreate: string;
  progressDelivery: string;
  progressCheckout: string;
  deliveryEyebrow: string;
  deliveryTitle: string;
  deliveryLocalName: string;
  deliveryLocalBlurb: string;
  deliveryPickupName: string;
  deliveryPickupBlurb: string;
  deliveryNote: string;
  pickupNote: string;
  giftTitle: string;
  giftYes: string;
  giftNo: string;
  cardHelper: string;
  cardPlaceholder: string;
  noCardLabel: string;
  hidePricingLabel: string;
  designerEyebrow: string;
  designerTitle: string;
  designerLead: string;
  designerPlaceholder: string;
  reviewEyebrow: string;
  reviewTitle: string;
  backCta: string;
  checkoutCta: string;
  editArrangement: string;
  allowCustomerVesselChoice: boolean;
};

export const DEFAULT_ORDER_PAGE_COPY: OrderPageCopy = {
  eyebrow: "Shop Flowers",
  title: "Designer's Choice Arrangements",
  lead:
    "Every Grey Gables arrangement is individually created using the freshest flowers available from our farm and trusted growers.",
  supporting:
    "No two arrangements are exactly alike. Choose the scale, presentation, and occasion — then leave the artistry to us.",
  scaleNote:
    "The images above show scale only — not the arrangement you will receive. Every Grey Gables arrangement is designed as a one-of-a-kind piece by our on-site artist, using the freshest seasonal flowers available.",
  presentationEyebrow: "Presentation",
  presentationTitle: "How it arrives",
  presentationLead: "Ready to display in a vessel — never a wrapped bouquet.",
  glassName: "Signature Glass Vase",
  glassDescription: "A timeless glass vase chosen to suit your arrangement.",
  glassPriceLabel: "Included",
  curatedName: "Curated Keepsake Vessel",
  curatedDescription:
    "A distinctive vessel selected for your arrangement — yours to keep.",
  continueCta: "Continue with Your Arrangement",
  continueHint: "Next: delivery & personal details.",
  summaryEyebrow: "Your arrangement",
  summaryTitle: "Designer's Choice",
  progressCreate: "Create Your Arrangement",
  progressDelivery: "Delivery & Personal Details",
  progressCheckout: "Secure Checkout",
  deliveryEyebrow: "Fulfillment",
  deliveryTitle: "How should your arrangement arrive?",
  deliveryLocalName: "Local Delivery",
  deliveryLocalBlurb: "We bring your arrangement to the recipient.",
  deliveryPickupName: "Farm Pickup",
  deliveryPickupBlurb: "Collect at Grey Gables Farm in Louisa.",
  deliveryNote:
    "Local delivery within our service area. Fee is calculated from your ZIP.",
  pickupNote:
    "Pickup at Grey Gables Farm. We'll confirm your window after the order is placed.",
  giftTitle: "Is this arrangement a gift?",
  giftYes: "Yes",
  giftNo: "No",
  cardHelper: "Keep it short and personal.",
  cardPlaceholder: "Write a short message for the enclosure card…",
  noCardLabel: "No card message",
  hidePricingLabel: "Do not include pricing",
  designerEyebrow: "For our designer",
  designerTitle: "Anything helpful for our designer to know?",
  designerLead:
    "Share the occasion, a feeling you'd like the arrangement to convey, or anything we should avoid. Flower varieties and exact colors cannot be guaranteed—we'll always design using the freshest and most beautiful flowers available. This is guidance, not instructions.",
  designerPlaceholder:
    "Occasion, feeling, or anything we should avoid — guidance, not a recipe.",
  reviewEyebrow: "Review",
  reviewTitle: "Before you continue",
  backCta: "Back to Arrangement",
  checkoutCta: "Review & Complete Order",
  editArrangement: "Edit Arrangement",
  allowCustomerVesselChoice: false,
};

export function mergeOrderPageCopy(
  overrides?: Partial<OrderPageCopy> | null,
): OrderPageCopy {
  return {
    ...DEFAULT_ORDER_PAGE_COPY,
    ...(overrides ?? {}),
  };
}
