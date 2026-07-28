"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { mergeSiteCopy } from "@/lib/site-cms/merge";
import type {
  HeroCta,
  SiteContentOverrides,
  SiteSettingsRow,
} from "@/lib/site-cms/types";

const MAX_HERO_CTAS = 4;

export function SiteContentPanel() {
  const [draft, setDraft] = useState({
    tagline: "",
    description: "",
    heroTitle: "",
    heroSubtitle: "",
    heroCtas: [] as HeroCta[],
    aboutParagraphs: "",
    availabilityTitle: "",
    availabilityDescription: "",
    ctaNote: "",
    ctaRooted: "",
    ctaContact: "",
    announcementEnabled: false,
    announcementMessage: "",
    availabilityPageEnabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [setupError, setSetupError] = useState("");

  const syncDraft = useCallback((content: SiteContentOverrides) => {
    const merged = mergeSiteCopy(content);
    setDraft({
      tagline: merged.site.tagline,
      description: merged.site.description,
      heroTitle: merged.heroHome.title,
      heroSubtitle: merged.heroHome.subtitle,
      heroCtas: merged.heroHome.ctas.map((c) => ({ ...c })),
      aboutParagraphs: merged.homeAbout.join("\n\n"),
      availabilityTitle: merged.homeSections.availability.title,
      availabilityDescription: merged.homeSections.availability.description,
      ctaNote: merged.homeCta.note,
      ctaRooted: merged.homeCta.rooted,
      ctaContact: merged.homeCta.contact,
      announcementEnabled: merged.announcement.enabled,
      announcementMessage: merged.announcement.message,
      availabilityPageEnabled: merged.availabilityPage.enabled,
    });
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/site-cms");
    const data = await res.json();
    if (!res.ok) {
      setSetupError(data.error ?? "Could not load site content.");
      return;
    }
    const settings = data.settings as SiteSettingsRow;
    syncDraft(settings.content_overrides ?? {});
    setSetupError("");
  }, [syncDraft]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateCta(index: number, patch: Partial<HeroCta>) {
    setDraft((prev) => ({
      ...prev,
      heroCtas: prev.heroCtas.map((cta, i) =>
        i === index ? { ...cta, ...patch } : cta,
      ),
    }));
  }

  function addCta() {
    setDraft((prev) => {
      if (prev.heroCtas.length >= MAX_HERO_CTAS) return prev;
      return {
        ...prev,
        heroCtas: [...prev.heroCtas, { label: "", href: "" }],
      };
    });
  }

  function removeCta(index: number) {
    setDraft((prev) => ({
      ...prev,
      heroCtas: prev.heroCtas.filter((_, i) => i !== index),
    }));
  }

  function moveCta(index: number, direction: -1 | 1) {
    setDraft((prev) => {
      const next = index + direction;
      if (next < 0 || next >= prev.heroCtas.length) return prev;
      const heroCtas = [...prev.heroCtas];
      const [item] = heroCtas.splice(index, 1);
      heroCtas.splice(next, 0, item);
      return { ...prev, heroCtas };
    });
  }

  async function save() {
    setSaving(true);
    setNotice(null);

    const ctas = draft.heroCtas
      .map((c) => ({
        label: c.label.trim(),
        href: c.href.trim(),
      }))
      .filter((c) => c.label && c.href);

    const content_overrides: SiteContentOverrides = {
      site: {
        tagline: draft.tagline.trim() || undefined,
        description: draft.description.trim() || undefined,
      },
      heroHome: {
        title: draft.heroTitle.trim() || undefined,
        subtitle: draft.heroSubtitle.trim() || undefined,
        ctas,
      },
      homeAbout: draft.aboutParagraphs.trim()
        ? draft.aboutParagraphs
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean)
        : undefined,
      homeSections: {
        availability: {
          title: draft.availabilityTitle.trim() || undefined,
          description: draft.availabilityDescription.trim() || undefined,
        },
      },
      homeCta: {
        note: draft.ctaNote.trim() || undefined,
        rooted: draft.ctaRooted.trim() || undefined,
        contact: draft.ctaContact.trim() || undefined,
      },
      announcement: {
        enabled: draft.announcementEnabled,
        message: draft.announcementMessage.trim() || undefined,
      },
      availabilityPage: {
        enabled: draft.availabilityPageEnabled,
      },
    };

    const res = await fetch("/api/admin/site-cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_overrides }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setNotice({ type: "error", message: data.error ?? "Save failed." });
      return;
    }

    syncDraft((data.settings as SiteSettingsRow).content_overrides ?? {});
    setNotice({ type: "success", message: "Copy saved." });
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

      <section className="border border-parchment bg-white p-5">
        <h2 className="font-serif text-lg text-bark">See what&apos;s growing</h2>
        <p className="mt-2 max-w-xl text-sm text-stone">
          Controls the hero button that links to{" "}
          <span className="font-mono text-xs">/available-now</span>, the
          navigation link, and that page.
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.availabilityPageEnabled}
            onChange={(e) =>
              setDraft({ ...draft, availabilityPageEnabled: e.target.checked })
            }
          />
          Show &ldquo;See what&apos;s growing&rdquo; page and links
        </label>
      </section>

      <section className="border border-parchment bg-white p-5">
        <h2 className="font-serif text-lg text-bark">Announcement bar</h2>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.announcementEnabled}
            onChange={(e) =>
              setDraft({ ...draft, announcementEnabled: e.target.checked })
            }
          />
          Show announcement on every page
        </label>
        <label className="mt-4 block text-sm">
          Message
          <input
            type="text"
            className="input mt-1 w-full max-w-xl"
            value={draft.announcementMessage}
            onChange={(e) =>
              setDraft({ ...draft, announcementMessage: e.target.value })
            }
          />
        </label>
      </section>

      <section className="border border-parchment bg-white p-5">
        <h2 className="font-serif text-lg text-bark">Site tagline</h2>
        <div className="mt-4 grid max-w-xl gap-4">
          <label className="text-sm">
            Tagline
            <input
              className="input mt-1 w-full"
              value={draft.tagline}
              onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Short description (footer)
            <textarea
              className="input mt-1 w-full"
              rows={2}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </label>
        </div>
      </section>

      <section className="border border-parchment bg-white p-5">
        <h2 className="font-serif text-lg text-bark">Homepage hero text</h2>
        <div className="mt-4 grid max-w-xl gap-4">
          <label className="text-sm">
            Headline
            <input
              className="input mt-1 w-full"
              value={draft.heroTitle}
              onChange={(e) =>
                setDraft({ ...draft, heroTitle: e.target.value })
              }
            />
          </label>
          <label className="text-sm">
            Subtitle
            <input
              className="input mt-1 w-full"
              value={draft.heroSubtitle}
              onChange={(e) =>
                setDraft({ ...draft, heroSubtitle: e.target.value })
              }
            />
          </label>
        </div>

        <div className="mt-6 max-w-2xl">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-serif text-base text-bark">Hero buttons</h3>
            <p className="text-xs text-stone">
              First button is primary; up to {MAX_HERO_CTAS}.
            </p>
          </div>
          <ul className="mt-3 space-y-3">
            {draft.heroCtas.map((cta, index) => (
              <li
                key={index}
                className="border border-parchment bg-cream/40 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide text-stone">
                    {index === 0 ? "Primary" : `Button ${index + 1}`}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      className="text-stone underline-offset-2 hover:text-bark hover:underline disabled:opacity-40"
                      disabled={index === 0}
                      onClick={() => moveCta(index, -1)}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      className="text-stone underline-offset-2 hover:text-bark hover:underline disabled:opacity-40"
                      disabled={index === draft.heroCtas.length - 1}
                      onClick={() => moveCta(index, 1)}
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      className="text-stone underline-offset-2 hover:text-bark hover:underline"
                      onClick={() => removeCta(index)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    Label
                    <input
                      className="input mt-1 w-full"
                      value={cta.label}
                      onChange={(e) =>
                        updateCta(index, { label: e.target.value })
                      }
                      placeholder="Order"
                    />
                  </label>
                  <label className="text-sm">
                    Link
                    <input
                      className="input mt-1 w-full font-mono text-xs"
                      value={cta.href}
                      onChange={(e) =>
                        updateCta(index, { href: e.target.value })
                      }
                      placeholder="/order"
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn mt-3 border-parchment bg-white text-sm text-bark disabled:opacity-40"
            disabled={draft.heroCtas.length >= MAX_HERO_CTAS}
            onClick={addCta}
          >
            Add button
          </button>
        </div>
      </section>

      <section className="border border-parchment bg-white p-5">
        <h2 className="font-serif text-lg text-bark">Homepage & about copy</h2>
        <label className="mt-4 block text-sm">
          About paragraphs (blank line between paragraphs)
          <textarea
            className="input mt-1 w-full max-w-2xl"
            rows={6}
            value={draft.aboutParagraphs}
            onChange={(e) =>
              setDraft({ ...draft, aboutParagraphs: e.target.value })
            }
          />
        </label>
        <div className="mt-4 grid max-w-xl gap-4">
          <label className="text-sm">
            Availability section title
            <input
              className="input mt-1 w-full"
              value={draft.availabilityTitle}
              onChange={(e) =>
                setDraft({ ...draft, availabilityTitle: e.target.value })
              }
            />
          </label>
          <label className="text-sm">
            Availability section description
            <input
              className="input mt-1 w-full"
              value={draft.availabilityDescription}
              onChange={(e) =>
                setDraft({ ...draft, availabilityDescription: e.target.value })
              }
            />
          </label>
        </div>
      </section>

      <section className="border border-parchment bg-white p-5">
        <h2 className="font-serif text-lg text-bark">Bottom CTA strip</h2>
        <div className="mt-4 grid max-w-xl gap-4">
          <label className="text-sm">
            Note
            <input
              className="input mt-1 w-full"
              value={draft.ctaNote}
              onChange={(e) => setDraft({ ...draft, ctaNote: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Rooted link label
            <input
              className="input mt-1 w-full"
              value={draft.ctaRooted}
              onChange={(e) =>
                setDraft({ ...draft, ctaRooted: e.target.value })
              }
            />
          </label>
          <label className="text-sm">
            Contact link label
            <input
              className="input mt-1 w-full"
              value={draft.ctaContact}
              onChange={(e) =>
                setDraft({ ...draft, ctaContact: e.target.value })
              }
            />
          </label>
        </div>
      </section>

      <button
        type="button"
        className="btn btn-primary text-sm"
        disabled={saving}
        onClick={() => void save()}
      >
        {saving ? "Saving…" : "Save all copy"}
      </button>
      <p className="text-xs text-stone">
        Values are stored as overrides. Code defaults in lib/content.ts still
        apply when a field is cleared.
      </p>
    </div>
  );
}
