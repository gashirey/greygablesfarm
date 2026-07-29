"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { OrderPageCopy } from "@/lib/order/copy";
import { computeOrderPricing } from "@/lib/order/pricing";
import {
  loadSavedBuyerDetails,
  saveBuyerDetails,
} from "@/lib/order/saved-buyer";
import type {
  FulfillmentType,
  PresentationMode,
  SsFulfillmentDate,
  SsProduct,
} from "@/lib/order/types";
import { formatCents } from "@/lib/order/types";

type ZoneInfo = {
  id: string;
  name: string;
  feeCents: number;
  feeLabel: string;
};

type Props = {
  products: SsProduct[];
  availability: SsFulfillmentDate[];
  copy: OrderPageCopy;
  initialScaleSlug?: string;
};

type Page = "arrangement" | "delivery";

const SCALE_ALIASES: Record<string, string> = {
  choice: "classic",
  deluxe: "signature",
  "curated-vessel": "grand",
  vessel: "grand",
};

function defaultScale(products: SsProduct[], initial?: string): SsProduct | null {
  if (!products.length) return null;
  if (initial) {
    const wanted = SCALE_ALIASES[initial] ?? initial;
    const match = products.find(
      (p) =>
        p.slug === initial ||
        p.slug === wanted ||
        (SCALE_ALIASES[p.slug] ?? p.slug) === wanted,
    );
    if (match) return match;
  }
  return products.find((p) => p.isPopular) ?? products[0] ?? null;
}

