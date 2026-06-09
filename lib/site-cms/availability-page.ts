import { notFound } from "next/navigation";
import { getPublicSiteConfig } from "@/lib/site-cms/queries";

export async function assertAvailabilityPageEnabled(): Promise<void> {
  const { copy } = await getPublicSiteConfig();
  if (!copy.availabilityPage.enabled) {
    notFound();
  }
}
