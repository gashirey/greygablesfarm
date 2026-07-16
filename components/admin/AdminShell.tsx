"use client";

import Link from "next/link";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/availability", label: "Today" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/social", label: "Social" },
  { href: "/admin/site", label: "Site editor" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/available-now", label: "View site" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen bg-cream text-bark">
      <header className="border-b border-parchment bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm font-medium">Farm manage</p>
          <nav className="flex flex-wrap gap-3 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-stone underline-offset-2 hover:text-bark hover:underline"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={signOut}
              className="text-stone hover:text-bark"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
