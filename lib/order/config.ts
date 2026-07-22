/** Reservation hold duration before inventory returns. */
export const RESERVATION_MINUTES = 20;

/** Stripe Checkout metadata kind for flower self-service orders. */
export const STRIPE_KIND_FLOWER_ORDER = "flower_order";
export const STRIPE_KIND_BLOOMS = "blooms";

/** When true, Stripe Checkout enables automatic_tax (configure rates in Stripe Dashboard). */
export function isStripeTaxEnabled(): boolean {
  const raw = process.env.STRIPE_AUTOMATIC_TAX?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}
