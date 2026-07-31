/**
 * Branded Stripe line-item label checks.
 * Run: node scripts/test-stripe-labels.mjs
 */

function brandedArrangementName(productName) {
  const base = productName
    .replace(/\bGrey\s+Gables\b/gi, "")
    .replace(/\barrangement\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return `Grey Gables ${base} Arrangement`;
}

const DELIVERY_REGION_DISPLAY = {
  "Local Louisa": "Louisa County",
  "Extended Louisa": "Extended Louisa",
  "Charlottesville Area": "Charlottesville Area",
  "Greene County": "Greene County",
  "Orange County": "Orange County",
  Goochland: "Goochland",
  "Short Pump / West End": "Short Pump / West End",
};

function stripeDeliveryLabel(regionName) {
  if (!regionName?.trim()) return "Local Delivery";
  const display =
    DELIVERY_REGION_DISPLAY[regionName.trim()] ?? regionName.trim();
  return `Local Delivery — ${display}`;
}

function buildStripeCheckoutLineItems(lines, ctx) {
  return lines
    .filter((l) => l.kind !== "tax" && l.unitAmountCents > 0)
    .map((l) => {
      let name = l.label;
      if (l.kind === "arrangement") name = brandedArrangementName(ctx.productName);
      if (l.kind === "vessel") name = "Curated Keepsake Vessel Upgrade";
      if (l.kind === "delivery") name = stripeDeliveryLabel(ctx.deliveryRegionName);
      return { name, amount: l.unitAmountCents };
    });
}

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

for (const scale of ["Classic", "Signature", "Grand"]) {
  check(`arrangement ${scale}`, () => {
    const n = brandedArrangementName(scale);
    if (n !== `Grey Gables ${scale} Arrangement`) throw new Error(n);
  });
}

check("Local Louisa → Louisa County", () => {
  const n = stripeDeliveryLabel("Local Louisa");
  if (n !== "Local Delivery — Louisa County") throw new Error(n);
});

check("Charlottesville Area delivery", () => {
  const n = stripeDeliveryLabel("Charlottesville Area");
  if (n !== "Local Delivery — Charlottesville Area") throw new Error(n);
});

check("signature + vessel + louisa", () => {
  const items = buildStripeCheckoutLineItems(
    [
      { kind: "arrangement", label: "Signature", unitAmountCents: 22500, quantity: 1 },
      {
        kind: "vessel",
        label: "Curated Keepsake Vessel (+$50)",
        unitAmountCents: 5000,
        quantity: 1,
      },
      { kind: "delivery", label: "Local Louisa delivery", unitAmountCents: 1500, quantity: 1 },
    ],
    { productName: "Signature", deliveryRegionName: "Local Louisa" },
  );
  if (items.length !== 3) throw new Error(String(items.length));
  if (items[0].name !== "Grey Gables Signature Arrangement") throw new Error(items[0].name);
  if (items[1].name !== "Curated Keepsake Vessel Upgrade") throw new Error(items[1].name);
  if (items[2].name !== "Local Delivery — Louisa County") throw new Error(items[2].name);
});

check("glass vase not a line item", () => {
  const items = buildStripeCheckoutLineItems(
    [
      { kind: "arrangement", label: "Classic", unitAmountCents: 15000, quantity: 1 },
    ],
    { productName: "Classic", deliveryRegionName: null },
  );
  if (items.length !== 1) throw new Error(String(items.length));
  if (items.some((i) => /glass|vase/i.test(i.name))) throw new Error("glass line");
});

check("pickup has no $0 delivery line", () => {
  const items = buildStripeCheckoutLineItems(
    [
      { kind: "arrangement", label: "Grand", unitAmountCents: 35000, quantity: 1 },
      { kind: "delivery", label: "Pickup", unitAmountCents: 0, quantity: 1 },
    ],
    { productName: "Grand", deliveryRegionName: null },
  );
  if (items.length !== 1) throw new Error(JSON.stringify(items));
  if (items[0].name !== "Grey Gables Grand Arrangement") throw new Error(items[0].name);
});

check("zero vessel upgrade omitted", () => {
  const items = buildStripeCheckoutLineItems(
    [
      { kind: "arrangement", label: "Signature", unitAmountCents: 22500, quantity: 1 },
      { kind: "vessel", label: "Curated", unitAmountCents: 0, quantity: 1 },
    ],
    { productName: "Signature" },
  );
  if (items.length !== 1) throw new Error(String(items.length));
});

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nAll Stripe label checks passed.");
