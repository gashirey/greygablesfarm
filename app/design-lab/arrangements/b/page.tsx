import type { Metadata } from "next";
import Link from "next/link";
import { ArrangementBVariantNav } from "@/components/design-lab/ArrangementBVariantNav";
import { arrangementBVariants } from "@/lib/design-lab/arrangement-b-variants";

export const metadata: Metadata = {
  title: "Pass B — wording & image variants",
  description:
    "Five copy and image variations on the split-editorial campaign layout.",
  robots: { index: false, follow: false },
};

export default function ArrangementBIndexPage() {
  return (
    <div className="min-h-screen bg-[#eeeae4]">
      <ArrangementBVariantNav />

      <header className="border-b border-parchment bg-cream px-6 py-14 md:px-12 md:py-16">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone">
          Structure locked · Pass B (split editorial)
        </p>
        <h1 className="mt-3 max-w-2xl font-serif text-4xl text-bark md:text-5xl">
          Five wording &amp; image passes
        </h1>
        <p className="mt-4 max-w-xl text-stone leading-relaxed">
          All five use B1&apos;s structure (photo left). Shared threads: Make it
          your own / real flowers from a local farm, chemical-free at home, and
          intimate gatherings.
        </p>
      </header>

      <ul className="mx-auto grid max-w-6xl gap-4 px-6 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:px-10">
        {arrangementBVariants.map((v) => (
          <li key={v.id}>
            <Link
              href={`/design-lab/arrangements/b/${v.id}`}
              className="block h-full border border-parchment bg-cream p-6 hover:border-bark/35"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-stone">
                B{v.id}
              </p>
              <h2 className="mt-2 font-serif text-2xl text-bark">{v.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone">{v.pitch}</p>
              <p className="mt-4 text-xs text-stone">
                Photo: May 19 shoot · 1X3A1176 · {v.imageSide}
              </p>
              <span className="mt-6 inline-block text-sm text-bark underline underline-offset-4 decoration-parchment">
                Open →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
