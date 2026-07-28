#!/usr/bin/env node
/**
 * Reads .env.local (or ENV_FILE) and prints READY/MISSING for Stripe-related vars.
 * Never prints secret values — only status and key prefixes when present.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), process.env.ENV_FILE || ".env.local");

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function prefixOf(val) {
  if (!val) return "";
  const m = val.match(/^(sk_test_|sk_live_|pk_test_|pk_live_|whsec_|re_)/);
  return m ? m[1] : "(set, unrecognized prefix)";
}

const required = [
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_SITE_URL",
];

const optional = ["STRIPE_AUTOMATIC_TAX", "STRIPE_BLOOMS_PAYMENT_LINK"];

if (!existsSync(envPath)) {
  console.log(`FILE: MISSING (${envPath})`);
  for (const k of required) console.log(`${k}: MISSING`);
  for (const k of optional) console.log(`${k}: MISSING (optional)`);
  process.exit(1);
}

const env = parseEnv(readFileSync(envPath, "utf8"));
console.log(`FILE: READY (${envPath})`);

let allReady = true;
for (const k of required) {
  const v = env[k];
  if (v) {
    const p = prefixOf(v);
    const extra = p.startsWith("sk_") || p.startsWith("pk_") || p.startsWith("whsec_")
      ? ` prefix=${p}`
      : k === "NEXT_PUBLIC_SITE_URL"
        ? ` host=${(() => { try { return new URL(v).host; } catch { return "?"; } })()}`
        : "";
    console.log(`${k}: READY${extra}`);
  } else {
    allReady = false;
    console.log(`${k}: MISSING`);
  }
}

for (const k of optional) {
  const v = env[k];
  console.log(v ? `${k}: READY (optional)` : `${k}: MISSING (optional)`);
}

process.exit(allReady ? 0 : 1);
