"use client";

import { useState } from "react";
import { bloomsPackage } from "@/lib/blooms/package";
import { site } from "@/lib/content";

const supabaseReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const stripeReady = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

type FormStatus = "idle" | "loading" | "success" | "error";

const SUCCESS_WITHOUT_PAYMENT =
  "Thanks — we received your booking request. We'll confirm your session time by email within 1–2 business days.";

const SUCCESS_WITH_PAYMENT =
  "Thanks — redirecting you to secure checkout. We'll confirm your session time after payment.";

type BloomsBookingFormProps = {
  paymentLinkUrl?: string | null;
};

export function BloomsBookingForm({ paymentLinkUrl }: BloomsBookingFormProps) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  function openMailto(form: HTMLFormElement) {
    const data = new FormData(form);
    const lines = [
      `${bloomsPackage.title} — ${bloomsPackage.packageName}`,
      "",
      `Name: ${data.get("name")}`,
      `Partner: ${data.get("partnerName")}`,
      `Email: ${data.get("email")}`,
      `Phone: ${data.get("phone")}`,
      `Preferred date: ${data.get("preferredDate")}`,
      `Preferred time: ${data.get("preferredTime")}`,
      "",
      String(data.get("notes") ?? ""),
    ];
    const subject = encodeURIComponent(
      `${bloomsPackage.title} booking — ${site.name}`,
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
      const res = await fetch("/api/blooms-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          partnerName: data.get("partnerName") || undefined,
          email: data.get("email"),
          phone: data.get("phone") || undefined,
          preferredDate: data.get("preferredDate") || undefined,
          preferredTime: data.get("preferredTime") || undefined,
          notes: data.get("notes") || undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(json.error ?? "Something went wrong.");
        return;
      }

      if (json.checkoutUrl) {
        setStatus("success");
        setMessage(SUCCESS_WITH_PAYMENT);
        window.location.href = json.checkoutUrl;
        return;
      }

      setStatus("success");
      setMessage(SUCCESS_WITHOUT_PAYMENT);
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again or email us directly.");
    }
  }

  const disabled = status === "loading" || status === "success";
  const submitLabel =
    status === "loading"
      ? "Sending…"
      : stripeReady
        ? `Book now — ${bloomsPackage.priceDisplay}`
        : "Request booking";

  return (
    <form onSubmit={handleSubmit} className="card p-6 md:p-8">
      {!supabaseReady ? (
        <p className="mb-6 text-sm text-stone">
          Opens your email app with your request pre-filled.
        </p>
      ) : null}

      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="blooms-name" className="block text-sm font-medium text-bark">
              Your name
            </label>
            <input
              id="blooms-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              disabled={disabled}
              className="input mt-1"
            />
          </div>
          <div>
            <label
              htmlFor="blooms-partner"
              className="block text-sm font-medium text-bark"
            >
              Partner&apos;s name
            </label>
            <input
              id="blooms-partner"
              name="partnerName"
              type="text"
              autoComplete="name"
              disabled={disabled}
              className="input mt-1"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="blooms-email" className="block text-sm font-medium text-bark">
              Email
            </label>
            <input
              id="blooms-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              disabled={disabled}
              className="input mt-1"
            />
          </div>
          <div>
            <label htmlFor="blooms-phone" className="block text-sm font-medium text-bark">
              Phone{" "}
              <span className="font-normal text-stone">(optional)</span>
            </label>
            <input
              id="blooms-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              disabled={disabled}
              className="input mt-1"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="blooms-date"
              className="block text-sm font-medium text-bark"
            >
              Preferred date
            </label>
            <input
              id="blooms-date"
              name="preferredDate"
              type="date"
              disabled={disabled}
              className="input mt-1"
            />
          </div>
          <div>
            <label
              htmlFor="blooms-time"
              className="block text-sm font-medium text-bark"
            >
              Preferred time
            </label>
            <select
              id="blooms-time"
              name="preferredTime"
              disabled={disabled}
              className="input mt-1"
              defaultValue=""
            >
              <option value="">Flexible</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="golden_hour">Golden hour</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="blooms-notes" className="block text-sm font-medium text-bark">
            Notes{" "}
            <span className="font-normal text-stone">(optional)</span>
          </label>
          <textarea
            id="blooms-notes"
            name="notes"
            rows={3}
            disabled={disabled}
            placeholder="Anything we should know — accessibility, celebration, etc."
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
          className="btn w-full border-salmon-dark bg-salmon-dark text-white hover:bg-salmon disabled:opacity-60"
        >
          {submitLabel}
        </button>

        {paymentLinkUrl && !stripeReady ? (
          <p className="text-sm text-stone">
            Or{" "}
            <a
              href={paymentLinkUrl}
              className="text-bark underline underline-offset-4 decoration-parchment hover:text-salmon-dark"
              target="_blank"
              rel="noopener noreferrer"
            >
              pay {bloomsPackage.priceDisplay} now via Stripe
            </a>
            .
          </p>
        ) : null}

        {stripeReady ? (
          <p className="text-sm text-stone">{bloomsPackage.paymentNote}</p>
        ) : null}

        {message ? (
          <p
            className={`text-sm leading-relaxed ${status === "error" ? "text-bark" : "text-stone"}`}
            role={status === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
