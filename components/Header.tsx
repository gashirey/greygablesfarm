"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { InstagramLink } from "@/components/InstagramLink";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import {
  FOUND_BRAND_COLOR,
  isFoundCampaignPath,
} from "@/lib/found/content";

function isNavActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const { nav } = useSiteConfig();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";
  const overlay = isHome || pathname === "/about";
  const showDesktopBrand = !isHome;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!overlay) {
      setScrolled(false);
      return;
    }

    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const ctaItem = nav.find((item) => item.cta || item.href === "/send-flowers");
  const textNav = nav.filter(
    (item) => item !== ctaItem && item.href !== "/send-flowers",
  );
  const desktopNav = textNav;
  const mobileNav = textNav;

  const barColor = overlay ? "bg-white" : "bg-bark";

  const headerClass = overlay
    ? `site-header site-header--overlay fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ease-out ${
        scrolled
          ? "site-header--scrolled border-parchment/50"
          : "border-transparent"
      }`
    : "site-header sticky top-0 z-50 border-b border-parchment bg-cream";

  const brandClass = overlay
    ? scrolled
      ? "site-header__brand site-header__brand--scrolled"
      : "site-header__brand site-header__brand--overlay"
    : "site-header__brand site-header__brand--solid";

  const brandStyle: CSSProperties | undefined = isFoundCampaignPath(pathname)
    ? { color: FOUND_BRAND_COLOR }
    : undefined;

  const navLinkClass = (isActive: boolean, onOverlay: boolean) => {
    const base = "site-header__nav-link";
    if (onOverlay) {
      return `${base} ${scrolled ? "site-header__nav-link--scrolled" : "site-header__nav-link--overlay"} ${
        isActive ? "site-header__nav-link--active" : ""
      }`;
    }
    return `${base} site-header__nav-link--solid ${
      isActive ? "site-header__nav-link--active" : ""
    }`;
  };

  return (
    <header className={headerClass}>
      <div
        className={`mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6 lg:h-16 lg:px-10 xl:px-14 ${
          overlay && !showDesktopBrand ? "justify-end" : "justify-between"
        }`}
      >
        {showDesktopBrand ? (
          <Link
            href="/"
            className={`${brandClass} hidden lg:block`}
            style={brandStyle}
          >
            Grey Gables Flower Farm
          </Link>
        ) : null}
        {!overlay ? (
          <Link
            href="/"
            className={`${brandClass} min-w-0 flex-1 truncate text-[0.95rem] leading-tight lg:hidden`}
            style={brandStyle}
          >
            Grey Gables Flower Farm
          </Link>
        ) : null}

        <nav
          className="hidden items-center gap-8 xl:gap-10 lg:flex"
          aria-label="Main"
        >
          {desktopNav.map((item) => {
            const isActive = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(isActive, overlay)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className={`relative flex shrink-0 items-center gap-2 lg:hidden ${overlay ? "ml-auto" : ""}`}
        >
          <InstagramLink
            className={`inline-flex p-1.5 transition-opacity hover:opacity-80 ${
              overlay && !scrolled ? "text-white" : "text-black"
            }`}
            iconClassName="h-5 w-5"
            label="Follow Grey Gables on Instagram"
          />
          <button
            type="button"
            className="flex flex-col gap-1 p-1.5"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span
              className={`block h-px w-5 transition-transform ${barColor} ${menuOpen ? "translate-y-[4px] rotate-45" : ""}`}
            />
            <span
              className={`block h-px w-5 transition-opacity ${barColor} ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-px w-5 transition-transform ${barColor} ${menuOpen ? "-translate-y-[4px] -rotate-45" : ""}`}
            />
          </button>

          {menuOpen ? (
            <nav
              className="absolute right-0 top-full z-50 min-w-[11rem] border border-parchment bg-cream px-5 py-4"
              aria-label="Mobile"
            >
              <ul className="flex flex-col items-end gap-3">
                {ctaItem ? (
                  <li>
                    <Link
                      href={ctaItem.href}
                      className="btn inline-flex border-salmon-dark bg-salmon-dark text-white"
                      onClick={() => setMenuOpen(false)}
                    >
                      {ctaItem.label}
                    </Link>
                  </li>
                ) : null}
                {mobileNav.map((item) => {
                  const isActive = isNavActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`type-nav block text-right text-lg tracking-wide transition-colors ${
                          isActive
                            ? "font-medium text-salmon-dark"
                            : "hover:opacity-80"
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
        </div>
      </div>
    </header>
  );
}
