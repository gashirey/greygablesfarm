"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import type { SurgePaymentProfile } from "@/lib/surge/types";

export function UPickPaymentPanel() {
  const [payment, setPayment] = useState<SurgePaymentProfile | null>(null);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/u-pick/payment", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load Stripe payment status.");
      setPayment(null);
      setPreview(Boolean(data.preview));
      return;
    }
    setError("");
    setPayment(data.payment ?? null);
    setPreview(Boolean(data.preview));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function startConnect() {
    setBusy(true);
    setNotice(null);
    const res = await fetch("/api/admin/u-pick/payment", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setNotice({
        type: "error",
        message: data.error ?? "Could not start Stripe Connect.",
      });
      return;
    }
    if (data.url) {
      window.location.href = data.url as string;
      return;
    }
    setNotice({ type: "error", message: "No Stripe onboarding URL returned." });
  }

  const accountHint = payment?.stripe_account_id
    ? `${payment.stripe_account_id.slice(0, 8)}…`
    : "Not connected";

  return (
    <section className="space-y-3 border border-parchment bg-white p-5">
      <div>
        <h2 className="font-medium text-bark">Stripe payments</h2>
        <p className="mt-1 text-sm text-stone">
          Booking checkout runs through Surge on Stripe Connect. Connect once
          for Grey Gables; then set price and payment rules on each experience.
        </p>
      </div>

      {preview ? (
        <AdminNotice
          type="error"
          message="Preview — Connect Stripe will work after the Surge business API is live."
        />
      ) : null}

      {notice ? (
        <AdminNotice
          type={notice.type}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      ) : null}

      {error ? <p className="text-sm text-bark">{error}</p> : null}

      {payment ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone">Status</dt>
            <dd className="mt-0.5 font-medium text-bark">{payment.status}</dd>
          </div>
          <div>
            <dt className="text-stone">Connected account</dt>
            <dd className="mt-0.5 font-medium text-bark">{accountHint}</dd>
          </div>
          <div>
            <dt className="text-stone">Charges</dt>
            <dd className="mt-0.5 text-bark">
              {payment.charges_enabled ? "Enabled" : "Not enabled"}
            </dd>
          </div>
          <div>
            <dt className="text-stone">Payouts</dt>
            <dd className="mt-0.5 text-bark">
              {payment.payouts_enabled ? "Enabled" : "Not enabled"}
            </dd>
          </div>
        </dl>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn"
          disabled={busy || preview}
          onClick={() => void startConnect()}
        >
          {busy
            ? "Opening Stripe…"
            : payment?.stripe_account_id
              ? "Continue Stripe setup"
              : "Connect Stripe"}
        </button>
        {payment?.dashboard_url ? (
          <a
            href={payment.dashboard_url}
            target="_blank"
            rel="noreferrer"
            className="btn border border-parchment bg-white text-bark"
          >
            Stripe dashboard
          </a>
        ) : null}
      </div>
    </section>
  );
}
