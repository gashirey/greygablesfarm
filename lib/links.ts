/**
 * External links — update when Rooted Farmers goes live.
 */
export const links = {
  rootedFarmers: "" as string,
  shopify: "" as string,
} as const;

export function getRootedFarmersHref(options?: {
  availabilityPageEnabled?: boolean;
}): string {
  if (links.rootedFarmers) return links.rootedFarmers;
  return options?.availabilityPageEnabled === false
    ? "/contact"
    : "/available-now";
}
