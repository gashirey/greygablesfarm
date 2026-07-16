"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { designDirections } from "@/lib/design-lab/directions";

export function DesignLabNav() {
  const pathname = usePathname();
  const onOverview = pathname === "/design-lab";

  return (
    <nav
      className="sticky top-0 z-40 border-b border-parchment bg-cream"
      aria-label="Design lab"
    >
      <div className="mx-auto max-w-6xl px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/design-lab" className="font-serif text-lg text-bark hover:text-salmon-dark">
              Design Lab
            </Link>
            <p className="text-xs text-stone">Grey Gables Farm · Louisa, VA</p>
          </div>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone">
            <li>
              <Link
                href="/design-lab"
                className={onOverview ? "font-medium text-salmon-dark" : "hover:text-bark"}
              >
                Overview
              </Link>
            </li>
            {designDirections.map((d) => {
              const fullHref = `/design-lab/${d.id}`;
              const onFull = pathname === fullHref;
              return (
                <li key={d.id} className="flex items-center gap-2">
                  <Link
                    href={`/design-lab#direction-${d.id}`}
                    className="text-xs hover:text-bark"
                  >
                    {d.id.toUpperCase()} specs
                  </Link>
                  <span className="text-parchment">|</span>
                  <Link
                    href={fullHref}
                    className={onFull ? "font-medium text-salmon-dark" : "hover:text-bark"}
                  >
                    {d.id.toUpperCase()} home
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/design-lab/hero"
                className={pathname === "/design-lab/hero" ? "font-medium text-salmon-dark" : "hover:text-bark"}
              >
                Hero frames
              </Link>
            </li>
            <li>
              <Link
                href="/found/1"
                className={
                  pathname.startsWith("/found") ||
                  pathname.startsWith("/design-lab/arrangements")
                    ? "font-medium text-salmon-dark"
                    : "hover:text-bark"
                }
              >
                Found us?
              </Link>
            </li>
            <li>
              <Link
                href="/design-lab/samples"
                className={pathname.startsWith("/design-lab/samples") ? "font-medium text-salmon-dark" : "hover:text-bark"}
              >
                Snapshots
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-bark">
                ← Site
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
