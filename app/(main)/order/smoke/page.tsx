import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/Section";
import { SmokeCheckoutClient } from "./SmokeCheckoutClient";

export const metadata: Metadata = {
  title: "Stripe smoke test",
  robots: { index: false, follow: false },
};

export default function SmokeCheckoutPage() {
  return (
    <Section density="compact">
      <Suspense fallback={<p className="text-sm text-stone">Loading…</p>}>
        <SmokeCheckoutClient />
      </Suspense>
    </Section>
  );
}
