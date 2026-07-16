"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { arrangementBVariants } from "@/lib/design-lab/arrangement-b-variants";

export function ArrangementBVariantNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 border-b border-parchment bg-cream/95"
      aria-label="Pass B wording variants"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/design-lab/arrangements/b"
            className="font-medium text-bark"
          >
            Pass B · wording
          </Link>
          <span className="text-parchment">·</span>
          <ul className="flex flex-wrap gap-2">
            {arrangementBVariants.map((v) => {
              const href = `/design-lab/arrangements/b/${v.id}`;
              const active = pathname === href;
              return (
                <li key={v.id}>
                  <Link
                    href={href}
                    className={
                      active
                        ? "border border-bark bg-bark px-2.5 py-1 text-white"
                        : "border border-parchment px-2.5 py-1 text-stone hover:border-bark/40 hover:text-bark"
                    }
                  >
                    B{v.id} · {v.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <Link
          href="/design-lab/arrangements"
          className="text-xs text-stone hover:text-bark"
        >
          ← All structures
        </Link>
      </div>
    </nav>
  );
}