export function DesignersChoiceFlow({
  products,
  availability,
  copy,
  initialScaleSlug,
}: Props) {
  const [page, setPage] = useState<Page>("arrangement");
  const [product, setProduct] = useState<SsProduct | null>(() =>
    defaultScale(products, initialScaleSlug),
  );
  const [presentation, setPresentation] =
    useState<PresentationMode>("signature-glass");

  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType>("delivery");
  const [fulfillmentDate, setFulfillmentDate] = useState("");
  const [pickupWindowId, setPickupWindowId] = useState<string | null>(null);
  const [zone, setZone] = useState<ZoneInfo | null>(null);
  const [zoneError, setZoneError] = useState("");
  const [lookingUpZip, setLookingUpZip] = useState(false);

  const [isGift, setIsGift] = useState(true);
  const [noCard, setNoCard] = useState(false);
  const [hidePricing, setHidePricing] = useState(false);
  const [cardMessage, setCardMessage] = useState("");

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [rememberDetails, setRememberDetails] = useState(true);
  const [hydratedSaved, setHydratedSaved] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedDay = availability.find(
    (d) => d.fulfillmentDate === fulfillmentDate,
  );

  const pricing = useMemo(() => {
    if (!product) return null;
    try {
      return computeOrderPricing({
        product,
        presentation,
        deliveryFeeCents:
          page === "delivery" && fulfillmentType === "delivery"
            ? (zone?.feeCents ?? 0)
            : 0,
      });
    } catch {
      return null;
    }
  }, [product, presentation, page, fulfillmentType, zone]);

  const presentationLabel =
    presentation === "curated-keepsake" ? copy.curatedName : copy.glassName;

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

  useEffect(() => {
    const saved = loadSavedBuyerDetails();
    if (!saved) {
      setHydratedSaved(true);
      return;
    }
    setBuyerName(saved.buyerName || "");
    setBuyerEmail(saved.buyerEmail || "");
    setBuyerPhone(saved.buyerPhone || "");
    if (saved.recipientName) setRecipientName(saved.recipientName);
    if (saved.recipientPhone) setRecipientPhone(saved.recipientPhone);
    if (saved.addressStreet) setAddressStreet(saved.addressStreet);
    if (saved.addressCity) setAddressCity(saved.addressCity);
    if (saved.addressZip) setAddressZip(saved.addressZip);
    setRememberDetails(true);
    setHydratedSaved(true);
    if (saved.addressZip?.length === 5) {
      void lookupZip(saved.addressZip);
    }
  }, []);

  function continueToDelivery() {
    if (!product) {
      setError("Please choose a scale.");
      return;
    }
    setError("");
    setPage("delivery");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToArrangement() {
    setError("");
    setPage("arrangement");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateDelivery(): boolean {
    if (!fulfillmentDate) {
      setError("Please choose a date.");
      return false;
    }
    if (fulfillmentType === "delivery") {
      if (!zone) {
        setError("Enter a ZIP in our delivery area to continue.");
        return false;
      }
      if (
        !recipientName ||
        !recipientPhone ||
        !addressStreet ||
        !addressCity ||
        !addressZip
      ) {
        setError("Please complete all delivery fields.");
        return false;
      }
    } else if (!pickupWindowId) {
      setError("Please select a pickup window.");
      return false;
    }
    if (!buyerName || !buyerEmail || !buyerPhone) {
      setError("Please enter your name, email, and mobile.");
      return false;
    }
    return true;
  }

  async function startCheckout() {
    if (!product || !pricing) return;
    if (!validateDelivery()) return;

    saveBuyerDetails({
      buyerName,
      buyerEmail,
      buyerPhone,
      recipientName,
      recipientPhone,
      addressStreet,
      addressCity,
      addressZip,
      remember: rememberDetails,
    });

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/order/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          presentation,
          fulfillmentType,
          fulfillmentDate,
          pickupWindowId,
          addressZip,
          addressStreet,
          addressCity,
          addressState: "VA",
          recipientName: fulfillmentType === "delivery" ? recipientName : null,
          recipientPhone: fulfillmentType === "delivery" ? recipientPhone : null,
          deliveryInstructions:
            fulfillmentType === "delivery" ? deliveryInstructions : null,
          buyerName,
          buyerEmail,
          buyerPhone,
          cardMessage: noCard ? null : cardMessage,
          notes,
          isGift,
          hidePricing,
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

  if (!products.length || !product) {
    return (
      <p className="text-sm text-stone">
        Arrangements are not available online right now. Please{" "}
        <a href="/contact" className="underline underline-offset-2">
          contact the farm
        </a>
        .
      </p>
    );
  }

  const progress = (
    <ol className="mb-10 flex flex-wrap gap-x-6 gap-y-2 border-b border-parchment pb-4 text-xs tracking-wide text-stone">
      {(
        [
          ["arrangement", copy.progressCreate],
          ["delivery", copy.progressDelivery],
          ["checkout", copy.progressCheckout],
        ] as const
      ).map(([id, label], i) => {
        const active =
          (id === "arrangement" && page === "arrangement") ||
          (id === "delivery" && page === "delivery");
        const done = id === "arrangement" && page === "delivery";
        return (
          <li
            key={id}
            className={
              active ? "font-medium text-bark" : done ? "text-bark/70" : ""
            }
          >
            <span className="mr-1.5 text-stone">{i + 1}.</span>
            {label}
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="mx-auto max-w-6xl">
      {progress}

      {page === "arrangement" ? (
        <div className="max-w-4xl">
          <header className="max-w-2xl">
            <p className="type-eyebrow">{copy.eyebrow}</p>
            <h1 className="type-page-title mt-2 leading-tight">{copy.title}</h1>
            <p className="type-page-body mt-4 leading-relaxed">{copy.lead}</p>
            <p className="mt-3 text-sm leading-relaxed text-stone">
              {copy.supporting}
            </p>
          </header>

          <section className="mt-10" aria-labelledby="scale-heading">
            <h2 id="scale-heading" className="sr-only">
              Choose your scale
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {products.map((p) => {
                const selected = p.id === product.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProduct(p)}
                    className={`border bg-white text-left transition-colors ${
                      selected
                        ? "border-bark"
                        : "border-parchment hover:border-stone"
                    }`}
                  >
                    <div className="image-frame relative aspect-[4/5]">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.imageAlt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-parchment" />
                      )}
                      {p.isPopular ? (
                        <span className="absolute left-2 top-2 bg-cream px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-bark">
                          Most sent
                        </span>
                      ) : null}
                      {selected ? (
                        <span
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-bark text-sm text-cream"
                          aria-hidden
                        >
                          ✓
                        </span>
                      ) : null}
                    </div>
                    <div className="border-t border-parchment p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-serif text-lg text-bark">
                          {p.name}
                        </span>
                        <span className="font-serif text-lg text-bark">
                          {formatCents(p.basePriceCents)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-stone">
                        {p.blurb || p.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 max-w-2xl text-xs leading-relaxed text-stone">
              {copy.scaleNote}
            </p>
          </section>

          <hr className="my-10 border-parchment" />

          <section aria-labelledby="presentation-heading">
            <p className="type-eyebrow">{copy.presentationEyebrow}</p>
            <h2
              id="presentation-heading"
              className="mt-1 font-serif text-2xl text-bark"
            >
              {copy.presentationTitle}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-stone">
              {copy.presentationLead}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    id: "signature-glass" as const,
                    name: copy.glassName,
                    description: copy.glassDescription,
                    priceLabel: copy.glassPriceLabel,
                  },
                  {
                    id: "curated-keepsake" as const,
                    name: copy.curatedName,
                    description: copy.curatedDescription,
                    priceLabel:
                      product.vesselUpgradeCents > 0
                        ? `+${formatCents(product.vesselUpgradeCents)}`
                        : "Included",
                  },
                ] as const
              ).map((opt) => {
                const selected = presentation === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPresentation(opt.id)}
                    className={`border p-4 text-left transition-colors ${
                      selected
                        ? "border-bark bg-white"
                        : "border-parchment bg-white hover:border-stone"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-bark">{opt.name}</span>
                      {selected ? (
                        <span className="text-bark" aria-hidden>
                          ✓
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-stone">
                      {opt.description}
                    </p>
                    <p className="mt-3 text-sm text-bark">{opt.priceLabel}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="mt-12 max-w-md">
            {error ? (
              <p className="mb-3 text-sm text-red-800" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              className="btn w-full border-bark bg-bark text-cream sm:w-auto"
              onClick={continueToDelivery}
            >
              {copy.continueCta}
            </button>
            {copy.continueHint ? (
              <p className="mt-2 text-xs text-stone">{copy.continueHint}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="max-w-xl space-y-10">
            <header>
              <p className="type-eyebrow">{copy.deliveryEyebrow}</p>
              <h1 className="type-page-title mt-2 leading-tight">
                {copy.deliveryTitle}
              </h1>
              <p className="mt-3 text-sm text-stone">
                {product.name} · {presentationLabel}
                {pricing ? ` · ${formatCents(pricing.totalCents)}` : ""}
              </p>
              <button
                type="button"
                className="mt-3 text-sm text-stone underline underline-offset-2"
                onClick={backToArrangement}
              >
                {copy.editArrangement}
              </button>
            </header>

            <section>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setFulfillmentType("delivery");
                    setPickupWindowId(null);
                  }}
                  className={`border p-4 text-left ${
                    fulfillmentType === "delivery"
                      ? "border-bark"
                      : "border-parchment"
                  }`}
                >
                  <span className="font-medium text-bark">
                    {copy.deliveryLocalName}
                  </span>
                  <p className="mt-1 text-sm text-stone">
                    {copy.deliveryLocalBlurb}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFulfillmentType("pickup");
                    setZone(null);
                    setZoneError("");
                  }}
                  className={`border p-4 text-left ${
                    fulfillmentType === "pickup"
                      ? "border-bark"
                      : "border-parchment"
                  }`}
                >
                  <span className="font-medium text-bark">
                    {copy.deliveryPickupName}
                  </span>
                  <p className="mt-1 text-sm text-stone">
                    {copy.deliveryPickupBlurb}
                  </p>
                </button>
              </div>
              <p className="mt-3 text-xs text-stone">
                {fulfillmentType === "delivery"
                  ? copy.deliveryNote
                  : copy.pickupNote}
              </p>
            </section>

            <section className="space-y-3">
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
                  <option value="">Select a date</option>
                  {availability.map((d) => (
                    <option key={d.id} value={d.fulfillmentDate}>
                      {d.fulfillmentDate}
                      {d.remainingCapacity != null
                        ? ` · ${d.remainingCapacity} left`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>

              {fulfillmentType === "pickup" && selectedDay ? (
                <label className="block text-sm">
                  Pickup window
                  <select
                    className="input mt-1 w-full"
                    value={pickupWindowId ?? ""}
                    onChange={(e) => setPickupWindowId(e.target.value || null)}
                  >
                    <option value="">Select a window</option>
                    {(selectedDay.windows ?? []).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {fulfillmentType === "delivery" ? (
                <div className="space-y-3">
                  <label className="block text-sm">
                    Delivery ZIP
                    <div className="mt-1 flex gap-2">
                      <input
                        className="input w-full"
                        inputMode="numeric"
                        maxLength={5}
                        value={addressZip}
                        onChange={(e) => {
                          const zip = e.target.value.replace(/\D/g, "").slice(0, 5);
                          setAddressZip(zip);
                          if (zip.length === 5) void lookupZip(zip);
                          else {
                            setZone(null);
                            setZoneError("");
                          }
                        }}
                      />
                      {lookingUpZip ? (
                        <span className="self-center text-xs text-stone">…</span>
                      ) : null}
                    </div>
                  </label>
                  {zone ? (
                    <p className="text-xs text-bark">
                      {zone.name} · {zone.feeLabel}
                    </p>
                  ) : null}
                  {zoneError ? (
                    <p className="text-xs text-red-800">{zoneError}</p>
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
                    Delivery instructions
                    <textarea
                      className="input mt-1 w-full"
                      rows={2}
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                    />
                  </label>
                </div>
              ) : null}
            </section>

            <section>
              <h2 className="font-serif text-xl text-bark">{copy.giftTitle}</h2>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  className={`border px-4 py-2 text-sm ${
                    isGift ? "border-bark" : "border-parchment"
                  }`}
                  onClick={() => setIsGift(true)}
                >
                  {copy.giftYes}
                </button>
                <button
                  type="button"
                  className={`border px-4 py-2 text-sm ${
                    !isGift ? "border-bark" : "border-parchment"
                  }`}
                  onClick={() => setIsGift(false)}
                >
                  {copy.giftNo}
                </button>
              </div>
              <p className="mt-4 text-sm text-stone">{copy.cardHelper}</p>
              {!noCard ? (
                <textarea
                  className="input mt-2 w-full"
                  rows={3}
                  placeholder={copy.cardPlaceholder}
                  value={cardMessage}
                  onChange={(e) => setCardMessage(e.target.value)}
                  maxLength={250}
                />
              ) : null}
              <label className="mt-3 flex items-center gap-2 text-sm text-bark">
                <input
                  type="checkbox"
                  checked={noCard}
                  onChange={(e) => setNoCard(e.target.checked)}
                />
                {copy.noCardLabel}
              </label>
              {isGift ? (
                <label className="mt-2 flex items-center gap-2 text-sm text-bark">
                  <input
                    type="checkbox"
                    checked={hidePricing}
                    onChange={(e) => setHidePricing(e.target.checked)}
                  />
                  {copy.hidePricingLabel}
                </label>
              ) : null}
            </section>

            <section>
              <p className="type-eyebrow">{copy.designerEyebrow}</p>
              <h2 className="mt-1 font-serif text-xl text-bark">
                {copy.designerTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone">
                {copy.designerLead}
              </p>
              <textarea
                className="input mt-3 w-full"
                rows={4}
                placeholder={copy.designerPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-xl text-bark">Your contact</h2>
              {hydratedSaved && rememberDetails && buyerEmail ? (
                <p className="text-xs text-stone">
                  We filled in details saved on this device.
                </p>
              ) : null}
              <label className="block text-sm">
                Name
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
                  type="email"
                  className="input mt-1 w-full"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
              <label className="block text-sm">
                Mobile
                <input
                  className="input mt-1 w-full"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-bark">
                <input
                  type="checkbox"
                  checked={rememberDetails}
                  onChange={(e) => setRememberDetails(e.target.checked)}
                />
                Save my details on this device for next time
              </label>
            </section>

            <section>
              <p className="type-eyebrow">{copy.reviewEyebrow}</p>
              <h2 className="mt-1 font-serif text-xl text-bark">
                {copy.reviewTitle}
              </h2>
              {pricing ? (
                <ul className="mt-4 space-y-1.5 text-sm">
                  {pricing.lines.map((line) => (
                    <li
                      key={`${line.kind}-${line.label}`}
                      className="flex justify-between gap-3 text-stone"
                    >
                      <span>{line.label}</span>
                      <span className="text-bark">
                        {formatCents(line.unitAmountCents)}
                      </span>
                    </li>
                  ))}
                  <li className="flex justify-between gap-3 border-t border-parchment pt-2 font-medium text-bark">
                    <span>Subtotal</span>
                    <span>{formatCents(pricing.totalCents)}</span>
                  </li>
                </ul>
              ) : null}
              <p className="mt-1 text-xs text-stone">Tax calculated at checkout.</p>
              {error ? (
                <p className="mt-3 text-sm text-red-800" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn border-parchment"
                  onClick={backToArrangement}
                  disabled={submitting}
                >
                  {copy.backCta}
                </button>
                <button
                  type="button"
                  className="btn border-bark bg-bark text-cream"
                  onClick={() => void startCheckout()}
                  disabled={submitting || !pricing}
                >
                  {submitting ? "Starting checkout…" : copy.checkoutCta}
                </button>
              </div>
            </section>
        </div>
      )}
    </div>
  );
}
