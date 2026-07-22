"use client";

import { useEffect, useMemo, useState } from "react";
import { site } from "@/lib/content";
import {
  SAME_DAY_CUTOFF_NOTE,
  earliestDeliveryDate,
  resolveDeliveryDateSelection,
  todayInDeliveryZone,
  weekdayInDeliveryZone,
} from "@/lib/flowers/delivery-date";
import type { FlowerTier } from "@/lib/flowers/types";

const supabaseReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

type FormStatus = "idle" | "loading" | "success" | "error";

const SUCCESS_MESSAGE =
  "Got it. We'll confirm your order and delivery by text or email shortly, with payment by secure link.";

const CARD_MESSAGE_MAX = 250;

type FlowerOrderFormProps = {
  initialTier?: string | null;
  tiers: FlowerTier[];
};

export function FlowerOrderForm({ initialTier, tiers }: FlowerOrderFormProps) {
  const defaultSlug =
    tiers.find((t) => t.slug === initialTier)?.slug ??
    tiers.find((t) => t.popular)?.slug ??
    tiers[0]?.slug ??
    "";

  const [tier, setTier] = useState(defaultSlug);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [cutoffNote, setCutoffNote] = useState(false);
  const [cardLen, setCardLen] = useState(0);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  const minDate = useMemo(() => earliestDeliveryDate(), []);

  useEffect(() => {
    setDeliveryDate(minDate);
  }, [minDate]);

  useEffect(() => {
    if (initialTier && tiers.some((t) => t.slug === initialTier)) {
      setTier(initialTier);
    }
  }, [initialTier, tiers]);

  function tierBySlug(slug: string) {
    return tiers.find((t) => t.slug === slug) ?? tiers[0];
  }

  function onDeliveryDateChange(value: string) {
    const resolved = resolveDeliveryDateSelection(value);
    setDeliveryDate(resolved.date);
    setCutoffNote(
      resolved.cutoffNote ||
        (value === todayInDeliveryZone() && resolved.date !== value),
    );
  }

  function isDateBlocked(iso: string) {
    const day = weekdayInDeliveryZone(iso);
    return day === 0 || day === 1;
  }

  function openMailto(form: HTMLFormElement) {
    const data = new FormData(form);
    const selected = tierBySlug(String(data.get("tier")));
    const lines = [
      `Tier: ${selected.name} (${selected.priceLabel})`,
      `Delivery date: ${data.get("deliveryDate")}`,
      "",
      `Your name: ${data.get("senderName")}`,
      `Your email: ${data.get("senderEmail")}`,
      `Your phone: ${data.get("senderPhone")}`,
      "",
      `Recipient: ${data.get("recipientName")}`,
      `Recipient phone: ${data.get("recipientPhone")}`,
      `Address: ${data.get("addressStreet")}`,
      `City: ${data.get("addressCity")}`,
      `ZIP: ${data.get("addressZip")}`,
      data.get("cardMessage")
        ? `\nCard message:\n${data.get("cardMessage")}`
        : null,
      data.get("notes") ? `\nNotes:\n${data.get("notes")}` : null,
    ].filter(Boolean);
    const subject = encodeURIComponent(
      `Flower order — ${selected.name} — ${site.name}`,
    );
    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    if (!supabaseReady) {
      openMailto(form);
      return;
    }

    setStatus("loading");
    setMessage("");

    const data = new FormData(form);

    try {
      const res = await fetch("/api/flower-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: data.get("tier"),
          senderName: data.get("senderName"),
          senderEmail: data.get("senderEmail"),
          senderPhone: data.get("senderPhone"),
          recipientName: data.get("recipientName"),
          recipientPhone: data.get("recipientPhone"),
          addressStreet: data.get("addressStreet"),
          addressCity: data.get("addressCity"),
          addressZip: data.get("addressZip"),
          deliveryDate: data.get("deliveryDate"),
          cardMessage: data.get("cardMessage") || undefined,
          notes: data.get("notes") || undefined,
          website: data.get("website"),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(json.error ?? "Something went wrong.");
        return;
      }

      setStatus("success");
      setMessage(SUCCESS_MESSAGE);
      form.reset();
      setTier(defaultSlug);
      setDeliveryDate(earliestDeliveryDate());
      setCutoffNote(false);
      setCardLen(0);
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again or email us directly.");
    }
  }

  const disabled = status === "loading" || status === "success";

  if (!tiers.length) {
    return (
      <p className="text-sm text-stone">
        No flower offerings are available right now. Please check back soon.
      </p>
    );
  }

  if (status === "success") {
    return (
      <div className="card p-6 md:p-8" role="status">
        <h2 className="font-serif text-2xl text-bark">Order received</h2>
        <p className="type-page-body mt-4 leading-relaxed">{SUCCESS_MESSAGE}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 md:p-8">
      {!supabaseReady ? (
        <p className="mb-6 text-sm text-stone">
          Opens your email app with your order pre-filled.
        </p>
      ) : null}

      <div className="space-y-5">
        <fieldset>
          <legend className="text-sm font-medium text-bark">Tier</legend>
          <div className="mt-3 space-y-2">
            {tiers.map((t) => (
              <label
                key={t.slug}
                className={`flex cursor-pointer items-start gap-3 border border-parchment px-3 py-3 ${
                  tier === t.slug ? "border-bark/40 bg-cream" : "bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="tier"
                  value={t.slug}
                  checked={tier === t.slug}
                  onChange={() => setTier(t.slug)}
                  disabled={disabled}
                  className="mt-1"
                  required
                />
                <span>
                  <span className="block text-sm font-medium text-bark">
                    {t.name} — {t.priceLabel}
                    {t.popular ? (
                      <span className="ml-2 chip bg-bark text-cream">
                        Most popular
                      </span>
                    ) : null}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="border-t border-parchment pt-5">
          <p className="text-sm font-medium text-bark">Your details</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="flower-sender-name"
                className="block text-sm font-medium text-bark"
              >
                Your name
              </label>
              <input
                id="flower-sender-name"
                name="senderName"
                type="text"
                required
                autoComplete="name"
                disabled={disabled}
                className="input mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="flower-sender-email"
                className="block text-sm font-medium text-bark"
              >
                Your email
              </label>
              <input
                id="flower-sender-email"
                name="senderEmail"
                type="email"
                required
                autoComplete="email"
                disabled={disabled}
                className="input mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="flower-sender-phone"
                className="block text-sm font-medium text-bark"
              >
                Your phone
              </label>
              <input
                id="flower-sender-phone"
                name="senderPhone"
                type="tel"
                required
                autoComplete="tel"
                disabled={disabled}
                className="input mt-1"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-parchment pt-5">
          <p className="text-sm font-medium text-bark">Recipient</p>
          <div className="mt-4 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="flower-recipient-name"
                  className="block text-sm font-medium text-bark"
                >
                  Recipient name
                </label>
                <input
                  id="flower-recipient-name"
                  name="recipientName"
                  type="text"
                  required
                  disabled={disabled}
                  className="input mt-1"
                />
              </div>
              <div>
                <label
                  htmlFor="flower-recipient-phone"
                  className="block text-sm font-medium text-bark"
                >
                  Recipient phone
                </label>
                <input
                  id="flower-recipient-phone"
                  name="recipientPhone"
                  type="tel"
                  required
                  disabled={disabled}
                  className="input mt-1"
                />
                <p className="mt-1 text-xs text-stone">
                  Required for delivery coordination.
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="flower-address-street"
                className="block text-sm font-medium text-bark"
              >
                Delivery address
              </label>
              <input
                id="flower-address-street"
                name="addressStreet"
                type="text"
                required
                autoComplete="street-address"
                disabled={disabled}
                placeholder="Street address"
                className="input mt-1"
              />
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <input
                  name="addressCity"
                  type="text"
                  required
                  autoComplete="address-level2"
                  disabled={disabled}
                  placeholder="City"
                  aria-label="City"
                  className="input"
                />
                <input
                  name="addressZip"
                  type="text"
                  required
                  autoComplete="postal-code"
                  disabled={disabled}
                  placeholder="ZIP"
                  aria-label="ZIP"
                  className="input"
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-stone">
                We deliver throughout Charlottesville, Crozet, Albemarle, Orange,
                Fluvanna, and Louisa. Outside the zone? Ask — we can often make
                it work.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="flower-delivery-date"
            className="block text-sm font-medium text-bark"
          >
            Delivery date
          </label>
          <input
            id="flower-delivery-date"
            name="deliveryDate"
            type="date"
            required
            min={minDate}
            value={deliveryDate}
            onChange={(e) => onDeliveryDateChange(e.target.value)}
            onBlur={(e) => {
              if (isDateBlocked(e.target.value)) {
                onDeliveryDateChange(e.target.value);
              }
            }}
            disabled={disabled}
            className="input mt-1"
          />
          <p className="mt-1 text-xs text-stone">
            Tuesday through Saturday. Order by 10am for same-day delivery.
          </p>
          {cutoffNote ? (
            <p className="mt-2 text-sm text-bark" role="status">
              {SAME_DAY_CUTOFF_NOTE}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="flower-card-message"
            className="block text-sm font-medium text-bark"
          >
            Card message{" "}
            <span className="font-normal text-stone">(optional)</span>
          </label>
          <textarea
            id="flower-card-message"
            name="cardMessage"
            rows={3}
            maxLength={CARD_MESSAGE_MAX}
            disabled={disabled}
            onChange={(e) => setCardLen(e.target.value.length)}
            className="input mt-1 resize-y"
          />
          <p className="mt-1 text-xs text-stone">
            {cardLen}/{CARD_MESSAGE_MAX}
          </p>
        </div>

        <div>
          <label
            htmlFor="flower-notes"
            className="block text-sm font-medium text-bark"
          >
            Anything we should know?{" "}
            <span className="font-normal text-stone">(optional)</span>
          </label>
          <textarea
            id="flower-notes"
            name="notes"
            rows={3}
            disabled={disabled}
            className="input mt-1 resize-y"
          />
        </div>

        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="sr-only"
          aria-hidden
        />

        <button
          type="submit"
          disabled={disabled}
          className="btn w-full border-[var(--color-salmon-button)] bg-[var(--color-salmon-button)] text-white hover:border-[var(--color-salmon-button-hover)] hover:bg-[var(--color-salmon-button-hover)] disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : "Submit order"}
        </button>

        {message && status === "error" ? (
          <p className="text-sm leading-relaxed text-bark" role="alert">
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
