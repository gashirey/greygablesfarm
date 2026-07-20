import type { FarmEventDate } from "./types";

/** Format a date-only ISO string (YYYY-MM-DD) in local calendar sense. */
export function formatEventDay(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEventDateRange(row: FarmEventDate): string {
  const start = formatEventDay(row.starts_on);
  if (!row.ends_on || row.ends_on === row.starts_on) return start;
  return `${start} – ${formatEventDay(row.ends_on)}`;
}

export function splitParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function splitBulletLines(body: string): string[] {
  return body
    .split(/\n/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

export function eventHasRequiredImages(event: {
  index_image_url?: string | null;
  detail_image_url?: string | null;
}): boolean {
  return Boolean(event.index_image_url?.trim() && event.detail_image_url?.trim());
}
