"use client";

import Image from "next/image";
import Link from "next/link";
import { InstagramLink } from "@/components/InstagramLink";
import { SubscribeBlock } from "@/components/SubscribeBlock";
import { site } from "@/lib/content";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import { googleMapsUrl } from "@/lib/location";
export function Footer() {
  const { nav, copy } = useSiteConfig();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-parchment bg-site-surface">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Image
              src={site.logo}
              alt={site.logoAlt}
              width={160}
              height={40}
              className="h-9 w-auto object-contain object-left"
            />
            <p className="type-footer-brand mt-3">{site.name}</p>
            <p className="type-footer-text mt-2 leading-relaxed">
              {copy.site.description}
            </p>
          </div>

          <div className="lg:col-span-2">
            <ul className="mt-1 flex flex-col gap-2">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="type-footer-link transition-colors hover:text-salmon-dark"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <SubscribeBlock />
          </div>

          <div className="lg:col-span-3">
            <p className="text-xs font-medium tracking-wide text-stone">
              Contact
            </p>
            <a
              href={googleMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="type-footer-text mt-4 block leading-relaxed transition-colors hover:text-salmon-dark"
            >
              {site.location}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="type-footer-link mt-2 inline-block text-salmon-dark transition-colors hover:text-salmon"
            >
              {site.email}
            </a>
            <InstagramLink
              className="mt-3 inline-flex text-salmon-dark transition-colors hover:text-salmon"
              iconClassName="h-6 w-6"
              label="Follow Grey Gables on Instagram"
            />
          </div>
        </div>

        <p className="mt-10 border-t border-parchment pt-6 text-center text-xs text-stone">
          © {year} {site.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
