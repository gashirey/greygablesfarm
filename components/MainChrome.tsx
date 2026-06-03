"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";

/** Homepage is hero + footer only; other routes keep header and announcement. */
export function MainChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      {!isHome ? <AnnouncementBar /> : null}
      {!isHome ? <Header /> : null}
      {children}
    </>
  );
}
