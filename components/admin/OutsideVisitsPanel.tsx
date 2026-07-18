"use client";

import { useCallback, useEffect, useState } from "react";
import type { SiteVisitEvent } from "@/lib/campaigns/types";
import { formatVisitGeo } from "@/lib/tracking/geo";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatParams(params: Record<string, string> | null): string {
  if (!params || Object.keys(params).length === 0) return "—";
  return Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
}

function referrerPathname(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).pathname;
  } catch {
    return null;
  }
}

function formatReferrer(referrer: string | null): string {
  if (!referrer) return "direct / unknown";
  try {
    const url = new URL(referrer);
    return `${url.host}${url.pathname}${url.search}`;
  } catch {
    return referrer;
  }
}

/** Visited after landing on /found (QR / Artful Lodger funnel). */
function isFromFound(visit: SiteVisitEvent): boolean {
  const refPath = referrerPathname(visit.referrer);
  if (refPath === "/found" || refPath?.startsWith("/found/")) return true;
  return false;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function regionLabel(visit: SiteVisitEvent): string {
  const city = visit.geo_city?.trim();
  const region = visit.geo_region?.trim();
  if (city && region) return `${city}, ${region}`;
  if (city) return city;
  if (region) return region;
  if (visit.geo_country?.trim()) return visit.geo_country.trim();
  return "Unknown location";
}

export function OutsideVisitsPanel() {
  const [visits, setVisits] = useState<SiteVisitEvent[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/visits", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setLoadError(data.error ?? "Could not load visits.");
      setVisits([]);
    } else {
      setLoadError("");
      setVisits(data.visits ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const foundToday = visits.filter(
    (v) => isFromFound(v) && isToday(v.created_at),
  ).length;

  const regionCounts = new Map<string, number>();
  for (const visit of visits) {
    if (!isToday(visit.created_at)) continue;
    const hasGeo = Boolean(
      visit.geo_city?.trim() ||
        visit.geo_region?.trim() ||
        visit.geo_country?.trim(),
    );
    if (!hasGeo && visit.visit_type !== "campaign") continue;
    const key = regionLabel(visit);
    regionCounts.set(key, (regionCounts.get(key) ?? 0) + 1);
  }
  const visitsTodayByRegion = [...regionCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-bark">Outside visits</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone">
          Public traffic only. Visits from the admin UI and while you are signed
          into admin are not counted here. Location is approximate (IP / Vercel)
          and fills in on production for QR scans and page visits.
        </p>
        {foundToday > 0 ? (
          <p className="mt-2 text-sm text-bark">
            {foundToday} visit{foundToday === 1 ? "" : "s"} today came from{" "}
            <span className="font-mono text-xs">/found</span> (scan funnel).
          </p>
        ) : null}
        {visitsTodayByRegion.length > 0 ? (
          <div className="mt-3 max-w-xl border border-parchment bg-white p-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone">
              Today by region
            </p>
            <ul className="mt-2 space-y-1 text-sm text-bark">
              {visitsTodayByRegion.map(([label, count]) => (
                <li key={label} className="flex justify-between gap-4">
                  <span>{label}</span>
                  <span className="tabular-nums text-stone">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {loadError ? (
        <p className="text-sm text-bark">{loadError}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-stone">Loading…</p>
      ) : visits.length === 0 ? (
        <p className="text-sm text-stone">No outside visits logged yet.</p>
      ) : (
        <div className="overflow-x-auto border border-parchment bg-white">
          <table className="w-full min-w-[52rem] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[7.5rem]" />
              <col className="w-[4.5rem]" />
              <col className="w-[6.5rem]" />
              <col className="w-[9rem]" />
              <col />
              <col className="w-[5.5rem]" />
              <col className="w-[5.5rem]" />
              <col className="w-[3.5rem]" />
            </colgroup>
            <thead className="border-b border-parchment text-xs text-stone">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Path</th>
                <th className="px-3 py-2 font-medium">Location</th>
                <th className="px-3 py-2 font-medium">Referrer</th>
                <th className="px-3 py-2 font-medium">Flag</th>
                <th className="px-3 py-2 font-medium">Params</th>
                <th className="px-3 py-2 font-medium">Slug</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment">
              {visits.map((visit) => {
                const fromFound = isFromFound(visit);
                const location = formatVisitGeo(visit);
                return (
                  <tr
                    key={visit.id}
                    className={fromFound ? "bg-cream/80" : undefined}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-stone">
                      {formatWhen(visit.created_at)}
                    </td>
                    <td className="px-3 py-2 text-stone">{visit.visit_type}</td>
                    <td
                      className="truncate px-3 py-2 font-mono text-xs text-bark"
                      title={visit.pathname}
                    >
                      {visit.pathname}
                    </td>
                    <td
                      className="truncate px-3 py-2 text-bark"
                      title={location}
                    >
                      {location}
                    </td>
                    <td
                      className="truncate px-3 py-2 text-stone"
                      title={formatReferrer(visit.referrer)}
                    >
                      {formatReferrer(visit.referrer)}
                    </td>
                    <td className="px-3 py-2">
                      {fromFound ? (
                        <span
                          className="chip inline-block whitespace-nowrap bg-salmon/20 text-bark"
                          title="Came from /found landing (scan funnel)"
                        >
                          from /found
                        </span>
                      ) : (
                        <span className="text-stone">—</span>
                      )}
                    </td>
                    <td
                      className="truncate px-3 py-2 text-stone"
                      title={formatParams(visit.search_params)}
                    >
                      {formatParams(visit.search_params)}
                    </td>
                    <td className="px-3 py-2 text-stone">
                      {visit.slug ? `/${visit.slug}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        className="btn btn-secondary text-sm"
        onClick={() => void load()}
      >
        Refresh
      </button>
    </div>
  );
}
