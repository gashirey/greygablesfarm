import type { Metadata } from "next";
import { FoundLanding } from "@/components/found/FoundLanding";
import { FOUND_META, FOUND_PAGE_PATH } from "@/lib/found/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: FOUND_META.title,
  description: FOUND_META.description,
  path: FOUND_PAGE_PATH,
});

export default function FoundPage() {
  return <FoundLanding />;
}
