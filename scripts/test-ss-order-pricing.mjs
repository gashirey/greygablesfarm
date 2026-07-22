/**
 * Server-pricing integrity checks (no browser values trusted).
 * Run: node scripts/test-ss-order-pricing.mjs
 */

function computeOrderPricing(input) {
  const arrangementCents = input.product.basePriceCents;
  const vesselCents = input.product.requiresVessel
    ? (input.vessel?.priceAdjustmentCents ?? 0)
    : 0;
  const deliveryFeeCents = Math.max(0, input.deliveryFeeCents ?? 0);
  const taxCents = Math.max(0, input.taxCents ?? 0);
  if (input.product.requiresVessel && !input.vessel) {
    throw new Error("A vessel selection is required for this arrangement.");
  }
  return {
    arrangementCents,
    vesselCents,
    deliveryFeeCents,
    taxCents,
    totalCents: arrangementCents + vesselCents + deliveryFeeCents + taxCents,
  };
}

function assertPricingNotTampered(server, clientClaimedTotal) {
  if (
    clientClaimedTotal != null &&
    Number.isFinite(clientClaimedTotal) &&
    clientClaimedTotal !== server.totalCents
  ) {
    throw new Error("Price mismatch. Please refresh and try again.");
  }
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

const choice = {
  basePriceCents: 15000,
  requiresVessel: false,
  name: "Choice",
};
const curated = {
  basePriceCents: 35000,
  requiresVessel: true,
  name: "Curated",
};
const vessel = { name: "Urn", priceAdjustmentCents: 6500 };

check("standard arrangement", () => {
  const p = computeOrderPricing({ product: choice });
  if (p.totalCents !== 15000) throw new Error(String(p.totalCents));
});

check("deluxe + delivery fee", () => {
  const p = computeOrderPricing({
    product: { ...choice, basePriceCents: 22500 },
    deliveryFeeCents: 2500,
  });
  if (p.totalCents !== 25000) throw new Error(String(p.totalCents));
});

check("curated vessel upcharge", () => {
  const p = computeOrderPricing({ product: curated, vessel });
  if (p.totalCents !== 41500) throw new Error(String(p.totalCents));
});

check("curated requires vessel", () => {
  let threw = false;
  try {
    computeOrderPricing({ product: curated });
  } catch {
    threw = true;
  }
  if (!threw) throw new Error("expected throw");
});

check("reject tampered total", () => {
  const p = computeOrderPricing({ product: curated, vessel });
  let threw = false;
  try {
    assertPricingNotTampered(p, 100);
  } catch {
    threw = true;
  }
  if (!threw) throw new Error("expected throw");
});

check("accept matching claimed total", () => {
  const p = computeOrderPricing({ product: curated, vessel });
  assertPricingNotTampered(p, 41500);
});

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nAll pricing checks passed.");
