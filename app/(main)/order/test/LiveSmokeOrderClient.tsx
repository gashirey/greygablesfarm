"use client";

import { useEffect, useState } from "react";
import { DesignersChoiceFlow } from "@/components/order/DesignersChoiceFlow";
import type { OrderPageCopy } from "@/lib/order/copy";
import {
  LIVE_SMOKE_ARRANGEMENT_CENTS,
  LIVE_SMOKE_DELIVERY_CENTS,
  LIVE_SMOKE_ZIP,
} from "@/lib/order/live-smoke";
import type { SsFulfillmentDate, SsProduct } from "@/lib/order/types";
import { formatCents } from "@/lib/order/types";

const STORAGE_KEY = "ggf_live_smoke_secret";

type Props = {
  products: SsProduct[];
  availability: SsFulfillmentDate[];
  copy: OrderPageCopy;
};

export function LiveSmokeOrderClient({
  products,
  availability,
  copy,
}: Props) {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)?.trim() ?? "";
    if (!saved) return;
    setSecret(saved);
    void verifySecret(saved, true);
  }, []);

  async function verifySecret(value: string, silent = false) {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter SMOKE_ORDER_SECRET to continue.");
      return;
    }
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/order/zone-lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-smoke-secret": trimmed,
        },
        body: JSON.stringify({ zip: LIVE_SMOKE_ZIP, smokeSecret: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.liveSmoke) {
        sessionStorage.removeItem(STORAGE_KEY);
        setUnlocked(false);
        if (!silent) {
          setError(
            data.error ??
              "Secret rejected. Set SMOKE_ORDER_SECRET on the server and try again.",
          );
        }
        setChecking(false);
        return;
      }
      sessionStorage.setItem(STORAGE_KEY, trimmed);
      setSecret(trimmed);
      setUnlocked(true);
    } catch {
      if (!silent) setError("Could not verify secret.");
    } finally {
      setChecking(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <header>
          <p className="type-eyebrow">Internal</p>
          <h1 className="type-page-title mt-2">Full-flow smoke order</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone">
            Same Designer's Choice checkout as customers: arrangement → delivery
            details → Stripe → confirmation email. Pricing is{" "}
            {formatCents(LIVE_SMOKE_ARRANGEMENT_CENTS)} + ZIP {LIVE_SMOKE_ZIP}{" "}
            delivery {formatCents(LIVE_SMOKE_DELIVERY_CENTS)} (
            {formatCents(LIVE_SMOKE_ARRANGEMENT_CENTS + LIVE_SMOKE_DELIVERY_CENTS)}{" "}
            total).
          </p>
        </header>
        <div className="space-y-4 border border-parchment bg-white px-5 py-5">
          <label className="block text-sm">
            Smoke secret
            <input
              className="input mt-1 w-full"
              type="password"
              autoComplete="off"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="SMOKE_ORDER_SECRET"
            />
          </label>
          {error ? (
            <p className="text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className="btn w-full border-bark bg-bark text-cream"
            disabled={checking || !secret.trim()}
            onClick={() => void verifySecret(secret)}
          >
            {checking ? "Checking…" : "Unlock full order flow"}
          </button>
        </div>
        <p className="text-xs text-stone">
          Prefer a bare Stripe charge with no email?{" "}
          <a href="/order/smoke" className="underline underline-offset-2">
            /order/smoke
          </a>
        </p>
      </div>
    );
  }

  if (!products.length) {
    return (
      <p className="text-sm text-stone">
        No active products available to clone for smoke pricing.
      </p>
    );
  }

  return (
    <DesignersChoiceFlow
      products={products}
      availability={availability}
      copy={{
        ...copy,
        title: "Smoke Test Order",
        lead: `Internal Live verification. Choose the $${LIVE_SMOKE_ARRANGEMENT_CENTS / 100} arrangement, then use ZIP ${LIVE_SMOKE_ZIP} for $${LIVE_SMOKE_DELIVERY_CENTS / 100} delivery.`,
        continueCta: "Continue to Order Details",
        checkoutCta: "Continue to Secure Checkout",
      }}
      smokeSecret={secret}
    />
  );
}
