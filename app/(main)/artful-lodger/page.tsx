import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Custom arrangements",
  description:
    "Farm-grown arrangements from Grey Gables — for homes, businesses, and events.",
  path: "/artful-lodger",
});

/** Temporary holding page while campaign looks are explored in design lab. */
export default function ArtfulLodgerHoldingPage() {
  return (
    <section className="mx-auto max-w-xl px-6 py-24 lg:px-10">
      <p className="type-eyebrow">Campaign in progress</p>
      <h1 className="type-page-title mt-3">Custom arrangements</h1>
      <p className="mt-4 text-stone leading-relaxed">
        We&apos;re picking a look for this page. Preview five directions in the
        design lab, then we&apos;ll put the winner here (and keep short links
        like <span className="font-mono text-sm">/al</span> pointed at it).
      </p>
      <Link
        href="/design-lab/arrangements"
        className="btn mt-8 inline-block border-salmon-dark bg-salmon-dark text-white hover:bg-salmon"
      >
        Compare the five passes
      </Link>
      <p className="mt-6 text-sm text-stone">
        Or{" "}
        <Link
          href="/contact?subject=flowers"
          className="text-bark underline underline-offset-4 decoration-parchment hover:text-salmon-dark"
        >
          contact us now
        </Link>{" "}
        for a custom arrangement.
      </p>
    </section>
  );
}
