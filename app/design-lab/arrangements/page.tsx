import type { Metadata } from "next";
import Link from "next/link";
import { ArrangementPassNav } from "@/components/design-lab/ArrangementPassNav";
import { DesignLabNav } from "@/components/design-lab/DesignLabNav";

export const metadata: Metadata = {
  title: "Found us? — Campaign page exploration",
  description: "Phone-first and structure explorations for arrangement campaigns.",
  robots: { index: false, follow: false },
};

export default function ArrangementPassesIndexPage() {
  return (
    <div className="min-h-screen bg-[#eeeae4]">
      <DesignLabNav />
      <ArrangementPassNav />

      <header className="border-b border-parchment bg-cream px-6 py-14 md:px-12 md:py-16">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone">
          Internal · Campaign page exploration
        </p>
        <h1 className="mt-3 max-w-2xl font-serif text-4xl text-bark md:text-5xl">
          You saw our arrangements somewhere?
        </h1>
        <p className="mt-4 max-w-xl text-stone leading-relaxed">
          Most visitors arrive from a QR code on a phone. Start with the
          phone-first set — then dig into older structure experiments if you
          want.
        </p>
        <Link
          href="/found"
          className="btn mt-8 inline-block border-salmon-dark bg-salmon-dark text-white hover:bg-salmon"
        >
          Live QR landing →
        </Link>
        <p className="mt-4 text-sm text-stone">
          Earlier split layouts:{" "}
          <Link
            href="/design-lab/arrangements/b"
            className="text-bark underline underline-offset-4 decoration-parchment"
          >
            Pass B wording
          </Link>
        </p>
      </header>
    </div>
  );
}
