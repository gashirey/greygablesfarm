"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { surgeExperienceBookUrl } from "@/lib/surge/book-url";
import type {
  BookingMode,
  OccurrenceStatus,
  PaymentRequirement,
  PricingModel,
  PublicationStatus,
  SurgeExperienceDetail,
  SurgeOccurrence,
} from "@/lib/surge/types";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string) {
  return new Date(value).toISOString();
}

function centsToDollars(cents: number | null | undefined) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

function dollarsToCents(value: string) {
  if (!value.trim()) return null;
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

const OCC_STATUSES: OccurrenceStatus[] = [
  "open",
  "closed",
  "scheduled",
  "sold_out",
  "draft",
  "cancelled",
  "completed",
];

type FormState = {
  internal_name: string;
  public_title: string;
  category: string;
  short_description: string;
  full_description: string;
  image_url: string;
  publication_status: PublicationStatus;
  location_name: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  directions_url: string;
  customer_instructions: string;
  location_public_before_book: boolean;
  booking_mode: BookingMode;
  capacity_unit_label: string;
  min_quantity: number;
  max_quantity: string;
  pricing_model: PricingModel;
  base_price: string;
  payment_requirement: PaymentRequirement;
  deposit_price: string;
  cancellation_policy: string;
  weather_policy: string;
  participation_instructions: string;
  arrival_instructions: string;
  waiver_text: string;
};

function fromExperience(exp: SurgeExperienceDetail): FormState {
  return {
    internal_name: exp.internal_name,
    public_title: exp.public_title,
    category: exp.category ?? "",
    short_description: exp.short_description ?? "",
    full_description: exp.full_description ?? "",
    image_url: exp.image_url ?? "",
    publication_status: exp.publication_status,
    location_name: exp.location_name ?? "",
    address_line1: exp.address_line1 ?? "",
    city: exp.city ?? "",
    state: exp.state ?? "",
    postal_code: exp.postal_code ?? "",
    directions_url: exp.directions_url ?? "",
    customer_instructions: exp.customer_instructions ?? "",
    location_public_before_book: exp.location_public_before_book,
    booking_mode: exp.booking_mode,
    capacity_unit_label: exp.capacity_unit_label,
    min_quantity: exp.min_quantity,
    max_quantity: exp.max_quantity == null ? "" : String(exp.max_quantity),
    pricing_model: exp.pricing_model,
    base_price: centsToDollars(exp.base_price_cents) || "0.00",
    payment_requirement: exp.payment_requirement,
    deposit_price: centsToDollars(exp.deposit_cents),
    cancellation_policy: exp.cancellation_policy ?? "",
    weather_policy: exp.weather_policy ?? "",
    participation_instructions: exp.participation_instructions ?? "",
    arrival_instructions: exp.arrival_instructions ?? "",
    waiver_text: exp.waiver_text ?? "",
  };
}

export function UPickExperienceEditor({ experienceId }: { experienceId: string }) {
  const [experience, setExperience] = useState<SurgeExperienceDetail | null>(
    null,
  );
  const [form, setForm] = useState<FormState | null>(null);
  const [preview, setPreview] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [savingExperience, setSavingExperience] = useState(false);
  const [savingOccId, setSavingOccId] = useState<string | null>(null);
  const [occurrences, setOccurrences] = useState<SurgeOccurrence[]>([]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/u-pick/experiences/${experienceId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      setLoadError(data.error ?? "Could not load experience.");
      setExperience(null);
      setForm(null);
      setPreview(Boolean(data.preview));
      return;
    }
    const exp = data.experience as SurgeExperienceDetail;
    setLoadError("");
    setExperience(exp);
    setForm(fromExperience(exp));
    setPreview(Boolean(data.preview));
    setOccurrences(exp.occurrences ?? []);
  }, [experienceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveExperience(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSavingExperience(true);
    setNotice(null);
    const res = await fetch(`/api/admin/u-pick/experiences/${experienceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        internal_name: form.internal_name,
        public_title: form.public_title,
        category: form.category || null,
        short_description: form.short_description || null,
        full_description: form.full_description || null,
        image_url: form.image_url || null,
        publication_status: form.publication_status,
        location_name: form.location_name || null,
        address_line1: form.address_line1 || null,
        city: form.city || null,
        state: form.state || null,
        postal_code: form.postal_code || null,
        directions_url: form.directions_url || null,
        customer_instructions: form.customer_instructions || null,
        location_public_before_book: form.location_public_before_book,
        booking_mode: form.booking_mode,
        capacity_unit_label: form.capacity_unit_label,
        min_quantity: form.min_quantity,
        max_quantity: form.max_quantity === "" ? null : Number(form.max_quantity),
        pricing_model: form.pricing_model,
        base_price_cents: dollarsToCents(form.base_price) ?? 0,
        payment_requirement: form.payment_requirement,
        deposit_cents: dollarsToCents(form.deposit_price),
        cancellation_policy: form.cancellation_policy || null,
        weather_policy: form.weather_policy || null,
        participation_instructions: form.participation_instructions || null,
        arrival_instructions: form.arrival_instructions || null,
        waiver_text: form.waiver_text || null,
      }),
    });
    const data = await res.json();
    setSavingExperience(false);
    if (!res.ok) {
      setNotice({ type: "error", message: data.error ?? "Save failed." });
      return;
    }
    setNotice({ type: "success", message: "Experience saved." });
    await load();
  }

  async function saveOccurrence(occ: SurgeOccurrence) {
    setSavingOccId(occ.id);
    setNotice(null);
    const res = await fetch(`/api/admin/u-pick/occurrences/${occ.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        starts_at: occ.starts_at,
        ends_at: occ.ends_at,
        capacity: occ.capacity,
        price_cents_override: occ.price_cents_override,
        status: occ.status,
      }),
    });
    const data = await res.json();
    setSavingOccId(null);
    if (!res.ok) {
      setNotice({ type: "error", message: data.error ?? "Night save failed." });
      return;
    }
    setNotice({ type: "success", message: "Night saved." });
    await load();
  }

  function updateOccurrence(id: string, patch: Partial<SurgeOccurrence>) {
    setOccurrences((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link href="/admin/u-pick" className="text-sm text-stone underline">
          ← U-Pick
        </Link>
        <div className="border border-parchment bg-white p-4 text-sm text-stone">
          <p className="font-medium text-bark">Could not load experience</p>
          <p className="mt-2">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!experience || !form) {
    return <p className="text-sm text-stone">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/u-pick" className="text-sm text-stone underline">
          ← U-Pick
        </Link>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl text-bark">
              {experience.public_title}
            </h1>
            <p className="mt-1 text-sm text-stone">
              Slug: {experience.slug}
              {preview ? " · preview data" : ""}
              {" · "}
              {experience.publication_status}
            </p>
          </div>
          <a
            href={surgeExperienceBookUrl(experience.slug)}
            target="_blank"
            rel="noreferrer"
            className="btn shrink-0 self-start border border-parchment bg-white text-bark"
          >
            View live booking page
          </a>
        </div>
      </div>

      {preview ? (
        <AdminNotice
          type="error"
          message="Preview layout — Surge business API is not connected. Edits will not save until the bridge is configured."
        />
      ) : null}

      {notice ? (
        <AdminNotice
          type={notice.type}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      ) : null}

      <form onSubmit={(e) => void saveExperience(e)} className="space-y-6">
        <Section title="Identity">
          <Field label="Internal name">
            <input
              className="input mt-1 w-full"
              value={form.internal_name}
              onChange={(e) => set("internal_name", e.target.value)}
              required
            />
          </Field>
          <Field label="Public title">
            <input
              className="input mt-1 w-full"
              value={form.public_title}
              onChange={(e) => set("public_title", e.target.value)}
              required
            />
          </Field>
          <Field label="Category">
            <input
              className="input mt-1 w-full"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            />
          </Field>
          <Field label="Short description">
            <textarea
              className="input mt-1 w-full"
              rows={2}
              value={form.short_description}
              onChange={(e) => set("short_description", e.target.value)}
            />
          </Field>
          <Field label="Full description">
            <textarea
              className="input mt-1 w-full"
              rows={5}
              value={form.full_description}
              onChange={(e) => set("full_description", e.target.value)}
            />
          </Field>
          <Field label="Image URL">
            <input
              className="input mt-1 w-full"
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Publish status">
            <select
              className="input mt-1"
              value={form.publication_status}
              onChange={(e) =>
                set("publication_status", e.target.value as PublicationStatus)
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </Section>

        <Section title="Location">
          <Field label="Location name">
            <input
              className="input mt-1 w-full"
              value={form.location_name}
              onChange={(e) => set("location_name", e.target.value)}
            />
          </Field>
          <Field label="Address">
            <input
              className="input mt-1 w-full"
              value={form.address_line1}
              onChange={(e) => set("address_line1", e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="City">
              <input
                className="input mt-1 w-full"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </Field>
            <Field label="State">
              <input
                className="input mt-1 w-full"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
              />
            </Field>
            <Field label="ZIP">
              <input
                className="input mt-1 w-full"
                value={form.postal_code}
                onChange={(e) => set("postal_code", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Directions URL">
            <input
              className="input mt-1 w-full"
              value={form.directions_url}
              onChange={(e) => set("directions_url", e.target.value)}
            />
          </Field>
          <Field label="Customer instructions">
            <textarea
              className="input mt-1 w-full"
              rows={3}
              value={form.customer_instructions}
              onChange={(e) => set("customer_instructions", e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-bark">
            <input
              type="checkbox"
              checked={form.location_public_before_book}
              onChange={(e) =>
                set("location_public_before_book", e.target.checked)
              }
            />
            Show exact location before booking
          </label>
        </Section>

        <Section title="Registration & capacity">
          <Field label="Booking mode">
            <select
              className="input mt-1"
              value={form.booking_mode}
              onChange={(e) =>
                set("booking_mode", e.target.value as BookingMode)
              }
            >
              <option value="open">Open booking</option>
              <option value="operator_only">Operator-created only</option>
            </select>
          </Field>
          <Field label="Capacity unit label">
            <input
              className="input mt-1 w-full"
              value={form.capacity_unit_label}
              onChange={(e) => set("capacity_unit_label", e.target.value)}
              placeholder="spots, people, seats…"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Min quantity">
              <input
                className="input mt-1 w-full"
                type="number"
                min={1}
                value={form.min_quantity}
                onChange={(e) =>
                  set("min_quantity", Number(e.target.value) || 1)
                }
              />
            </Field>
            <Field label="Max quantity (optional)">
              <input
                className="input mt-1 w-full"
                type="number"
                min={1}
                value={form.max_quantity}
                onChange={(e) => set("max_quantity", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Pricing & Stripe payment">
          <p className="text-sm text-stone">
            Customers pay via Stripe Checkout on the book page. Connect the farm
            Stripe account from the U-Pick list page. Here you set what to
            charge.
          </p>
          <Field label="Pricing model">
            <select
              className="input mt-1"
              value={form.pricing_model}
              onChange={(e) =>
                set("pricing_model", e.target.value as PricingModel)
              }
            >
              <option value="per_unit">Fixed price per capacity unit</option>
              <option value="per_reservation">
                Fixed price per reservation
              </option>
              <option value="free">Free</option>
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Base price (USD)">
              <input
                className="input mt-1 w-full"
                type="number"
                min="0"
                step="0.01"
                value={form.base_price}
                onChange={(e) => set("base_price", e.target.value)}
                disabled={form.pricing_model === "free"}
              />
            </Field>
            <Field label="Payment requirement">
              <select
                className="input mt-1 w-full"
                value={form.payment_requirement}
                onChange={(e) =>
                  set(
                    "payment_requirement",
                    e.target.value as PaymentRequirement,
                  )
                }
              >
                <option value="full">Full payment required</option>
                <option value="deposit">Deposit required</option>
                <option value="none">No online payment</option>
              </select>
            </Field>
          </div>
          {form.payment_requirement === "deposit" ? (
            <Field label="Deposit amount (USD)">
              <input
                className="input mt-1 w-40"
                type="number"
                min="0"
                step="0.01"
                value={form.deposit_price}
                onChange={(e) => set("deposit_price", e.target.value)}
              />
            </Field>
          ) : null}
        </Section>

        <Section title="Policies">
          <Field label="Cancellation policy">
            <textarea
              className="input mt-1 w-full"
              rows={2}
              value={form.cancellation_policy}
              onChange={(e) => set("cancellation_policy", e.target.value)}
            />
          </Field>
          <Field label="Weather policy">
            <textarea
              className="input mt-1 w-full"
              rows={2}
              value={form.weather_policy}
              onChange={(e) => set("weather_policy", e.target.value)}
            />
          </Field>
          <Field label="Participation instructions">
            <textarea
              className="input mt-1 w-full"
              rows={2}
              value={form.participation_instructions}
              onChange={(e) =>
                set("participation_instructions", e.target.value)
              }
            />
          </Field>
          <Field label="Arrival instructions">
            <textarea
              className="input mt-1 w-full"
              rows={2}
              value={form.arrival_instructions}
              onChange={(e) => set("arrival_instructions", e.target.value)}
            />
          </Field>
          <Field label="Waiver / acknowledgement">
            <textarea
              className="input mt-1 w-full"
              rows={3}
              value={form.waiver_text}
              onChange={(e) => set("waiver_text", e.target.value)}
            />
          </Field>
        </Section>

        <button
          type="submit"
          className="btn"
          disabled={savingExperience || preview}
        >
          {savingExperience ? "Saving…" : "Save experience"}
        </button>
      </form>

      <section className="space-y-4">
        <div>
          <h2 className="font-medium text-bark">Nights</h2>
          <p className="mt-1 text-sm text-stone">
            Edit start/end, capacity, price override, and open/closed status for
            each night.
          </p>
        </div>

        {occurrences.length === 0 ? (
          <div className="border border-parchment bg-white p-4 text-sm text-stone">
            No upcoming nights on this experience.
          </div>
        ) : (
          <ul className="space-y-4">
            {occurrences.map((occ) => (
              <li
                key={occ.id}
                className="space-y-3 border border-parchment bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-bark">
                    {new Intl.DateTimeFormat("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(occ.starts_at))}
                  </p>
                  <span className="chip text-xs uppercase tracking-wide">
                    {occ.status}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Starts">
                    <input
                      className="input mt-1 w-full"
                      type="datetime-local"
                      value={toLocalInput(occ.starts_at)}
                      onChange={(e) =>
                        updateOccurrence(occ.id, {
                          starts_at: fromLocalInput(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field label="Ends">
                    <input
                      className="input mt-1 w-full"
                      type="datetime-local"
                      value={toLocalInput(occ.ends_at)}
                      onChange={(e) =>
                        updateOccurrence(occ.id, {
                          ends_at: fromLocalInput(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field label="Capacity">
                    <input
                      className="input mt-1 w-full"
                      type="number"
                      min="0"
                      value={occ.capacity}
                      onChange={(e) =>
                        updateOccurrence(occ.id, {
                          capacity: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                  <Field label="Price override (USD)">
                    <input
                      className="input mt-1 w-full"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Base price"
                      value={
                        occ.price_cents_override == null
                          ? ""
                          : centsToDollars(occ.price_cents_override)
                      }
                      onChange={(e) =>
                        updateOccurrence(occ.id, {
                          price_cents_override: e.target.value
                            ? dollarsToCents(e.target.value)
                            : null,
                        })
                      }
                    />
                  </Field>
                  <Field label="Status">
                    <select
                      className="input mt-1 w-full"
                      value={occ.status}
                      onChange={(e) =>
                        updateOccurrence(occ.id, {
                          status: e.target.value as OccurrenceStatus,
                        })
                      }
                    >
                      {OCC_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <button
                  type="button"
                  className="btn"
                  disabled={savingOccId === occ.id || preview}
                  onClick={() => void saveOccurrence(occ)}
                >
                  {savingOccId === occ.id ? "Saving…" : "Save night"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border border-parchment bg-white p-5">
      <h2 className="font-medium text-bark">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="text-stone">{label}</span>
      {children}
    </label>
  );
}
