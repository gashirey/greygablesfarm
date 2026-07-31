/**
 * Canonical delivery regions + ZIP map (July 2026 revision).
 * Kept in sync with supabase/migrations/033 + 034 and scripts/seed-delivery-regions.mjs.
 * Authoritative runtime source is the database.
 */

export type DeliveryRegionSeed = {
  name: string;
  feeCents: number;
  sortOrder: number;
  zips: string[];
};

export const LAUNCH_DELIVERY_REGIONS: DeliveryRegionSeed[] = [
  {
    name: "Charlottesville Area",
    feeCents: 2500,
    sortOrder: 10,
    zips: ["22901", "22902", "22903", "22911"],
  },
  {
    name: "Greene County",
    feeCents: 2500,
    sortOrder: 20,
    zips: ["22968", "22973"],
  },
  {
    name: "Orange County",
    feeCents: 2500,
    sortOrder: 30,
    zips: ["22923", "22942", "22960"],
  },
  {
    name: "Local Louisa",
    feeCents: 1500,
    sortOrder: 40,
    zips: ["23093"],
  },
  {
    name: "Extended Louisa",
    feeCents: 2500,
    sortOrder: 45,
    zips: ["23024"],
  },
  {
    name: "Lake Monticello & Fluvanna",
    feeCents: 2500,
    sortOrder: 50,
    zips: ["22963"],
  },
  {
    name: "Goochland",
    feeCents: 4000,
    sortOrder: 60,
    zips: ["23063", "23065", "23129"],
  },
  {
    name: "Short Pump / West End",
    feeCents: 5000,
    sortOrder: 70,
    zips: ["23059", "23233"],
  },
];

export function zipFeeLookupTable(): Map<string, { regionName: string; feeCents: number }> {
  const map = new Map<string, { regionName: string; feeCents: number }>();
  for (const region of LAUNCH_DELIVERY_REGIONS) {
    for (const zip of region.zips) {
      map.set(zip, { regionName: region.name, feeCents: region.feeCents });
    }
  }
  return map;
}

/**
 * Normalize ZIP input to a 5-digit string, or null if invalid.
 * Accepts ZIP+4 (`22960-1234` or `229601234`). Rejects bare 6–8 digit strings.
 */
export function normalizeDeliveryZip(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const zipPlus4 = trimmed.match(/^(\d{5})-?(\d{4})$/);
  if (zipPlus4) return zipPlus4[1];

  if (/^\d{5}$/.test(trimmed)) return trimmed;

  // Digits-only fallback: exactly 5, or 9 as ZIP+4 without separator
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 5) return digits;
  if (digits.length === 9) return digits.slice(0, 5);
  return null;
}
