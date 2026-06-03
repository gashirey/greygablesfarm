import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/Section";
import { site } from "@/lib/content";
import { focalObjectPosition } from "@/lib/site-cms/focal";
import { getPublicSiteConfig } from "@/lib/site-cms/queries";
import { getSiteMediaSlots } from "@/lib/site-media/queries";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: `Seasonal cut flowers in ${site.locationRegion}.`,
  path: "/about",
});

export default async function AboutPage() {
  const [siteMedia, config] = await Promise.all([
    getSiteMediaSlots(),
    getPublicSiteConfig(),
  ]);
  const about = siteMedia.about;
  const homeAbout = config.copy.homeAbout;

  return (
    <Section density="compact" className="pt-20 md:pt-28">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16 lg:items-start">
        <div>
          <h1 className="type-page-title leading-tight md:text-4xl">
            About
          </h1>
          <p className="type-page-body mt-6 leading-relaxed">
            Grey Gables delivers custom arrangements across Central Virginia —
            grown on the farm, designed by hand, delivered same-day. If you&apos;re
            looking to send flowers to someone local,{" "}
            <Link
              href="/send-flowers"
              className="text-bark underline underline-offset-4 decoration-parchment hover:text-salmon-dark"
            >
              start here
            </Link>
            .
          </p>
          <div className="mt-6 space-y-4">
            {homeAbout.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="type-page-body leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
          <p className="mt-6 text-sm text-stone">
            <Link
              href="/contact"
              className="text-bark underline underline-offset-4 decoration-parchment hover:text-salmon-dark"
            >
              Contact the farm
            </Link>
            {" · "}
            <Link
              href="/available-now"
              className="text-bark underline underline-offset-4 decoration-parchment hover:text-salmon-dark"
            >
              Current availability
            </Link>
          </p>
        </div>
        <div className="relative aspect-[4/5] min-h-[320px] w-full bg-parchment lg:aspect-[3/4]">
          <Image
            src={about.imageUrl}
            alt={about.alt}
            fill
            className="object-cover"
            style={{
              objectPosition: focalObjectPosition(about.focalX, about.focalY),
            }}
            sizes="(max-width: 1024px) 100vw, 55vw"
            priority
            unoptimized={about.imageUrl.startsWith("http")}
          />
        </div>
      </div>
    </Section>
  );
}
