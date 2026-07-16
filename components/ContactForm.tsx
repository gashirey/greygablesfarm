"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { site } from "@/lib/content";

const supabaseReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

const subjectLabels: Record<string, string> = {
  flowers: "Flower inquiry",
  event: "Event inquiry",
  wedding: "Event inquiry",
  general: "General question",
};

type FormStatus = "idle" | "loading" | "success" | "error";

type ContactSubject = "flowers" | "event" | "general";

type ContactFormProps = {
  variant?: "default" | "light";
  /** Prefer this subject when the URL has no ?subject= */
  defaultSubject?: ContactSubject;
  messagePlaceholder?: string;
  /** Stored on the contact for campaign attribution (e.g. campaign_artful_lodger) */
  source?: string;
  /** Prefixed into the saved notes so you know which page they came from */
  contextNote?: string;
  /** Tighter spacing for QR / phone campaign pages */
  compact?: boolean;
  /** Single-viewport density: smaller fields, name/email side by side */
  dense?: boolean;
  /** Hide subject select; still submits defaultSubject */
  hideSubject?: boolean;
  /** Omit phone field (still optional when shown) */
  hidePhone?: boolean;
  /** No card chrome — for embedding in an outer frame */
  bare?: boolean;
};

export function ContactForm({
  variant = "default",
  defaultSubject: defaultSubjectProp,
  messagePlaceholder,
  source,
  contextNote,
  compact = false,
  dense = false,
  hideSubject = false,
  hidePhone = false,
  bare = false,
}: ContactFormProps) {
  const searchParams = useSearchParams();
  const rawSubject =
    searchParams.get("subject") ?? defaultSubjectProp ?? "general";
  const subjectKey = rawSubject === "wedding" ? "event" : rawSubject;
  const defaultSubject = subjectLabels[subjectKey] ?? subjectLabels.general;

  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  function openMailto(form: HTMLFormElement) {
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const subject = String(data.get("subject") ?? "general");
    const bodyText = String(data.get("message") ?? "");
    const subjectLabel = subjectLabels[subject] ?? subjectLabels.general;

    const subjectLine = encodeURIComponent(`${subjectLabel} — ${site.name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${bodyText}`,
    );

    window.location.href = `mailto:${site.email}?subject=${subjectLine}&body=${body}`;
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
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone") || undefined,
          subject: data.get("subject"),
          message: data.get("message"),
          source: source || undefined,
          context: contextNote || undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(json.error ?? "Something went wrong.");
        return;
      }

      setStatus("success");
      setMessage("Thanks — we received your message and will reply within 2–3 business days.");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again or email us directly.");
    }
  }

  const disabled = status === "loading" || status === "success";
  const light = variant === "light";
  const labelClass = light
    ? `block font-medium text-white ${dense ? "text-xs" : "text-sm"}`
    : `block font-medium text-bark ${dense ? "text-xs" : "text-sm"}`;
  const optionalClass = light ? "font-normal text-white/70" : "font-normal text-stone";
  const inputClass = light
    ? `mt-1 w-full rounded-sm border border-white/25 bg-white/85 text-bark outline-none focus:border-salmon focus:ring-1 focus:ring-salmon ${
        dense ? "px-3 py-2 text-sm" : "px-4 py-2.5"
      }`
    : dense
      ? "input mt-1 px-3 py-2 text-sm"
      : "input mt-1";
  const statusClass =
    status === "error"
      ? light
        ? "text-white"
        : "text-bark"
      : light
        ? "text-white/85"
        : "text-stone";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        light || bare
          ? ""
          : dense
            ? "card p-3"
            : compact
              ? "card p-4"
              : "card p-5"
      }
    >
      <div className={dense ? "space-y-2" : compact ? "space-y-3" : "space-y-4"}>
        <div className={dense ? "grid grid-cols-2 gap-2" : "contents"}>
          <div>
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              disabled={disabled}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              disabled={disabled}
              className={inputClass}
            />
          </div>
        </div>
        {!hidePhone ? (
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone <span className={optionalClass}>(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              disabled={disabled}
              className={inputClass}
            />
          </div>
        ) : null}
        {hideSubject ? (
          <input type="hidden" name="subject" value={subjectKey} />
        ) : (
          <div>
            <label htmlFor="subject" className={labelClass}>
              Subject
            </label>
            <select
              id="subject"
              name="subject"
              defaultValue={subjectKey}
              disabled={disabled}
              className={inputClass}
            >
              <option value="flowers">Flower inquiry</option>
              <option value="event">Event</option>
              <option value="general">General question</option>
            </select>
          </div>
        )}
        <div>
          <label htmlFor="message" className={labelClass}>
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={dense ? 2 : compact ? 3 : 4}
            required
            disabled={disabled}
            placeholder={
              messagePlaceholder ??
              `Tell us about your ${defaultSubject.toLowerCase()}...`
            }
            className={`${inputClass} resize-none`}
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
          className={`btn w-full border-salmon-dark bg-salmon-dark text-white hover:bg-salmon disabled:opacity-60 ${
            dense ? "py-2.5 text-sm" : ""
          }`}
        >
          {status === "loading" ? "Sending…" : "Send message"}
        </button>

        {message ? (
          <p
            className={`text-sm ${statusClass}`}
            role={status === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
