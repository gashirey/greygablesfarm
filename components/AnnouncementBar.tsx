"use client";

import Link from "next/link";
import { useSiteConfig } from "@/components/SiteConfigProvider";

export function AnnouncementBar() {
  const { copy } = useSiteConfig();
  const { announcement, availabilityPage } = copy;

  if (!announcement.enabled) return null;

  return (
    <div className="type-announcement border-b border-parchment bg-site-muted-band px-4 py-2 text-center">
      <p>
        {announcement.message}
        {availabilityPage.enabled ? (
          <>
            {" "}
            <Link href="/available-now" className="underline">
              View list
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
