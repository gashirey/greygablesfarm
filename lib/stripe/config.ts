/** Stripe — can reuse the same account as Rooted Farmers / Shopify */

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim(),
  );
}

export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return key;
}

export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

/** Optional pre-built Payment Link from Stripe Dashboard (works without Checkout API) */
export function getStripePaymentLinkUrl(): string | null {
  return process.env.STRIPE_BLOOMS_PAYMENT_LINK?.trim() || null;
}
