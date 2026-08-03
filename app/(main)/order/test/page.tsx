import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { LiveSmokeOrderClient } from "./LiveSmokeOrderClient";
import { listActiveProducts, listAvailability } from "@/lib/order/queries";
import { toLiveSmokeProducts } from "@/lib/order/live-smoke";
import { normalizeOrderScales } from "@/lib/order/scales";
import { getPublicSiteConfig } from "@/lib/site-cms/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order smoke test",
  robots: { index: false, follow: false },
};

export default async function LiveSmokeOrderPage() {
  const [{ copy }, products, availability] = await Promise.all([
    getPublicSiteConfig(),
    listActiveProducts(),
    listAvailability({ days: 21 }),
  ]);

  const smokeProducts = toLiveSmokeProducts(normalizeOrderScales(products));

  return (
    <Section density="compact">
      <LiveSmokeOrderClient
        products={smokeProducts}
        availability={availability}
        copy={copy.orderPage}
      />
    </Section>
  );
}
