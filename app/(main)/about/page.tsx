import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
    <section className="relative min-h-[100svh] bg-site-page">
      <div className="absolute inset-0">
        <Image
          src={about.imageUrl}
          alt={about.alt}
          fill
          priority
          className="object-cover"
          style={{
            objectPosition: focalObjectPosition(about.focalX, about.focalY),
          }}
          sizes="100vw"
          unoptimized={about.imageUrl.startsWith("http")}
        />
        <div className="hero-scrim" aria-hidden />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col px-6 pb-16 pt-28 lg:px-10 lg:pt-36">
        <div className="max-w-sm lg:max-w-md">
          <h1 className="type-hero-title text-3xl leading-tight md:text-4xl">
            About
          </h1>
          <div className="mt-6 space-y-4">
            {homeAbout.map((paragraph) => (
              <p
                key={paragraph.slice(0, 24)}
                className="type-hero-subtitle leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>
          <p className="mt-6 text-sm text-white/80">
            <Link
              href="/contact"
              className="text-white underline underline-offset-4 decoration-white/40 transition-colors hover:decoration-white"
            >
              Contact the farm
            </Link>
            {config.copy.availabilityPage.enabled ? (
              <>
                {" · "}
                <Link
                  href="/available-now"
                  className="text-white underline underline-offset-4 decoration-white/40 transition-colors hover:decoration-white"
                >
                  Current availability
                </Link>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </section>
  );
}
