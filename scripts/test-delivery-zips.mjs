/**
 * Delivery ZIP eligibility + fee checks.
 *
 * Offline: validates canonical seed table in this file.
 * Live (optional): POST /api/order/zone-lookup when BASE_URL is set.
 *
 * Run: node scripts/test-delivery-zips.mjs
 * Live: BASE_URL=http://127.0.0.1:3000 node scripts/test-delivery-zips.mjs
 */

const EXPECTED = [
  ["22901", "Charlottesville Area", 2500],
  ["22902", "Charlottesville Area", 2500],
  ["22903", "Charlottesville Area", 2500],
  ["22911", "Charlottesville Area", 2500],
  ["22968", "Greene County", 2500],
  ["22973", "Greene County", 2500],
  ["22923", "Orange County", 2500],
  ["22942", "Orange County", 2500],
  ["22960", "Orange County", 2500],
  ["23093", "Local Louisa", 1500],
  ["23024", "Extended Louisa", 2500],
  ["22963", "Lake Monticello & Fluvanna", 2500],
  ["23063", "Goochland", 4000],
  ["23065", "Goochland", 4000],
  ["23129", "Goochland", 4000],
  ["23059", "Short Pump / West End", 5000],
  ["23233", "Short Pump / West End", 5000],
];

const UNSUPPORTED = [
  "22932",
  "22920",
  "22958",
  "23220",
  "",
  "2296",
  "229601",
  "abcde",
];

function normalizeDeliveryZip(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  const zipPlus4 = trimmed.match(/^(\d{5})-?(\d{4})$/);
  if (zipPlus4) return zipPlus4[1];
  if (/^\d{5}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 5) return digits;
  if (digits.length === 9) return digits.slice(0, 5);
  return null;
}

const table = new Map(
  EXPECTED.map(([zip, regionName, feeCents]) => [
    zip,
    { regionName, feeCents },
  ]),
);

let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log("ok ", name);
  } catch (e) {
    failed += 1;
    console.error("FAIL", name, e.message);
  }
}

check("seed covers 17 ZIPs", () => {
  if (EXPECTED.length !== 17) throw new Error(String(EXPECTED.length));
});

check("no duplicate ZIPs in seed", () => {
  const set = new Set(EXPECTED.map((r) => r[0]));
  if (set.size !== EXPECTED.length) throw new Error("duplicates");
});

for (const [zip, region, fee] of EXPECTED) {
  check(`seed ${zip} → ${region} $${fee / 100}`, () => {
    const hit = table.get(zip);
    if (!hit) throw new Error("missing");
    if (hit.regionName !== region) throw new Error(hit.regionName);
    if (hit.feeCents !== fee) throw new Error(String(hit.feeCents));
  });
}

check("normalize ZIP+4", () => {
  if (normalizeDeliveryZip("22960-1234") !== "22960") {
    throw new Error(normalizeDeliveryZip("22960-1234"));
  }
});

check("normalize rejects short", () => {
  if (normalizeDeliveryZip("2296") !== null) throw new Error("accepted");
});

check("unsupported ZIPs absent from seed", () => {
  for (const zip of ["22932", "22920", "22958", "23220"]) {
    if (table.has(zip)) throw new Error(`${zip} should not be eligible`);
  }
});

check("Louisa split fees", () => {
  if (table.get("23093")?.feeCents !== 1500) throw new Error("23093");
  if (table.get("23024")?.feeCents !== 2500) throw new Error("23024");
});

const base = process.env.BASE_URL;
if (base) {
  const results = [];
  for (const [zip, region, fee] of EXPECTED) {
    results.push(
      fetch(`${base}/api/order/zone-lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip }),
      }).then(async (res) => {
        const data = await res.json();
        check(`live ${zip}`, () => {
          if (!data.eligible && !data.inZone) {
            throw new Error(data.message ?? "not eligible");
          }
          const name = data.regionName ?? data.zone?.name;
          const cents = data.deliveryFeeCents ?? data.zone?.feeCents;
          if (name !== region) throw new Error(`got ${name}`);
          if (cents !== fee) throw new Error(`got ${cents}`);
        });
      }),
    );
  }
  for (const zip of UNSUPPORTED) {
    results.push(
      fetch(`${base}/api/order/zone-lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip }),
      }).then(async (res) => {
        const data = await res.json();
        check(`live unsupported ${zip || "(empty)"}`, () => {
          if (data.eligible || data.inZone) {
            throw new Error("should be ineligible");
          }
        });
      }),
    );
  }
  await Promise.all(results);
}

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nAll delivery ZIP checks passed.");
