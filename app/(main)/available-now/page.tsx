import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { AvailableNowCard } from "@/components/inventory/AvailableNowCard";
import { formatDisplayDate } from "@/lib/inventory/date";
import { getAvailableNow, isInventoryConfigured } from "@/lib/inventory/queries";
import { site } from "@/lib/content";
import { getRootedFarmersHref } from "@/lib/links";
import { pageMetadata } from "@/lib/metadata";
import { assertAvailabilityPageEnabled } from "@/lib/site-cms/availability-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Current availability",
  description: `Weekly harvest list — ${site.name}, ${site.locationRegion}.`,
  path: "/available-now",
});

export default async function AvailableNowPage() {
  await assertAvailabilityPageEnabled();

  const configured = isInventoryConfigured();
  const { date, items } = configured
    ? await getAvailableNow()
    : { date: "", items: [] };
  const rootedHref = getRootedFarmersHref();

  return (
    <Section density="compact" className="pt-20 md:pt-28">
      <header className="mb-10 max-w-xl border-b border-parchment pb-8">
        <h1 className="font-serif text-3xl font-medium leading-tight text-bark md:text-4xl">
          Current availability
        </h1>
        {configured && items.length > 0 && (
          <p className="mt-2 text-sm text-stone">{formatDisplayDate(date)}</p>
        )}
        <p className="mt-2 text-sm text-stone">
          Seasonal harvests. Limited quantities each week.
        </p>
      </header>

      {!configured ? (
        <p className="text-sm text-stone">
          <Link href="/contact?subject=flowers" className="underline">
            Contact the farm
          </Link>{" "}
          for this week&apos;s list.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-stone">
          Nothing listed for this week yet.{" "}
          <Link href="/contact?subject=flowers" className="underline">
            Contact the farm
          </Link>{" "}
          for what&apos;s in season.
        </p>
      ) : (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <AvailableNowCard key={item.availabilityId} item={item} />
          ))}
        </div>
      )}

      <p className="mt-12 border-t border-parchment pt-8 text-sm text-stone">
        <Link
          href={rootedHref}
          className="text-bark underline underline-offset-4"
        >
          Shop on Rooted
        </Link>
        {" · "}
        <Link href="/contact" className="text-bark underline underline-offset-4">
          Contact the farm
        </Link>
      </p>
    </Section>
  );
}
