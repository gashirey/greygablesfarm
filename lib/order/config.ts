/**
 * Reservation hold duration before inventory returns.
 * Must be ≥ 30 minutes so it can match Stripe Checkout's minimum `expires_at`.
 */
export const RESERVATION_MINUTES = 30;

/** Stripe Checkout metadata kind for flower self-service orders. */
export const STRIPE_KIND_FLOWER_ORDER = "flower_order";
export const STRIPE_KIND_BLOOMS = "blooms";

/**
 * When true, Stripe Checkout enables automatic_tax.
 * Set STRIPE_AUTOMATIC_TAX=true and configure tax in the Stripe Dashboard —
 * do not hardcode rates in app code.
 */
export function isStripeTaxEnabled(): boolean {
  const raw = process.env.STRIPE_AUTOMATIC_TAX?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}
