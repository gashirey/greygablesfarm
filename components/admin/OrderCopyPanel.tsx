"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import {
  DEFAULT_ORDER_PAGE_COPY,
  type OrderPageCopy,
} from "@/lib/order/copy";
import { mergeSiteCopy } from "@/lib/site-cms/merge";
import type { SiteSettingsRow } from "@/lib/site-cms/types";

type Field = {
  key: keyof OrderPageCopy;
  label: string;
  multiline?: boolean;
  hint?: string;
};

const SECTIONS: { title: string; hint?: string; fields: Field[] }[] = [
  {
    title: "Page 1 — Create Your Arrangement",
    fields: [
      { key: "eyebrow", label: "Eyebrow (e.g. Seasonal Collection)" },
      { key: "title", label: "Title" },
      {
        key: "seasonalLabel",
        label: "Seasonal label under title (blank = auto, e.g. Summer Collection)",
      },
      { key: "lead", label: "Lead paragraph", multiline: true },
      {
        key: "supporting",
        label: "Supporting paragraph (optional — leave blank to hide)",
        multiline: true,
      },
      { key: "scaleNote", label: "Image disclaimer under scales", multiline: true },
      { key: "presentationTitle", label: "Vessel section title" },
      {
        key: "presentationLead",
        label: "Vessel section lead (optional)",
        multiline: true,
      },
      { key: "glassName", label: "Signature Glass Vase — name" },
      { key: "glassDescription", label: "Signature Glass Vase — description", multiline: true },
      { key: "glassPriceLabel", label: "Signature Glass Vase — price label" },
      { key: "curatedName", label: "Curated Keepsake — name" },
      { key: "curatedDescription", label: "Curated Keepsake — description", multiline: true },
      { key: "selectionTitle", label: "Your Selection heading" },
      { key: "continueCta", label: "Page 1 CTA" },
      { key: "continueHint", label: "Hint under Page 1 CTA (optional)" },
    ],
  },
  {
    title: "Progress labels",
    fields: [
      { key: "progressCreate", label: "Step 1 label" },
      { key: "progressDelivery", label: "Step 2 label" },
      { key: "progressCheckout", label: "Step 3 label" },
    ],
  },
  {
    title: "Page 2 — Delivery & personal details",
    fields: [
      { key: "deliveryEyebrow", label: "Fulfillment eyebrow" },
      { key: "deliveryTitle", label: "Fulfillment title" },
      {
        key: "deliveryReassurance",
        label: "Reassurance under title",
        multiline: true,
      },
      { key: "deliveryLocalName", label: "Local Delivery — name" },
      { key: "deliveryLocalBlurb", label: "Local Delivery — blurb" },
      { key: "deliveryPickupName", label: "Farm Pickup — name" },
      { key: "deliveryPickupBlurb", label: "Farm Pickup — blurb" },
      { key: "deliveryInTownName", label: "In Town Pickup — name" },
      { key: "deliveryInTownBlurb", label: "In Town Pickup — blurb" },
      { key: "whereGoingTitle", label: "Where is it going — heading" },
      { key: "zipHelper", label: "Delivery ZIP helper" },
      {
        key: "deliveryDateRule",
        label: "Delivery date rule (above date dropdown)",
        multiline: true,
      },
      {
        key: "deliveryInstructionsHelper",
        label: "Delivery instructions — helper text",
        multiline: true,
      },
      {
        key: "deliveryInstructionsPlaceholder",
        label: "Delivery instructions — placeholder",
        multiline: true,
      },
      { key: "enclosureTitle", label: "Enclosure card — question" },
      { key: "enclosureYes", label: "Enclosure — Yes" },
      { key: "enclosureNo", label: "Enclosure — No thanks" },
      { key: "enclosureHelper", label: "Enclosure helper", multiline: true },
      { key: "enclosurePlaceholder", label: "Enclosure placeholder" },
      { key: "designerTitle", label: "Designer notes title" },
      { key: "designerLead", label: "Designer notes lead", multiline: true },
      { key: "designerPlaceholder", label: "Designer notes placeholder" },
      { key: "contactTitle", label: "Contact section title" },
      { key: "rememberLabel", label: "Remember me checkbox" },
      { key: "reviewTitle", label: "Summary title" },
      { key: "backCta", label: "Back button" },
      { key: "checkoutCta", label: "Checkout button" },
      { key: "editArrangement", label: "Edit arrangement link" },
    ],
  },
];

