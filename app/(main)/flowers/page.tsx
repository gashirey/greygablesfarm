import { redirect } from "next/navigation";
import { getPublicSiteConfig } from "@/lib/site-cms/queries";

export default async function FlowersPage() {
  const { copy } = await getPublicSiteConfig();
  redirect(copy.availabilityPage.enabled ? "/available-now" : "/send-flowers");
}
