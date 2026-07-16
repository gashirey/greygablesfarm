"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { arrangementPasses } from "@/lib/design-lab/arrangement-passes";

export function ArrangementPassNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 border-b border-parchment bg-cream/95"
      aria-label="Arrangement page passes"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/design-lab/arrangements" className="font-medium text-bark">
            Found us?
          </Link>
          <span className="text-parchment">·</span>
          <ul className="flex flex-wrap gap-2">
            {arrangementPasses.map((pass) => {
              const href =
                pass.id === "b"
                  ? "/design-lab/arrangements/b"
                  : `/design-lab/arrangements/${pass.id}`;
              const active =
                pass.id === "b"
                  ? pathname.startsWith("/design-lab/arrangements/b")
                  : pathname === href;
              return (
                <li key={pass.id}>
                  <Link
                    href={href}
                    className={
                      active
                        ? "border border-bark bg-bark px-2.5 py-1 text-white"
                        : "border border-parchment px-2.5 py-1 text-stone hover:border-bark/40 hover:text-bark"
                    }
                  >
                    {pass.id.toUpperCase()} · {pass.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <Link href="/design-lab" className="text-xs text-stone hover:text-bark">
          ← Design lab
        </Link>
      </div>
    </nav>
  );
}