export function OrderCopyPanel() {
  const [draft, setDraft] = useState<OrderPageCopy>(DEFAULT_ORDER_PAGE_COPY);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [setupError, setSetupError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/site-cms");
    const data = await res.json();
    if (!res.ok) {
      setSetupError(data.error ?? "Could not load site content.");
      return;
    }
    const settings = data.settings as SiteSettingsRow;
    const merged = mergeSiteCopy(settings.content_overrides ?? {});
    setDraft(merged.orderPage);
    setSetupError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setNotice(null);

    const resGet = await fetch("/api/admin/site-cms");
    const getData = await resGet.json();
    if (!resGet.ok) {
      setSaving(false);
      setNotice({ type: "error", message: getData.error ?? "Load failed." });
      return;
    }
    const current = (getData.settings as SiteSettingsRow).content_overrides ?? {};

    // Only store keys that differ from defaults (keeps overrides lean)
    const orderPage: Partial<OrderPageCopy> = {};
    (Object.keys(DEFAULT_ORDER_PAGE_COPY) as (keyof OrderPageCopy)[]).forEach(
      (key) => {
        const value = draft[key];
        if (value !== DEFAULT_ORDER_PAGE_COPY[key]) {
          (orderPage as Record<string, unknown>)[key] = value;
        }
      },
    );

    const res = await fetch("/api/admin/site-cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content_overrides: {
          ...current,
          orderPage,
        },
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setNotice({ type: "error", message: data.error ?? "Save failed." });
      return;
    }

    const merged = mergeSiteCopy(
      (data.settings as SiteSettingsRow).content_overrides ?? {},
    );
    setDraft(merged.orderPage);
    setNotice({ type: "success", message: "Order page copy saved." });
  }

  if (setupError) {
    return <p className="text-sm text-bark">{setupError}</p>;
  }

  return (
    <div className="space-y-8">
      {notice && (
        <AdminNotice
          type={notice.type}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <p className="max-w-2xl text-sm text-stone">
        Wording for the Designer's Choice order experience at{" "}
        <span className="font-mono text-xs">/order</span>. Scale names, prices,
        and photos are edited under{" "}
        <a href="/admin/order/products" className="underline underline-offset-2">
          Order → Products
        </a>
        .
      </p>

      <section className="border border-parchment bg-white p-5">
        <label className="flex items-start gap-2 text-sm text-bark">
          <input
            type="checkbox"
            className="mt-1"
            checked={draft.allowCustomerVesselChoice}
            onChange={(e) =>
              setDraft({ ...draft, allowCustomerVesselChoice: e.target.checked })
            }
          />
          <span>
            <span className="font-medium">Allow “Choose Your Vessel”</span>
            <span className="mt-1 block text-stone">
              When off, Curated Keepsake Vessel is Designer's Choice only (recommended
              until vessel inventory is ready).
            </span>
          </span>
        </label>
      </section>

      {SECTIONS.map((section) => (
        <section key={section.title} className="border border-parchment bg-white p-5">
          <h2 className="font-serif text-lg text-bark">{section.title}</h2>
          {section.hint ? (
            <p className="mt-1 text-sm text-stone">{section.hint}</p>
          ) : null}
          <div className="mt-4 grid gap-4">
            {section.fields.map((field) => (
              <label key={field.key} className="block text-sm">
                {field.label}
                {field.multiline ? (
                  <textarea
                    className="input mt-1 w-full"
                    rows={3}
                    value={String(draft[field.key] ?? "")}
                    onChange={(e) =>
                      setDraft({ ...draft, [field.key]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    type="text"
                    className="input mt-1 w-full"
                    value={String(draft[field.key] ?? "")}
                    onChange={(e) =>
                      setDraft({ ...draft, [field.key]: e.target.value })
                    }
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn border-bark bg-bark text-cream"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? "Saving…" : "Save order copy"}
        </button>
        <button
          type="button"
          className="btn border-parchment"
          disabled={saving}
          onClick={() => setDraft(DEFAULT_ORDER_PAGE_COPY)}
        >
          Reset form to defaults
        </button>
      </div>
    </div>
  );
}
