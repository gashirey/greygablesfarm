"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SiteVisitEvent } from "@/lib/campaigns/types";
import {
  deviceLabel,
  formatWhenFriendly,
  locationLabel,
  pageLabel,
  sourceLabel,
} from "@/lib/tracking/present";

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Stable key for unique-visitor estimates (cookie id, else UA+geo fallback). */
function visitorKey(visit: SiteVisitEvent): string {
  const id = visit.visitor_id?.trim();
  if (id) return `v:${id}`;
  const ua = (visit.user_agent ?? "").slice(0, 120);
  const geo = [
    visit.geo_city ?? "",
    visit.geo_region ?? "",
    visit.geo_country ?? "",
  ].join("|");
  return `f:${ua}|${geo}`;
}

function countByKey(
  visits: SiteVisitEvent[],
  keyFn: (v: SiteVisitEvent) => string,
): Array<[string, number]> {
  const map = new Map<string, Set<string>>();
  for (const visit of visits) {
    const key = keyFn(visit);
    const set = map.get(key) ?? new Set<string>();
    set.add(visitorKey(visit));
    map.set(key, set);
  }
  return [...map.entries()]
    .map(([label, set]): [string, number] => [label, set.size])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

const POLL_MS = 12_000;

export function OutsideVisitsPanel() {
  const [visits, setVisits] = useState<SiteVisitEvent[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showTechnical, setShowTechnical] = useState(false);

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    const quiet = opts?.quiet ?? false;
    if (!quiet) setLoading(true);
    try {
      const res = await fetch("/api/admin/visits", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "Could not load traffic.");
        if (!quiet) setVisits([]);
      } else {
        setLoadError("");
        setVisits(data.visits ?? []);
      }
    } catch {
      if (!quiet) {
        setLoadError("Could not load traffic.");
        setVisits([]);
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void load({ quiet: true });
      }
    }, POLL_MS);

    const onVisibleOrFocus = () => {
      if (document.visibilityState === "visible") {
        void load({ quiet: true });
      }
    };
    document.addEventListener("visibilitychange", onVisibleOrFocus);
    window.addEventListener("focus", onVisibleOrFocus);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibleOrFocus);
      window.removeEventListener("focus", onVisibleOrFocus);
    };
  }, [load]);

  const todayVisits = useMemo(
    () => visits.filter((v) => isToday(v.created_at)),
    [visits],
  );

  const uniqueToday = useMemo(() => {
    return new Set(todayVisits.map(visitorKey)).size;
  }, [todayVisits]);

  const pageviewsToday = todayVisits.length;

  const qrToday = useMemo(() => {
    const keys = new Set<string>();
    for (const visit of todayVisits) {
      if (visit.visit_type === "campaign" || visit.slug) {
        keys.add(visitorKey(visit));
      }
    }
    return keys.size;
  }, [todayVisits]);

  const sourcesToday = useMemo(
    () => countByKey(todayVisits, sourceLabel).slice(0, 8),
    [todayVisits],
  );

  const pagesToday = useMemo(
    () => countByKey(todayVisits, (v) => pageLabel(v.pathname)).slice(0, 8),
    [todayVisits],
  );

  const regionsToday = useMemo(() => {
    const withGeo = todayVisits.filter(
      (v) =>
        v.geo_city?.trim() ||
        v.geo_region?.trim() ||
        v.geo_country?.trim() ||
        v.visit_type === "campaign",
    );
    return countByKey(withGeo, locationLabel).slice(0, 8);
  }, [todayVisits]);

  const devicesToday = useMemo(
    () => countByKey(todayVisits, deviceLabel),
    [todayVisits],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-bark">Site traffic</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone">
          A simple picture of who is opening your public website. We leave out
          your admin clicks, automated bots, and local testing. Location is a
          rough guess from the visitor’s network — VPNs can show big cities far
          from home.
        </p>
      </div>

      {loadError ? <p className="text-sm text-bark">{loadError}</p> : null}

      {loading ? (
        <p className="text-sm text-stone">Loading…</p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="People today"
              value={uniqueToday}
              hint="Distinct browsers we recognize"
            />
            <StatCard
              label="Pages opened today"
              value={pageviewsToday}
              hint="Every page load counts"
            />
            <StatCard
              label="QR / short-link today"
              value={qrToday}
              hint="Scanned a printed code or short URL"
            />
          </section>

          {pageviewsToday === 0 ? (
            <p className="text-sm text-stone">
              No public visits logged yet today. When someone opens the live site
              or scans a QR code, it will show up here automatically.
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <SummaryList
                title="Where people came from"
                empty="No source info yet."
                rows={sourcesToday}
                footnote="This is the previous site or app — or a QR scan — before they landed on your page."
              />
              <SummaryList
                title="Pages they opened"
                empty="No pages yet."
                rows={pagesToday}
              />
              <SummaryList
                title="Where they seem to be"
                empty="Location unknown for today’s visits."
                rows={regionsToday}
                footnote="Approximate only. Helpful for “are people nearby?” not exact addresses."
              />
              <SummaryList
                title="Phone vs computer"
                empty="No device info yet."
                rows={devicesToday}
              />
            </div>
          )}

          <section>
            <h2 className="font-serif text-lg text-bark">Recent activity</h2>
            <p className="mt-1 text-sm text-stone">
              Newest first. Updates every few seconds while this page is open.
            </p>

            {visits.length === 0 ? (
              <p className="mt-3 text-sm text-stone">No visits logged yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-parchment border border-parchment bg-white">
                {visits.slice(0, 40).map((visit) => (
                  <li key={visit.id} className="px-4 py-3">
                    <p className="text-sm text-bark">
                      <span className="tabular-nums text-stone">
                        {formatWhenFriendly(visit.created_at)}
                      </span>
                      <span className="text-stone"> · </span>
                      <span className="font-medium">
                        {pageLabel(visit.pathname)}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-stone">
                      {sourceLabel(visit)}
                      <span className="text-stone/80"> · </span>
                      {locationLabel(visit)}
                      <span className="text-stone/80"> · </span>
                      {deviceLabel(visit)}
                      {visit.browser || visit.os ? (
                        <>
                          <span className="text-stone/80"> · </span>
                          {[visit.browser, visit.os].filter(Boolean).join(" on ")}
                        </>
                      ) : null}
                    </p>
                    {visit.attributed_campaign_slug ? (
                      <p className="mt-1 text-xs text-stone">
                        Earlier QR / short link: /{visit.attributed_campaign_slug}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-secondary text-sm"
              onClick={() => void load()}
            >
              Update now
            </button>
            <button
              type="button"
              className="text-sm text-stone underline underline-offset-2"
              onClick={() => setShowTechnical((v) => !v)}
            >
              {showTechnical ? "Hide technical details" : "Show technical details"}
            </button>
          </div>

          {showTechnical ? (
            <section className="border border-parchment bg-white p-4">
              <h2 className="text-sm font-medium text-bark">Technical details</h2>
              <p className="mt-1 text-xs text-stone">
                Stored for support and future reports — most owners can ignore
                this.
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[48rem] text-left text-xs">
                  <thead className="border-b border-parchment text-stone">
                    <tr>
                      <th className="px-2 py-1.5 font-medium">When</th>
                      <th className="px-2 py-1.5 font-medium">Path</th>
                      <th className="px-2 py-1.5 font-medium">Type</th>
                      <th className="px-2 py-1.5 font-medium">Referrer URL</th>
                      <th className="px-2 py-1.5 font-medium">UTM</th>
                      <th className="px-2 py-1.5 font-medium">Visitor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-parchment">
                    {visits.slice(0, 40).map((visit) => (
                      <tr key={`tech-${visit.id}`}>
                        <td className="px-2 py-1.5 whitespace-nowrap text-stone">
                          {formatWhenFriendly(visit.created_at)}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-bark">
                          {visit.pathname}
                        </td>
                        <td className="px-2 py-1.5 text-stone">
                          {visit.visit_type}
                        </td>
                        <td
                          className="max-w-[12rem] truncate px-2 py-1.5 text-stone"
                          title={visit.referrer ?? undefined}
                        >
                          {visit.referrer ?? "—"}
                        </td>
                        <td className="px-2 py-1.5 text-stone">
                          {[
                            visit.utm_source,
                            visit.utm_medium,
                            visit.utm_campaign,
                          ]
                            .filter(Boolean)
                            .join(" / ") || "—"}
                        </td>
                        <td
                          className="max-w-[8rem] truncate px-2 py-1.5 font-mono text-stone"
                          title={visit.visitor_id ?? undefined}
                        >
                          {visit.visitor_id
                            ? `${visit.visitor_id.slice(0, 8)}…`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="border border-parchment bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone">
        {label}
      </p>
      <p className="mt-1 font-serif text-3xl tabular-nums text-bark">{value}</p>
      <p className="mt-1 text-xs text-stone">{hint}</p>
    </div>
  );
}

function SummaryList({
  title,
  rows,
  empty,
  footnote,
}: {
  title: string;
  rows: [string, number][];
  empty: string;
  footnote?: string;
}) {
  return (
    <div className="border border-parchment bg-white p-4">
      <h2 className="text-sm font-medium text-bark">{title}</h2>
      {footnote ? <p className="mt-1 text-xs text-stone">{footnote}</p> : null}
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-stone">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm text-bark">
          {rows.map(([label, count]) => (
            <li key={label} className="flex justify-between gap-4">
              <span>{label}</span>
              <span className="tabular-nums text-stone">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
