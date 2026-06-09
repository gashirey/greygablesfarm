"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";

/** Homepage skips the announcement bar; all routes keep the header. */
export function MainChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      {!isHome ? <AnnouncementBar /> : null}
      <Header />
      {children}
    </>
  );
}
