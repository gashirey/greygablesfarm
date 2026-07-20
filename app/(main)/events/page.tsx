import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/Section";
import { eventHasRequiredImages } from "@/lib/events/format";
import { listFarmEvents } from "@/lib/events/queries";
import { site } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Events",
  description: `Farm events at ${site.name} — you picks, photo sessions, and seasonal gatherings.`,
  path: "/events",
});

export default async function EventsIndexPage() {
  const events = (await listFarmEvents()).filter(eventHasRequiredImages);

  return (
    <>
      <header className="border-b border-parchment bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8 lg:py-16">
          <p className="type-eyebrow">On the farm</p>
          <h1 className="type-page-title mt-2">Events</h1>
          <p className="type-page-body mt-3 max-w-xl text-stone">
            Seasonal gatherings at Grey Gables — pick your own blooms, photograph
            among the flowers, and more as the season unfolds.
          </p>
        </div>
      </header>

      <Section density="compact">
        {events.length === 0 ? (
          <p className="max-w-xl text-sm text-stone">
            No public events posted yet.{" "}
            <Link
              href="/contact?subject=event"
              className="text-bark underline underline-offset-4"
            >
              Contact the farm
            </Link>{" "}
            to ask what&apos;s coming up.
          </p>
        ) : (
          <ul className="grid gap-10 md:grid-cols-2">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.slug}`}
                  className="group block border border-parchment bg-white"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-cream">
                    <Image
                      src={event.index_image_url!}
                      alt={event.index_image_alt || event.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-5">
                    {event.eyebrow ? (
                      <p className="type-eyebrow">{event.eyebrow}</p>
                    ) : null}
                    <h2 className="mt-2 font-serif text-2xl text-bark group-hover:text-salmon-dark">
                      {event.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-stone">
                      {event.summary}
                    </p>
                    <p className="mt-4 text-sm text-bark underline underline-offset-4 decoration-parchment">
                      View details
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
