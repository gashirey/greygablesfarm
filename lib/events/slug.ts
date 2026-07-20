const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export function normalizeEventSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isEventSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}
