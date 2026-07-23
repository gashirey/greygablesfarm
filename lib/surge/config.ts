export function getSurgeBusinessApiConfig() {
  const base = process.env.SURGE_BUSINESS_API_BASE?.trim().replace(/\/$/, "");
  const apiKey = process.env.SURGE_GREY_GABLES_API_KEY?.trim();
  const businessSlug =
    process.env.SURGE_GREY_GABLES_BUSINESS_SLUG?.trim() || "grey-gables";

  return {
    base,
    apiKey,
    businessSlug,
    configured: Boolean(base && apiKey),
  };
}
