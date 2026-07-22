"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { computeOrderPricing } from "@/lib/order/pricing";
import type {
  FulfillmentType,
  SsFulfillmentDate,
  SsProduct,
  SsVessel,
} from "@/lib/order/types";
import { formatCents } from "@/lib/order/types";

type ZoneInfo = {
  id: string;
  name: string;
  feeCents: number;
  feeLabel: string;
};

type OrderWizardProps = {
  product: SsProduct;
  vessels: SsVessel[];
  availability: SsFulfillmentDate[];
};

type Step = "vessel" | "fulfillment" | "details" | "review";

export function OrderWizard({
  product,
  vessels,
  availability,
}: OrderWizardProps) {
  const needsVessel = product.requiresVessel;
  const [step, setStep] = useState<Step>(needsVessel ? "vessel" : "fulfillment");
  const [vesselId, setVesselId] = useState<string | null>(null);
  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType>("delivery");
  const [fulfillmentDate, setFulfillmentDate] = useState("");
  const [pickupWindowId, setPickupWindowId] = useState<string | null>(null);
  const [zone, setZone] = useState<ZoneInfo | null>(null);
  const [zoneError, setZoneError] = useState("");
  const [lookingUpZip, setLookingUpZip] = useState(false);

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [cardMessage, setCardMessage] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedVessel = vessels.find((v) => v.id === vesselId) ?? null;
  const selectedDay = availability.find(
    (d) => d.fulfillmentDate === fulfillmentDate,
  );

  const pricing = useMemo(() => {
    try {
      return computeOrderPricing({
        product,
        vessel: selectedVessel,
        deliveryFeeCents:
          fulfillmentType === "delivery" ? (zone?.feeCents ?? 0) : 0,
      });
    } catch {
      return null;
    }
  }, [product, selectedVessel, fulfillmentType, zone]);

  async function lookupZip(zip: string) {
    setLookingUpZip(true);
    setZoneError("");
    setZone(null);
    try {
      const res = await fetch("/api/order/zone-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip }),
      });
      const data = await res.json();
      if (!data.inZone) {
        setZoneError(
          data.message ??
            "We don't deliver to that ZIP online. Please choose farm pickup or contact us.",
        );
        return;
      }
      setZone(data.zone);
    } catch {
      setZoneError("Could not check delivery zone. Please try again.");
    } finally {
      setLookingUpZip(false);
    }
  }

  function goNextFromVessel() {
    if (needsVessel && !vesselId) {
      setError("Please select a vessel.");
      return;
    }
    setError("");
    setStep("fulfillment");
  }

  function goNextFromFulfillment() {
    if (!fulfillmentDate) {
      setError("Please choose a date.");
      return;
    }
    if (fulfillmentType === "delivery") {
      if (!zone) {
        setError("Enter a ZIP in our delivery area to continue.");
        return;
      }
      if (
        !recipientName ||
        !recipientPhone ||
        !addressStreet ||
        !addressCity ||
        !addressZip
      ) {
        setError("Please complete all delivery fields.");
        return;
      }
    } else if (!pickupWindowId) {
      setError("Please select a pickup window.");
      return;
    }
    setError("");
    setStep("details");
  }

  function goNextFromDetails() {
    if (!buyerName || !buyerEmail || !buyerPhone) {
      setError("Please enter your name, email, and mobile.");
      return;
    }
    setError("");
    setStep("review");
  }

  async function startCheckout() {
    if (!pricing) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/order/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          vesselId,
          fulfillmentType,
          fulfillmentDate,
          pickupWindowId,
          addressZip,
          addressStreet,
          addressCity,
          addressState: "VA",
          recipientName,
          recipientPhone,
          deliveryInstructions,
          buyerName,
          buyerEmail,
          buyerPhone,
          cardMessage,
          notes,
          claimedTotalCents: pricing.totalCents,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Checkout failed.");
        setSubmitting(false);
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setError("No checkout URL returned.");
      setSubmitting(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const steps: Step[] = needsVessel
    ? ["vessel", "fulfillment", "details", "review"]
    : ["fulfillment", "details", "review"];

  return (
    <div className="mx-auto max-w-xl">
      <p className="type-eyebrow tracking-wide">
        <Link
          href="/order"
          className="text-stone underline-offset-4 hover:underline"
        >
          All arrangements
        </Link>
      </p>
      <h1 className="type-page-title mt-2 leading-tight">{product.name}</h1>
      <p className="mt-1 font-serif text-xl text-bark">
        {formatCents(product.basePriceCents)}
        {needsVessel && selectedVessel
          ? selectedVessel.priceAdjustmentCents > 0
            ? ` + ${formatCents(selectedVessel.priceAdjustmentCents)} vessel`
            : " + vessel"
          : null}
      </p>

      <ol className="mt-6 flex flex-wrap gap-2 text-xs text-stone">
        {steps.map((s) => (
          <li
            key={s}
            className={`border border-parchment px-2 py-1 ${
              s === step ? "bg-bark text-cream" : "bg-white"
            }`}
          >
            {s === "vessel"
              ? "Vessel"
              : s === "fulfillment"
                ? "Delivery / pickup"
                : s === "details"
                  ? "Your details"
                  : "Review"}
          </li>
        ))}
      </ol>

      <div className="card mt-8 space-y-5 p-6">
        {step === "vessel" ? (
          <>
            <h2 className="font-serif text-lg text-bark">Choose a vessel</h2>
            <p className="text-sm text-stone">
              Only available vessels are shown. The vessel is theirs to keep.
            </p>
            <ul className="space-y-3">
              {vessels.map((v) => {
                const total =
                  product.basePriceCents + v.priceAdjustmentCents;
                return (
                  <li key={v.id}>
                    <label
                      className={`flex cursor-pointer gap-3 border border-parchment p-3 ${
                        vesselId === v.id
                          ? "border-bark/40 bg-cream"
                          : "bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="vessel"
                        checked={vesselId === v.id}
                        onChange={() => setVesselId(v.id)}
                        className="mt-2"
                      />
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-parchment">
                        {v.imageUrl ? (
                          <Image
                            src={v.imageUrl}
                            alt={v.imageAlt}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-bark">{v.name}</p>
                        <p className="mt-1 text-xs leading-relaxed text-stone">
                          {v.description}
                        </p>
                        <p className="mt-2 text-sm text-bark">
                          {v.priceAdjustmentCents === 0
                            ? "Included"
                            : `+${formatCents(v.priceAdjustmentCents)}`}
                          {" · "}
                          Arrangement total {formatCents(total)}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
            {!vessels.length ? (
              <p className="text-sm text-stone">
                No vessels are available right now. Please check back soon or{" "}
                <Link href="/contact" className="underline">
                  contact us
                </Link>
                .
              </p>
            ) : null}
            <button
              type="button"
              className="btn w-full border-[var(--color-salmon-button)] bg-[var(--color-salmon-button)] text-white"
              onClick={goNextFromVessel}
              disabled={!vessels.length}
            >
              Continue
            </button>
          </>
        ) : null}

        {step === "fulfillment" ? (
          <>
            <h2 className="font-serif text-lg text-bark">
              Delivery or farm pickup
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {product.allowsDelivery ? (
                <button
                  type="button"
                  className={`border border-parchment px-3 py-3 text-sm ${
                    fulfillmentType === "delivery"
                      ? "border-bark/40 bg-cream"
                      : ""
                  }`}
                  onClick={() => {
                    setFulfillmentType("delivery");
                    setPickupWindowId(null);
                  }}
                >
                  Delivery
                </button>
              ) : null}
              {product.allowsPickup ? (
                <button
                  type="button"
                  className={`border border-parchment px-3 py-3 text-sm ${
                    fulfillmentType === "pickup"
                      ? "border-bark/40 bg-cream"
                      : ""
                  }`}
                  onClick={() => {
                    setFulfillmentType("pickup");
                    setZone(null);
                    setZoneError("");
                  }}
                >
                  Farm pickup
                </button>
              ) : null}
            </div>

            <label className="block text-sm">
              Date
              <select
                className="input mt-1 w-full"
                value={fulfillmentDate}
                onChange={(e) => {
                  setFulfillmentDate(e.target.value);
                  setPickupWindowId(null);
                }}
              >
                <option value="">Select…</option>
                {availability.map((d) => (
                  <option key={d.id} value={d.fulfillmentDate}>
                    {d.fulfillmentDate}
                    {d.remainingCapacity != null
                      ? ` (${d.remainingCapacity} slots)`
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            {fulfillmentType === "pickup" && selectedDay ? (
              <fieldset>
                <legend className="text-sm font-medium text-bark">
                  Pickup window
                </legend>
                <div className="mt-2 space-y-2">
                  {(selectedDay.windows ?? []).map((w) => (
                    <label
                      key={w.id}
                      className={`flex cursor-pointer gap-2 border border-parchment px-3 py-2 text-sm ${
                        pickupWindowId === w.id ? "bg-cream" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="window"
                        checked={pickupWindowId === w.id}
                        onChange={() => setPickupWindowId(w.id)}
                      />
                      {w.label} ({w.startsAt.slice(0, 5)}–{w.endsAt.slice(0, 5)})
                    </label>
                  ))}
                  {!selectedDay.windows?.length ? (
                    <p className="text-sm text-stone">
                      No pickup windows left on this date.
                    </p>
                  ) : null}
                </div>
              </fieldset>
            ) : null}

            {fulfillmentType === "delivery" ? (
              <div className="space-y-4 border-t border-parchment pt-4">
                <label className="block text-sm">
                  Delivery ZIP
                  <div className="mt-1 flex gap-2">
                    <input
                      className="input flex-1"
                      value={addressZip}
                      onChange={(e) => setAddressZip(e.target.value)}
                      placeholder="22903"
                      maxLength={10}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary text-sm"
                      disabled={lookingUpZip}
                      onClick={() => void lookupZip(addressZip)}
                    >
                      {lookingUpZip ? "Checking…" : "Check"}
                    </button>
                  </div>
                </label>
                {zone ? (
                  <p className="text-sm text-bark">
                    {zone.name} — delivery {zone.feeLabel}
                  </p>
                ) : null}
                {zoneError ? (
                  <p className="text-sm text-bark" role="alert">
                    {zoneError}
                  </p>
                ) : null}

                <label className="block text-sm">
                  Recipient name
                  <input
                    className="input mt-1 w-full"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  Recipient phone
                  <input
                    className="input mt-1 w-full"
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  Street address
                  <input
                    className="input mt-1 w-full"
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  City
                  <input
                    className="input mt-1 w-full"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  Delivery instructions{" "}
                  <span className="font-normal text-stone">(optional)</span>
                  <textarea
                    className="input mt-1 w-full resize-y"
                    rows={2}
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                  />
                </label>
              </div>
            ) : null}

            <div className="flex gap-3">
              {needsVessel ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStep("vessel")}
                >
                  Back
                </button>
              ) : null}
              <button
                type="button"
                className="btn flex-1 border-[var(--color-salmon-button)] bg-[var(--color-salmon-button)] text-white"
                onClick={goNextFromFulfillment}
              >
                Continue
              </button>
            </div>
          </>
        ) : null}

        {step === "details" ? (
          <>
            <h2 className="font-serif text-lg text-bark">Your details</h2>
            <label className="block text-sm">
              Your name
              <input
                className="input mt-1 w-full"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label className="block text-sm">
              Email
              <input
                className="input mt-1 w-full"
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            <label className="block text-sm">
              Mobile
              <input
                className="input mt-1 w-full"
                type="tel"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                autoComplete="tel"
              />
            </label>
            <label className="block text-sm">
              Card message{" "}
              <span className="font-normal text-stone">(optional)</span>
              <textarea
                className="input mt-1 w-full resize-y"
                rows={3}
                maxLength={250}
                value={cardMessage}
                onChange={(e) => setCardMessage(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Order notes{" "}
              <span className="font-normal text-stone">(optional)</span>
              <textarea
                className="input mt-1 w-full resize-y"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep("fulfillment")}
              >
                Back
              </button>
              <button
                type="button"
                className="btn flex-1 border-[var(--color-salmon-button)] bg-[var(--color-salmon-button)] text-white"
                onClick={goNextFromDetails}
              >
                Review order
              </button>
            </div>
          </>
        ) : null}

        {step === "review" && pricing ? (
          <>
            <h2 className="font-serif text-lg text-bark">Review</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-stone">Arrangement</dt>
                <dd className="text-bark">{product.name}</dd>
              </div>
              {selectedVessel ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-stone">Vessel</dt>
                  <dd className="text-bark">{selectedVessel.name}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-stone">
                  {fulfillmentType === "delivery" ? "Delivery" : "Pickup"}
                </dt>
                <dd className="text-right text-bark">
                  {fulfillmentDate}
                  {zone ? ` · ${zone.name}` : null}
                </dd>
              </div>
              {pricing.lines.map((line) => (
                <div
                  key={`${line.kind}-${line.label}`}
                  className="flex justify-between gap-4"
                >
                  <dt className="text-stone">{line.label}</dt>
                  <dd className="text-bark">
                    {formatCents(line.unitAmountCents)}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t border-parchment pt-2 font-medium">
                <dt className="text-bark">Total</dt>
                <dd className="text-bark">
                  {formatCents(pricing.totalCents)}
                </dd>
              </div>
              <p className="text-xs text-stone">
                Tax is calculated at checkout when configured in Stripe.
              </p>
            </dl>
            <div className="flex gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep("details")}
                disabled={submitting}
              >
                Back
              </button>
              <button
                type="button"
                className="btn flex-1 border-[var(--color-salmon-button)] bg-[var(--color-salmon-button)] text-white disabled:opacity-60"
                onClick={() => void startCheckout()}
                disabled={submitting}
              >
                {submitting ? "Starting checkout…" : "Pay with Stripe"}
              </button>
            </div>
          </>
        ) : null}

        {error ? (
          <p className="text-sm text-bark" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
