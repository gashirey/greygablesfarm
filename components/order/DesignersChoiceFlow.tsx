"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { OrderPageCopy } from "@/lib/order/copy";
import { resolveSeasonalLabel } from "@/lib/order/copy";
import { normalizeDeliveryZip } from "@/lib/order/delivery-regions";
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

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatFulfillmentDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
}

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

  const [includeCard, setIncludeCard] = useState(false);
  const [cardMessage, setCardMessage] = useState("");

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [zoneSupportMessage, setZoneSupportMessage] = useState("");

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

  const dateOptions =
    fulfillmentType === "delivery"
      ? availability.filter((d) => d.fulfillmentDate > todayIso())
      : availability;

  const pricing = useMemo(() => {
    if (!product) return null;
    try {
      const deliveryFeeCents =
        page === "delivery" && fulfillmentType === "delivery" && zone
          ? zone.feeCents
          : 0;
      return computeOrderPricing({
        product,
        presentation,
        deliveryFeeCents,
        deliveryLabel: zone
          ? `${zone.name} delivery`
          : "Local delivery",
      });
    } catch {
      return null;
    }
  }, [product, presentation, page, fulfillmentType, zone]);

  const presentationLabel =
    presentation === "curated-keepsake" ? copy.curatedName : copy.glassName;

  async function lookupZip(zipRaw: string): Promise<ZoneInfo | null> {
    const zip = normalizeDeliveryZip(zipRaw);
    if (!zip) {
      setZone(null);
      setZoneError(
        zipRaw.trim() ? "Please enter a valid 5-digit ZIP code." : "",
      );
      setZoneSupportMessage("");
      return null;
    }

    setLookingUpZip(true);
    setZoneError("");
    setZoneSupportMessage("");
    setZone(null);
    try {
      const res = await fetch("/api/order/zone-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip }),
      });
      const data = await res.json();
      if (!data.eligible && !data.inZone) {
        setZoneError(
          data.message ??
            "We don't currently offer regular delivery to this area.",
        );
        setZoneSupportMessage(
          data.supportMessage ??
            "We occasionally accommodate weddings, events, and larger custom orders outside our standard delivery area.",
        );
        return null;
      }
      const nextZone: ZoneInfo = data.zone ?? {
        id: data.delivery_region_id,
        name: data.regionName,
        feeCents: data.deliveryFeeCents,
        feeLabel: formatCents(Number(data.deliveryFeeCents) || 0),
      };
      setZone(nextZone);
      if (typeof data.zipCode === "string" || typeof data.zip === "string") {
        setAddressZip(data.zipCode ?? data.zip);
      }
      return nextZone;
    } catch {
      setZoneError("Could not check delivery availability. Please try again.");
      return null;
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

  function validateDelivery(activeZone: ZoneInfo | null = zone): boolean {
    if (fulfillmentType === "delivery") {
      if (!activeZone) {
        setError(
          "Enter a delivery ZIP code in our regular delivery area to continue.",
        );
        return false;
      }
      if (!fulfillmentDate) {
        setError("Please choose a delivery date.");
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
    } else {
      if (!fulfillmentDate) {
        setError("Please choose a pickup date.");
        return false;
      }
      if (!pickupWindowId) {
        setError("Please select a pickup window.");
        return false;
      }
    }
    if (!buyerName || !buyerEmail || !buyerPhone) {
      setError("Please enter your name, email, and mobile.");
      return false;
    }
    return true;
  }

  async function startCheckout() {
    if (!product || !pricing) return;

    let activeZone = zone;
    if (fulfillmentType === "delivery") {
      activeZone = await lookupZip(addressZip);
    }
    if (!validateDelivery(activeZone)) return;

    const checkoutPricing = computeOrderPricing({
      product,
      presentation,
      deliveryFeeCents:
        fulfillmentType === "delivery" ? (activeZone?.feeCents ?? 0) : 0,
      deliveryLabel: activeZone
        ? `${activeZone.name} delivery`
        : "Local delivery",
    });

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
          addressLine2: addressLine2 || null,
          addressCity,
          addressState: "VA",
          recipientName: fulfillmentType === "delivery" ? recipientName : null,
          recipientPhone: fulfillmentType === "delivery" ? recipientPhone : null,
          deliveryInstructions:
            fulfillmentType === "delivery" ? deliveryInstructions : null,
          buyerName,
          buyerEmail,
          buyerPhone,
          cardMessage: includeCard ? cardMessage.trim() || null : null,
          notes,
          isGift: includeCard,
          hidePricing: true,
          claimedTotalCents: checkoutPricing.totalCents,
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
            <p className="mt-2 text-sm tracking-wide text-stone">
              {resolveSeasonalLabel(copy.seasonalLabel)}
            </p>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-stone">
              {copy.lead}
            </p>
            {copy.supporting ? (
              <p className="mt-3 text-sm leading-relaxed text-stone">
                {copy.supporting}
              </p>
            ) : null}
          </header>

          <section className="mt-12" aria-labelledby="scale-heading">
            <h2 id="scale-heading" className="sr-only">
              Choose your scale
            </h2>
            <div className="grid gap-5 sm:grid-cols-3">
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
                          priority={p.isPopular}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-parchment" />
                      )}
                      {p.isPopular ? (
                        <span className="absolute left-2 top-2 bg-cream px-2 py-1 text-[11px] tracking-wide text-bark">
                          Most Popular
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
                    <div className="border-t border-parchment px-4 py-5">
                      <p className="font-serif text-xl text-bark">{p.name}</p>
                      <p className="mt-1.5 text-sm text-bark">
                        {formatCents(p.basePriceCents)}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-stone">
                        {p.blurb || p.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-5 max-w-2xl text-xs leading-relaxed text-stone/80">
              {copy.scaleNote}
            </p>
          </section>

          <hr className="my-12 border-parchment" />

          <section aria-labelledby="presentation-heading">
            {copy.presentationEyebrow ? (
              <p className="type-eyebrow">{copy.presentationEyebrow}</p>
            ) : null}
            <h2
              id="presentation-heading"
              className="font-serif text-2xl text-bark"
            >
              {copy.presentationTitle}
            </h2>
            {copy.presentationLead ? (
              <p className="mt-2 max-w-xl text-sm text-stone">
                {copy.presentationLead}
              </p>
            ) : null}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
                    className={`min-h-[10rem] border px-5 py-6 text-left transition-colors ${
                      selected
                        ? "border-bark bg-white"
                        : "border-parchment bg-cream/30 hover:border-stone"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-serif text-lg text-bark">
                        {opt.name}
                      </span>
                      {selected ? (
                        <span className="text-bark" aria-hidden>
                          ✓
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-stone">
                      {opt.description}
                    </p>
                    <p className="mt-4 text-sm text-bark">{opt.priceLabel}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-12 max-w-md border border-parchment bg-white px-5 py-6">
            <h2 className="font-serif text-xl text-bark">
              {copy.selectionTitle}
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-bark">
              <li className="flex gap-2">
                <span aria-hidden>✓</span>
                <span>
                  {product.name}
                  {/\barrangement\b/i.test(product.name)
                    ? ""
                    : " Arrangement"}
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>✓</span>
                <span>{presentationLabel}</span>
              </li>
            </ul>
            {pricing ? (
              <div className="mt-5 flex justify-between border-t border-parchment pt-4 text-sm">
                <span className="text-stone">Estimated Total</span>
                <span className="font-medium text-bark">
                  {formatCents(pricing.totalCents)}
                </span>
              </div>
            ) : null}
          </section>

          <div className="mt-8 max-w-md">
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
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-14 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="max-w-xl space-y-12 lg:max-w-none">
            <header>
              {copy.deliveryEyebrow ? (
                <p className="type-eyebrow">{copy.deliveryEyebrow}</p>
              ) : null}
              <h1 className="type-page-title mt-2 leading-tight">
                {copy.deliveryTitle}
              </h1>
              {copy.deliveryReassurance ? (
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone">
                  {copy.deliveryReassurance}
                </p>
              ) : null}
              <button
                type="button"
                className="mt-4 text-sm text-stone underline underline-offset-2"
                onClick={backToArrangement}
              >
                {copy.editArrangement}
              </button>
            </header>

            <section>
              <div className="grid gap-5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setFulfillmentType("delivery");
                    setPickupWindowId(null);
                    if (fulfillmentDate && fulfillmentDate <= todayIso()) {
                      setFulfillmentDate("");
                    }
                  }}
                  className={`min-h-[11rem] border px-7 py-8 text-left transition-colors ${
                    fulfillmentType === "delivery"
                      ? "border-bark bg-white"
                      : "border-parchment bg-cream/40 hover:border-stone"
                  }`}
                >
                  <span className="font-serif text-xl font-medium text-bark">
                    {copy.deliveryLocalName}
                  </span>
                  <p className="mt-4 text-sm leading-relaxed text-stone">
                    {copy.deliveryLocalBlurb}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFulfillmentType("pickup");
                    setZone(null);
                    setZoneError("");
                    setZoneSupportMessage("");
                  }}
                  className={`min-h-[11rem] border px-7 py-8 text-left transition-colors ${
                    fulfillmentType === "pickup"
                      ? "border-bark bg-white"
                      : "border-parchment bg-cream/40 hover:border-stone"
                  }`}
                >
                  <span className="font-serif text-xl font-medium text-bark">
                    {copy.deliveryPickupName}
                  </span>
                  <p className="mt-4 text-sm leading-relaxed text-stone">
                    {copy.deliveryPickupBlurb}
                  </p>
                </button>
              </div>
            </section>

            <section className="space-y-4">
              {fulfillmentType === "pickup" ? (
                <>
                  <h2 className="font-serif text-2xl text-bark">
                    When will you collect it?
                  </h2>
                  <label className="block text-sm">
                    Pickup date
                    <select
                      className="input mt-1 w-full"
                      value={fulfillmentDate}
                      onChange={(e) => {
                        setFulfillmentDate(e.target.value);
                        setPickupWindowId(null);
                      }}
                    >
                      <option value="">Select a date</option>
                      {dateOptions.map((d) => (
                        <option key={d.id} value={d.fulfillmentDate}>
                          {formatFulfillmentDate(d.fulfillmentDate)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedDay ? (
                    <label className="block text-sm">
                      Pickup window
                      <select
                        className="input mt-1 w-full"
                        value={pickupWindowId ?? ""}
                        onChange={(e) =>
                          setPickupWindowId(e.target.value || null)
                        }
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
                </>
              ) : (
                <div className="space-y-5">
                  <h2 className="font-serif text-3xl leading-tight text-bark">
                    {copy.whereGoingTitle}
                  </h2>
                  <label className="block text-sm">
                    Delivery ZIP Code
                    <p className="mt-1 text-xs leading-relaxed text-stone">
                      {copy.zipHelper}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <input
                        className="input w-full"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={10}
                        value={addressZip}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const digits = raw.replace(/\D/g, "").slice(0, 9);
                          const display =
                            digits.length > 5
                              ? `${digits.slice(0, 5)}-${digits.slice(5)}`
                              : digits;
                          setAddressZip(display);
                          if (digits.length < 5) {
                            setZone(null);
                            setZoneError("");
                            setZoneSupportMessage("");
                          }
                        }}
                        onBlur={() => void lookupZip(addressZip)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void lookupZip(addressZip);
                          }
                        }}
                      />
                      {lookingUpZip ? (
                        <span className="self-center text-xs text-stone">
                          Checking…
                        </span>
                      ) : null}
                    </div>
                  </label>

                  {zone ? (
                    <div className="border border-parchment bg-cream/50 px-5 py-4 text-sm leading-relaxed text-bark">
                      <p className="text-bark">
                        <span aria-hidden className="mr-1.5">
                          ✓
                        </span>
                        Great news! We deliver to this area.
                      </p>
                      <dl className="mt-3 grid gap-1 text-stone">
                        <div className="flex justify-between gap-4">
                          <dt>Delivery Area</dt>
                          <dd className="text-bark">{zone.name}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt>Delivery Fee</dt>
                          <dd className="text-bark">{zone.feeLabel}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}

                  {zoneError ? (
                    <div
                      className="border border-parchment bg-cream/40 px-5 py-4 text-sm leading-relaxed"
                      role="status"
                    >
                      <p className="text-bark">{zoneError}</p>
                      {zoneSupportMessage ? (
                        <p className="mt-2 text-stone">{zoneSupportMessage}</p>
                      ) : null}
                      <ul className="mt-4 space-y-2 text-sm text-bark">
                        <li>
                          <button
                            type="button"
                            className="underline underline-offset-2"
                            onClick={() => {
                              setFulfillmentType("pickup");
                              setZone(null);
                              setZoneError("");
                              setZoneSupportMessage("");
                            }}
                          >
                            Choose Farm Pickup
                          </button>
                        </li>
                        <li>
                          <a
                            href="/contact"
                            className="underline underline-offset-2"
                          >
                            Contact Grey Gables
                          </a>
                        </li>
                      </ul>
                    </div>
                  ) : null}

                  {zone ? (
                    <div className="space-y-4 border-t border-parchment pt-8">
                      {copy.deliveryDateRule ? (
                        <p className="text-xs leading-relaxed text-stone">
                          {copy.deliveryDateRule}
                        </p>
                      ) : null}
                      <label className="block text-sm">
                        Requested delivery date
                        <select
                          className="input mt-1 w-full"
                          value={fulfillmentDate}
                          onChange={(e) => {
                            setFulfillmentDate(e.target.value);
                            setPickupWindowId(null);
                          }}
                        >
                          <option value="">Select a date</option>
                          {dateOptions.map((d) => (
                            <option key={d.id} value={d.fulfillmentDate}>
                              {formatFulfillmentDate(d.fulfillmentDate)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm">
                        Recipient name
                        <input
                          className="input mt-1 w-full"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          autoComplete="name"
                        />
                      </label>
                      <label className="block text-sm">
                        Recipient phone
                        <input
                          className="input mt-1 w-full"
                          value={recipientPhone}
                          onChange={(e) => setRecipientPhone(e.target.value)}
                          autoComplete="tel"
                        />
                      </label>
                      <label className="block text-sm">
                        Street address
                        <input
                          className="input mt-1 w-full"
                          value={addressStreet}
                          onChange={(e) => setAddressStreet(e.target.value)}
                          autoComplete="address-line1"
                        />
                      </label>
                      <label className="block text-sm">
                        Address line 2
                        <input
                          className="input mt-1 w-full"
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          autoComplete="address-line2"
                          placeholder="Apt, suite, etc. (optional)"
                        />
                      </label>
                      <div className="grid gap-4 sm:grid-cols-[1fr_5rem_7rem]">
                        <label className="block text-sm">
                          City
                          <input
                            className="input mt-1 w-full"
                            value={addressCity}
                            onChange={(e) => setAddressCity(e.target.value)}
                            autoComplete="address-level2"
                          />
                        </label>
                        <label className="block text-sm">
                          State
                          <input
                            className="input mt-1 w-full"
                            value="VA"
                            readOnly
                            aria-readonly="true"
                          />
                        </label>
                        <label className="block text-sm">
                          ZIP
                          <input
                            className="input mt-1 w-full"
                            inputMode="numeric"
                            autoComplete="postal-code"
                            maxLength={10}
                            value={addressZip}
                            onChange={(e) => {
                              const digits = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 9);
                              const display =
                                digits.length > 5
                                  ? `${digits.slice(0, 5)}-${digits.slice(5)}`
                                  : digits;
                              setAddressZip(display);
                              setZone(null);
                              setZoneError("");
                              setZoneSupportMessage("");
                            }}
                            onBlur={() => void lookupZip(addressZip)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void lookupZip(addressZip);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <label className="block text-sm">
                        Delivery instructions
                        <p className="mt-1 text-xs leading-relaxed text-stone">
                          {copy.deliveryInstructionsHelper}
                        </p>
                        <textarea
                          className="input mt-2 w-full"
                          rows={3}
                          placeholder={copy.deliveryInstructionsPlaceholder}
                          value={deliveryInstructions}
                          onChange={(e) =>
                            setDeliveryInstructions(e.target.value)
                          }
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <section>
              <h2 className="font-serif text-2xl text-bark">
                {copy.enclosureTitle}
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className={`min-w-[7rem] border px-5 py-3 text-sm ${
                    !includeCard ? "border-bark bg-white" : "border-parchment"
                  }`}
                  onClick={() => {
                    setIncludeCard(false);
                    setCardMessage("");
                  }}
                >
                  {copy.enclosureNo}
                </button>
                <button
                  type="button"
                  className={`min-w-[7rem] border px-5 py-3 text-sm ${
                    includeCard ? "border-bark bg-white" : "border-parchment"
                  }`}
                  onClick={() => setIncludeCard(true)}
                >
                  {copy.enclosureYes}
                </button>
              </div>
              {includeCard ? (
                <div className="mt-5">
                  <p className="text-sm leading-relaxed text-stone">
                    {copy.enclosureHelper}
                  </p>
                  <textarea
                    className="input mt-3 w-full"
                    rows={3}
                    placeholder={copy.enclosurePlaceholder}
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                    maxLength={250}
                  />
                </div>
              ) : null}
            </section>

            <section>
              <h2 className="font-serif text-2xl text-bark">
                {copy.designerTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone">
                {copy.designerLead}
              </p>
              <textarea
                className="input mt-4 w-full"
                rows={4}
                placeholder={copy.designerPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-bark">
                {copy.contactTitle}
              </h2>
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
                {copy.rememberLabel}
              </label>
            </section>

            {error ? (
              <p className="text-sm text-red-800 lg:hidden" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3 lg:hidden">
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
                disabled={
                  submitting ||
                  !pricing ||
                  (fulfillmentType === "delivery" && !zone)
                }
              >
                {submitting ? "Starting checkout…" : copy.checkoutCta}
              </button>
            </div>
          </div>

          <aside className="mt-12 border border-parchment bg-white p-6 lg:mt-0 lg:sticky lg:top-8">
            <p className="type-eyebrow">{copy.summaryEyebrow}</p>
            <h2 className="mt-2 font-serif text-2xl text-bark">
              {copy.reviewTitle}
            </h2>
            <p className="mt-3 text-sm text-stone">
              {product.name}
              <span className="mt-0.5 block">{presentationLabel}</span>
            </p>
            {pricing ? (
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex justify-between gap-3 text-stone">
                  <span>Arrangement</span>
                  <span className="text-bark">
                    {formatCents(pricing.arrangementCents)}
                  </span>
                </li>
                {pricing.vesselCents > 0 ? (
                  <li className="flex justify-between gap-3 text-stone">
                    <span>Curated vessel</span>
                    <span className="text-bark">
                      {formatCents(pricing.vesselCents)}
                    </span>
                  </li>
                ) : null}
                {fulfillmentType === "pickup" ? (
                  <li className="text-stone">
                    <div className="flex justify-between gap-3">
                      <span>Farm Pickup</span>
                      <span className="text-bark">No charge</span>
                    </div>
                    {fulfillmentDate ? (
                      <p className="mt-1 text-xs text-stone">
                        {formatFulfillmentDate(fulfillmentDate)}
                        {selectedDay && pickupWindowId
                          ? ` · ${
                              selectedDay.windows?.find(
                                (w) => w.id === pickupWindowId,
                              )?.label ?? ""
                            }`
                          : ""}
                      </p>
                    ) : null}
                  </li>
                ) : zone ? (
                  <li className="text-stone">
                    <div className="flex justify-between gap-3">
                      <span>{zone.name} Delivery</span>
                      <span className="text-bark">{zone.feeLabel}</span>
                    </div>
                    {fulfillmentDate ? (
                      <p className="mt-1 text-xs text-stone">
                        {formatFulfillmentDate(fulfillmentDate)}
                      </p>
                    ) : null}
                  </li>
                ) : (
                  <li className="flex justify-between gap-3 text-stone">
                    <span>Delivery</span>
                    <span className="text-bark">Enter ZIP Code</span>
                  </li>
                )}
                <li className="flex justify-between gap-3 border-t border-parchment pt-3 font-medium text-bark">
                  <span>Estimated Total</span>
                  <span>{formatCents(pricing.totalCents)}</span>
                </li>
              </ul>
            ) : null}
            <p className="mt-2 text-xs text-stone">Tax calculated at checkout.</p>
            {error ? (
              <p className="mt-3 hidden text-sm text-red-800 lg:block" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-6 hidden flex-col gap-3 lg:flex">
              <button
                type="button"
                className="btn w-full border-bark bg-bark text-cream"
                onClick={() => void startCheckout()}
                disabled={
                  submitting ||
                  !pricing ||
                  (fulfillmentType === "delivery" && !zone)
                }
              >
                {submitting ? "Starting checkout…" : copy.checkoutCta}
              </button>
              <button
                type="button"
                className="btn w-full border-parchment"
                onClick={backToArrangement}
                disabled={submitting}
              >
                {copy.backCta}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
