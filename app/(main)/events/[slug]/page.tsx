import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Hero } from "@/components/Hero";
import { Section } from "@/components/Section";
import {
  eventHasRequiredImages,
  formatEventDateRange,
  splitBulletLines,
  splitParagraphs,
} from "@/lib/events/format";
import { getFarmEventBySlug, listFarmEvents } from "@/lib/events/queries";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getFarmEventBySlug(slug);
  if (!event || !eventHasRequiredImages(event)) {
    return { title: "Event" };
  }
  return pageMetadata({
    title: event.title,
    description: event.summary || event.subtitle || event.title,
    path: `/events/${event.slug}`,
  });
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getFarmEventBySlug(slug);
  if (!event || !eventHasRequiredImages(event)) notFound();

  const siblings = (await listFarmEvents())
    .filter(eventHasRequiredImages)
    .filter((e) => e.id !== event.id)
    .slice(0, 4);

  const cta =
    event.cta_label && event.cta_href
      ? { label: event.cta_label, href: event.cta_href }
      : undefined;

  return (
    <>
      <Hero
        title={event.title}
        subtitle={event.subtitle ?? event.summary}
        imageSrc={event.detail_image_url!}
        imageAlt={event.detail_image_alt || event.title}
        primaryCta={cta}
        compact
      />

      {event.dates.length > 0 ? (
        <Section density="compact" className="!pb-0">
          <div className="max-w-2xl border-b border-parchment pb-10">
            {event.eyebrow ? (
              <p className="type-eyebrow">{event.eyebrow}</p>
            ) : null}
            <h2 className="type-section-title mt-2 text-2xl md:text-3xl">
              Dates
            </h2>
            <ul className="mt-6 space-y-4">
              {event.dates.map((date) => (
                <li
                  key={date.id}
                  className={`text-sm ${date.is_cancelled ? "text-stone line-through" : "text-bark"}`}
                >
                  <p className="font-medium">{formatEventDateRange(date)}</p>
                  {date.label ? (
                    <p className="mt-0.5 text-stone">{date.label}</p>
                  ) : null}
                  {date.time_note ? (
                    <p className="mt-0.5 text-stone">{date.time_note}</p>
                  ) : null}
                  {date.is_cancelled ? (
                    <p className="mt-0.5 text-stone no-underline">Cancelled</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ) : null}

      {event.segments.map((segment) => {
        if (segment.segment_type === "image" && segment.image_url) {
          return (
            <Section key={segment.id} density="compact">
              {segment.title ? (
                <h2 className="type-section-title mb-6 text-2xl md:text-3xl">
                  {segment.title}
                </h2>
              ) : null}
              <div className="relative aspect-[16/9] max-w-4xl overflow-hidden border border-parchment">
                <Image
                  src={segment.image_url}
                  alt={segment.image_alt || segment.title || event.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 896px) 100vw, 896px"
                />
              </div>
              {segment.body ? (
                <p className="mt-3 max-w-2xl text-sm text-stone">{segment.body}</p>
              ) : null}
            </Section>
          );
        }

        if (segment.segment_type === "bullets") {
          const items = splitBulletLines(segment.body);
          return (
            <Section key={segment.id} density="compact">
              <div className="max-w-2xl">
                {segment.title ? (
                  <h2 className="type-section-title text-2xl md:text-3xl">
                    {segment.title}
                  </h2>
                ) : null}
                <ul className="mt-6 space-y-3 border-t border-parchment pt-6">
                  {items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-bark">
                      <span
                        className="mt-1.5 h-1 w-1 shrink-0 bg-salmon-dark"
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Section>
          );
        }

        if (segment.segment_type === "cta") {
          return (
            <Section key={segment.id} density="compact">
              <div className="max-w-2xl border border-parchment bg-white p-6 md:p-8">
                {segment.title ? (
                  <h2 className="font-serif text-2xl text-bark">{segment.title}</h2>
                ) : null}
                {segment.body
                  ? splitParagraphs(segment.body).map((p) => (
                      <p
                        key={p}
                        className="mt-3 text-sm leading-relaxed text-stone"
                      >
                        {p}
                      </p>
                    ))
                  : null}
                {cta ? (
                  <p className="mt-6">
                    <Link
                      href={cta.href}
                      className="btn btn-primary text-sm"
                    >
                      {cta.label}
                    </Link>
                  </p>
                ) : (
                  <p className="mt-6">
                    <Link
                      href="/contact?subject=event"
                      className="btn btn-primary text-sm"
                    >
                      Contact the farm
                    </Link>
                  </p>
                )}
              </div>
            </Section>
          );
        }

        const paragraphs = splitParagraphs(segment.body);
        return (
          <Section key={segment.id} density="compact">
            <div className="max-w-2xl">
              {segment.title ? (
                <h2 className="type-section-title text-2xl md:text-3xl">
                  {segment.title}
                </h2>
              ) : null}
              <div className={segment.title ? "mt-4 space-y-4" : "space-y-4"}>
                {paragraphs.map((p) => (
                  <p
                    key={p}
                    className="type-page-body text-base leading-relaxed md:text-lg"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </Section>
        );
      })}

      {siblings.length > 0 ? (
        <Section density="compact">
          <h2 className="type-section-title text-2xl">More events</h2>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {siblings.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/events/${item.slug}`}
                  className="text-bark underline underline-offset-4 decoration-parchment hover:text-salmon-dark"
                >
                  {item.title}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/events"
                className="text-stone underline underline-offset-4 hover:text-bark"
              >
                All events
              </Link>
            </li>
          </ul>
        </Section>
      ) : (
        <Section density="compact">
          <Link
            href="/events"
            className="text-sm text-bark underline underline-offset-4"
          >
            All events
          </Link>
        </Section>
      )}
    </>
  );
}
