"use client";

import { InstagramLink } from "@/components/InstagramLink";
import { site } from "@/lib/content";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-parchment bg-site-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-center lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <a
            href={`mailto:${site.email}`}
            className="type-footer-link text-salmon-dark transition-colors hover:text-salmon"
          >
            {site.email}
          </a>
          <span className="hidden text-parchment sm:inline" aria-hidden>
            ·
          </span>
          <InstagramLink
            className="inline-flex text-salmon-dark transition-colors hover:text-salmon"
            iconClassName="h-5 w-5"
            label="Follow Grey Gables on Instagram"
          />
        </div>
        <p className="text-xs text-stone">
          © {year} {site.name}
        </p>
      </div>
    </footer>
  );
}
