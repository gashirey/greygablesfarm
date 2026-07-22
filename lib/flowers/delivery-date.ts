/** Farm delivery calendar — America/New_York (Charlottesville area). */
export const DELIVERY_TIMEZONE = "America/New_York";
export const SAME_DAY_CUTOFF_HOUR = 10;

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: DELIVERY_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const weekdayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DELIVERY_TIMEZONE,
  weekday: "short",
});

const hourFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DELIVERY_TIMEZONE,
  hour: "numeric",
  hour12: false,
});

/** YYYY-MM-DD in the delivery timezone. */
export function todayInDeliveryZone(now = new Date()): string {
  return dateFmt.format(now);
}

export function localHourInDeliveryZone(now = new Date()): number {
  const raw = hourFmt.format(now);
  // hour12:false can still yield "24" at midnight in some engines
  const hour = Number(raw);
  return hour === 24 ? 0 : hour;
}

export function isPastSameDayCutoff(now = new Date()): boolean {
  return localHourInDeliveryZone(now) >= SAME_DAY_CUTOFF_HOUR;
}

/** Sunday = 0 … Saturday = 6 in the delivery timezone. */
export function weekdayInDeliveryZone(isoDate: string): number {
  // Noon UTC avoids DST edge cases when interpreting a calendar date.
  const probe = new Date(`${isoDate}T12:00:00Z`);
  const wd = weekdayFmt.format(probe);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd] ?? 0;
}

/** Delivery days: Tuesday–Saturday. */
export function isDeliverableWeekday(isoDate: string): boolean {
  const day = weekdayInDeliveryZone(isoDate);
  return day >= 2 && day <= 6;
}

export function addCalendarDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function nextDeliverableDate(fromIso: string): string {
  let cursor = fromIso;
  for (let i = 0; i < 14; i++) {
    if (isDeliverableWeekday(cursor)) return cursor;
    cursor = addCalendarDays(cursor, 1);
  }
  return fromIso;
}

/**
 * Earliest selectable delivery date.
 * After 10am local, same-day is unavailable — advance to the next deliverable day.
 */
export function earliestDeliveryDate(now = new Date()): string {
  const today = todayInDeliveryZone(now);
  if (isPastSameDayCutoff(now)) {
    return nextDeliverableDate(addCalendarDays(today, 1));
  }
  return nextDeliverableDate(today);
}

/**
 * If the user picks today after the cutoff, return the auto-advanced date
 * and a note. Otherwise return the selected date unchanged.
 */
export function resolveDeliveryDateSelection(
  selected: string,
  now = new Date(),
): { date: string; cutoffNote: boolean } {
  const today = todayInDeliveryZone(now);
  if (selected === today && isPastSameDayCutoff(now)) {
    return {
      date: nextDeliverableDate(addCalendarDays(today, 1)),
      cutoffNote: true,
    };
  }
  if (!isDeliverableWeekday(selected)) {
    return { date: nextDeliverableDate(selected), cutoffNote: false };
  }
  return { date: selected, cutoffNote: false };
}

export const SAME_DAY_CUTOFF_NOTE =
  "Same-day cutoff is 10am — we'll deliver tomorrow.";
