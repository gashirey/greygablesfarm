"use client";

import { useCallback, useEffect, useState } from "react";
import type { CampaignWithStats, SiteVisitEvent } from "@/lib/campaigns/types";

type FormState = {
  slug: string;
  name: string;
  destination_url: string;
  notes: string;
};

const emptyForm: FormState = {
  slug: "",
  name: "",
  destination_url: "/",
  notes: "",
};

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

export function CampaignsManager() {
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([]);
  const [visits, setVisits] = useState<SiteVisitEvent[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/campaigns", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      setLoadError(data.error ?? "Could not load campaigns.");
      setCampaigns([]);
      setVisits([]);
    } else {
      setLoadError("");
      setCampaigns(data.campaigns ?? []);
      setVisits(data.visits ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error ?? "Could not create campaign.");
      return;
    }

    setForm(emptyForm);
    setMessage(`Created /${data.campaign.slug}.`);
    await load();
  }

  async function updateCampaign(
    id: string,
    patch: Record<string, unknown>,
  ) {
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Could not update campaign.");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-2xl text-bark">Campaigns &amp; QR links</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone">
          Short links like{" "}
          <code className="text-bark">greygablesfarm.com/bc</code> log each scan
          and redirect to a destination. Unknown slugs redirect to the homepage.
          Visits with query strings or paths beyond the homepage are logged too.
        </p>
      </div>

      {loadError ? (
        <div className="border border-parchment bg-white p-4 text-sm text-stone">
          <p className="font-medium text-bark">Campaigns not available</p>
          <p className="mt-2">{loadError}</p>
          <p className="mt-2 text-xs">
            Run{" "}
            <code className="text-bark">017_campaigns_and_visit_tracking.sql</code>{" "}
            in Supabase, then refresh.
          </p>
        </div>
      ) : null}

      {message ? <p className="text-sm text-bark">{message}</p> : null}

      <form
        onSubmit={createCampaign}
        className="border border-parchment bg-white p-5"
      >
        <h2 className="font-serif text-lg text-bark">New campaign</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Slug
            <input
              className="input mt-1"
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="bc"
              required
            />
          </label>
          <label className="block text-sm">
            Label
            <input
              className="input mt-1"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Business card"
              required
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            Destination path
            <input
              className="input mt-1"
              value={form.destination_url}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  destination_url: e.target.value,
                }))
              }
              placeholder="/contact"
              required
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            Notes
            <input
              className="input mt-1"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="QR on back of business card"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="btn mt-4 border-bark text-bark"
        >
          {saving ? "Saving…" : "Add campaign"}
        </button>
      </form>

      <section>
        <h2 className="font-serif text-lg text-bark">Campaigns</h2>
        {loading ? (
          <p className="mt-3 text-sm text-stone">Loading…</p>
        ) : campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-stone">No campaigns yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-parchment border border-parchment bg-white">
            {campaigns.map((campaign) => (
              <li key={campaign.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-bark">
                      /{campaign.slug}{" "}
                      <span className="font-normal text-stone">
                        · {campaign.name}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-stone">
                      → {campaign.destination_url} · {campaign.visit_count} scan
                      {campaign.visit_count === 1 ? "" : "s"}
                    </p>
                    {campaign.notes ? (
                      <p className="mt-1 text-xs text-stone">{campaign.notes}</p>
                    ) : null}
                  </div>
                  <label className="flex items-center gap-2 text-sm text-stone">
                    <input
                      type="checkbox"
                      checked={campaign.is_active}
                      onChange={(e) =>
                        void updateCampaign(campaign.id, {
                          is_active: e.target.checked,
                        })
                      }
                    />
                    Active
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-stone">
                    Destination
                    <input
                      className="input mt-1 text-sm"
                      defaultValue={campaign.destination_url}
                      key={`dest-${campaign.id}-${campaign.destination_url}`}
                      onBlur={(e) => {
                        if (e.target.value !== campaign.destination_url) {
                          void updateCampaign(campaign.id, {
                            destination_url: e.target.value,
                          });
                        }
                      }}
                    />
                  </label>
                  <label className="block text-xs text-stone">
                    Label
                    <input
                      className="input mt-1 text-sm"
                      defaultValue={campaign.name}
                      key={`name-${campaign.id}-${campaign.name}`}
                      onBlur={(e) => {
                        if (e.target.value !== campaign.name) {
                          void updateCampaign(campaign.id, {
                            name: e.target.value,
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-lg text-bark">Recent visits</h2>
        <p className="mt-1 text-sm text-stone">
          Campaign scans plus pages and query strings beyond the homepage.
        </p>
        {visits.length === 0 ? (
          <p className="mt-3 text-sm text-stone">No visits logged yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto border border-parchment bg-white">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-parchment text-xs text-stone">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Path</th>
                  <th className="px-3 py-2 font-medium">Params</th>
                  <th className="px-3 py-2 font-medium">Slug</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment">
                {visits.map((visit) => (
                  <tr key={visit.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-stone">
                      {formatWhen(visit.created_at)}
                    </td>
                    <td className="px-3 py-2 text-stone">{visit.visit_type}</td>
                    <td className="px-3 py-2 text-bark">{visit.pathname}</td>
                    <td className="px-3 py-2 text-stone">
                      {formatParams(visit.search_params)}
                    </td>
                    <td className="px-3 py-2 text-stone">
                      {visit.slug ? `/${visit.slug}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
