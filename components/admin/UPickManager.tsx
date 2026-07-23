"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { UPickPaymentPanel } from "@/components/admin/UPickPaymentPanel";
import type { SurgeExperienceListItem } from "@/lib/surge/types";

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function UPickManager() {
  const [experiences, setExperiences] = useState<SurgeExperienceListItem[]>(
    [],
  );
  const [preview, setPreview] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/u-pick/experiences", {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      setLoadError(data.error ?? "Could not load U-Pick experiences.");
      setExperiences([]);
      setPreview(Boolean(data.preview));
    } else {
      setLoadError("");
      setExperiences(data.experiences ?? []);
      setPreview(Boolean(data.preview));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-bark">U-Pick</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone">
          Manage August U-Pick nights here. Capacity, holds, and bookings live
          in Surge Experiences — this page is the farm-facing editor only.
        </p>
      </div>

      {preview ? (
        <AdminNotice
          type="error"
          message="Preview layout — Surge business API is not connected yet. Set SURGE_BUSINESS_API_BASE and SURGE_GREY_GABLES_API_KEY to edit live nights. Saves are disabled."
        />
      ) : null}

      {loadError ? (
        <div className="border border-parchment bg-white p-4 text-sm text-stone">
          <p className="font-medium text-bark">Could not load U-Pick</p>
          <p className="mt-2">{loadError}</p>
        </div>
      ) : null}

      <UPickPaymentPanel />

      {loading ? (
        <p className="text-sm text-stone">Loading…</p>
      ) : experiences.length === 0 ? (
        <div className="border border-parchment bg-white p-5 text-sm text-stone">
          <p className="font-medium text-bark">No U-Pick experiences yet</p>
          <p className="mt-2">
            Once George publishes nights in Surge for grey-gables, they will
            appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-parchment border border-parchment bg-white">
          {experiences.map((exp) => (
            <li key={exp.id}>
              <Link
                href={`/admin/u-pick/${exp.id}`}
                className="flex flex-col gap-1 px-4 py-4 hover:bg-cream/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-bark">{exp.public_title}</p>
                  <p className="mt-1 text-sm text-stone">
                    {exp.upcoming_occurrence_count} upcoming night
                    {exp.upcoming_occurrence_count === 1 ? "" : "s"}
                    {" · "}
                    Next {formatWhen(exp.next_occurrence_at)}
                    {" · "}
                    {formatMoney(exp.base_price_cents)}
                  </p>
                </div>
                <span className="chip shrink-0 self-start text-xs uppercase tracking-wide sm:self-center">
                  {exp.publication_status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
