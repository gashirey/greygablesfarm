"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function SmokeCheckoutClient() {
  const params = useSearchParams();
  const paid = params.get("paid") === "1";
  const cancelled = params.get("cancelled") === "1";
  const sessionId = params.get("session_id");

  const [secret, setSecret] = useState("");
  const [amountCents, setAmountCents] = useState(500);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/order/smoke-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, amountCents }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start checkout.");
        setBusy(false);
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setError("No checkout URL returned.");
      setBusy(false);
    } catch {
      setError("Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header>
        <p className="type-eyebrow">Internal</p>
        <h1 className="type-page-title mt-2">Stripe smoke test</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Charge $5 or $7 to verify Live Stripe keys and the production webhook.
          This is not a flower order.
        </p>
      </header>

      {paid ? (
        <div className="border border-parchment bg-cream/40 px-4 py-4 text-sm text-bark">
          <p className="font-medium">Payment submitted.</p>
          <p className="mt-2 text-stone">
            Check Stripe → Webhooks → your destination for a successful{" "}
            <code className="text-xs">checkout.session.completed</code> delivery.
          </p>
          {sessionId ? (
            <p className="mt-2 text-xs text-stone">Session: {sessionId}</p>
          ) : null}
        </div>
      ) : null}

      {cancelled ? (
        <p className="text-sm text-stone">Checkout cancelled — nothing charged.</p>
      ) : null}

      {!paid ? (
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
          <fieldset className="space-y-2 text-sm">
            <legend className="text-bark">Amount</legend>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="amount"
                checked={amountCents === 500}
                onChange={() => setAmountCents(500)}
              />
              $5.00
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="amount"
                checked={amountCents === 700}
                onChange={() => setAmountCents(700)}
              />
              $7.00
            </label>
          </fieldset>
          {error ? (
            <p className="text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className="btn w-full border-bark bg-bark text-cream"
            disabled={busy || !secret.trim()}
            onClick={() => void startCheckout()}
          >
            {busy ? "Starting…" : "Pay with Stripe"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
