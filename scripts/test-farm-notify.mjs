/**
 * Quick checks for ORDER_NOTIFY_* parsing (no network).
 * Run: node scripts/test-farm-notify.mjs
 */

import assert from "node:assert/strict";

function parseEnvList(raw) {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizePhones(raw) {
  const out = [];
  for (const item of parseEnvList(raw)) {
    const digits = item.replace(/[^\d+]/g, "");
    if (digits.startsWith("+") && digits.length >= 11) {
      out.push(digits);
      continue;
    }
    const only = digits.replace(/\D/g, "");
    if (only.length === 10) out.push(`+1${only}`);
    else if (only.length === 11 && only.startsWith("1")) out.push(`+${only}`);
  }
  return [...new Set(out)];
}

assert.deepEqual(parseEnvList("a@x.com, b@y.com;c@z.com"), [
  "a@x.com",
  "b@y.com",
  "c@z.com",
]);
assert.deepEqual(normalizePhones("5405551234, +1 (540) 555-9876"), [
  "+15405551234",
  "+15405559876",
]);

console.log("farm-notify parsing ok");
