/** Locked QR landing — /found (short link /al) */

export const FOUND_PAGE_PATH = "/found";

export const FOUND_BRAND_COLOR = "#9aab5c";

export const FOUND_IMAGE =
  "https://ksvhmvpnshccetlavvaz.supabase.co/storage/v1/object/public/product-photos/library/may-19-26/1783597334234-IN7A6007-1aec4705.jpg";

export const FOUND_HEADLINE = "Local flowers.";
export const FOUND_HEADLINE_ACCENT = "Inspired design.";

export const FOUND_BODY =
  "Custom arrangements designed with fresh flowers harvested from Grey Gables in Louisa, Virginia. If you have a need for a stunning, flower-forward arrangement, we'd love to create something unique and special for your home, office or next intimate gathering.";

export const FOUND_FORM_PLACEHOLDER =
  "Where you saw our work, and what you'd like us to create…";

export const FOUND_META = {
  title: "Local flowers. Inspired design.",
  description: FOUND_BODY,
} as const;

export function isFoundCampaignPath(pathname: string): boolean {
  return pathname === FOUND_PAGE_PATH || pathname === `${FOUND_PAGE_PATH}/`;
}
