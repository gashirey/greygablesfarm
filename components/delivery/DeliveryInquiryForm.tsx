"use client";

import { useState } from "react";
import { site } from "@/lib/content";
import { DELIVERY_BUDGETS, DELIVERY_OCCASIONS } from "@/lib/delivery/types";

const supabaseReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

type FormStatus = "idle" | "loading" | "success" | "error";

const SUCCESS_MESSAGE =
  "We'll confirm your order within 2 hours. If there's any question about availability we'll reach out before anything is charged.";

export function DeliveryInquiryForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  function openMailto(form: HTMLFormElement) {
    const data = new FormData(form);
    const lines = [
      `Name: ${data.get("name")}`,
      `Email: ${data.get("email")}`,
      `Phone: ${data.get("phone")}`,
      "",
      `Recipient: ${data.get("recipientName")}`,
      `Address: ${data.get("recipientAddress")}`,
      `County: ${data.get("recipientCounty")}`,
      `Delivery date: ${data.get("deliveryDate")}`,
      `Occasion: ${data.get("occasion")}`,
      `Budget: ${data.get("budget")}`,
      "",
      String(data.get("notes") ?? ""),
    ];
    const subject = encodeURIComponent(`Delivery inquiry — ${site.name}`);
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
      const res = await fetch("/api/delivery-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone") || undefined,
          recipientName: data.get("recipientName"),
          recipientAddress: data.get("recipientAddress"),
          recipientCounty: data.get("recipientCounty") || undefined,
          deliveryDate: data.get("deliveryDate"),
          occasion: data.get("occasion"),
          budget: data.get("budget"),
          notes: data.get("notes") || undefined,
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
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again or email us directly.");
    }
  }

  const disabled = status === "loading" || status === "success";

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
            <label htmlFor="delivery-name" className="block text-sm font-medium text-bark">
              Your name
            </label>
            <input
              id="delivery-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              disabled={disabled}
              className="input mt-1"
            />
          </div>
          <div>
            <label htmlFor="delivery-email" className="block text-sm font-medium text-bark">
              Your email
            </label>
            <input
              id="delivery-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              disabled={disabled}
              className="input mt-1"
            />
          </div>
        </div>

        <div>
          <label htmlFor="delivery-phone" className="block text-sm font-medium text-bark">
            Your phone
          </label>
          <input
            id="delivery-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            disabled={disabled}
            className="input mt-1"
          />
        </div>

        <div className="border-t border-parchment pt-5">
          <p className="text-sm font-medium text-bark">Recipient</p>
          <div className="mt-4 space-y-5">
            <div>
              <label
                htmlFor="delivery-recipient-name"
                className="block text-sm font-medium text-bark"
              >
                Recipient name
              </label>
              <input
                id="delivery-recipient-name"
                name="recipientName"
                type="text"
                required
                disabled={disabled}
                className="input mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="delivery-recipient-address"
                className="block text-sm font-medium text-bark"
              >
                Recipient address
              </label>
              <textarea
                id="delivery-recipient-address"
                name="recipientAddress"
                rows={2}
                required
                disabled={disabled}
                placeholder="Street, city, ZIP"
                className="input mt-1 resize-y"
              />
            </div>
            <div>
              <label
                htmlFor="delivery-recipient-county"
                className="block text-sm font-medium text-bark"
              >
                County{" "}
                <span className="font-normal text-stone">(if known)</span>
              </label>
              <input
                id="delivery-recipient-county"
                name="recipientCounty"
                type="text"
                disabled={disabled}
                placeholder="e.g. Albemarle"
                className="input mt-1"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="delivery-date"
              className="block text-sm font-medium text-bark"
            >
              Requested delivery date
            </label>
            <input
              id="delivery-date"
              name="deliveryDate"
              type="date"
              required
              disabled={disabled}
              className="input mt-1"
            />
          </div>
          <div>
            <label
              htmlFor="delivery-occasion"
              className="block text-sm font-medium text-bark"
            >
              Occasion
            </label>
            <select
              id="delivery-occasion"
              name="occasion"
              required
              disabled={disabled}
              className="input mt-1"
              defaultValue=""
            >
              <option value="" disabled>
                Select…
              </option>
              {DELIVERY_OCCASIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="delivery-budget" className="block text-sm font-medium text-bark">
            Budget
          </label>
          <select
            id="delivery-budget"
            name="budget"
            required
            disabled={disabled}
            className="input mt-1"
            defaultValue=""
          >
            <option value="" disabled>
              Select…
            </option>
            {DELIVERY_BUDGETS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="delivery-notes" className="block text-sm font-medium text-bark">
            Notes or requests
          </label>
          <textarea
            id="delivery-notes"
            name="notes"
            rows={4}
            disabled={disabled}
            placeholder="Colors, style, card message, anything we should know"
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
          {status === "loading" ? "Sending…" : "Request your arrangement"}
        </button>

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
