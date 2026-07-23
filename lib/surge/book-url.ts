/**
 * Customer-facing booking URL (Surge /book).
 * Override with NEXT_PUBLIC_SURGE_BOOK_ORIGIN when needed.
 */
export function surgeBookOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SURGE_BOOK_ORIGIN?.trim().replace(/\/$/, "") ||
    "https://www.shireyegroup.com"
  );
}

export function surgeExperienceBookUrl(
  experienceSlug: string,
  businessSlug = "grey-gables",
): string {
  const slug = experienceSlug.trim().replace(/^\/+|\/+$/g, "");
  return `${surgeBookOrigin()}/book/${businessSlug}/${slug}`;
}
