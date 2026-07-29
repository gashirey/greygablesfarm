"use client";

import { useState } from "react";
import { OrderCopyPanel } from "@/components/admin/OrderCopyPanel";
import { SiteAppearancePanel } from "@/components/admin/SiteAppearancePanel";
import { SiteContentPanel } from "@/components/admin/SiteContentPanel";
import { SiteMediaEditor } from "@/components/admin/SiteMediaEditor";
import { SiteNavPanel } from "@/components/admin/SiteNavPanel";
import { SiteTypographyPanel } from "@/components/admin/SiteTypographyPanel";

const TABS = [
  { id: "images", label: "Images & framing" },
  { id: "appearance", label: "Colors & layout" },
  { id: "typography", label: "Typography" },
  { id: "content", label: "Wording" },
  { id: "order", label: "Order flowers" },
  { id: "nav", label: "Menu" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SiteEditor() {
  const [tab, setTab] = useState<TabId>("images");

  return (
    <div>
      <nav
        className="mb-8 flex flex-wrap gap-2 border-b border-parchment"
        aria-label="Site editor sections"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-3 py-2 text-sm transition-colors ${
              tab === t.id
                ? "border-bark font-medium text-bark"
                : "border-transparent text-stone hover:text-bark"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "images" && <SiteMediaEditor />}
      {tab === "appearance" && <SiteAppearancePanel />}
      {tab === "typography" && <SiteTypographyPanel />}
      {tab === "content" && <SiteContentPanel />}
      {tab === "order" && <OrderCopyPanel />}
      {tab === "nav" && <SiteNavPanel />}
    </div>
  );
}
