import type { Metadata } from "next";
import { site } from "./content";

const defaultOgImage = "/images/hero.jpg";

export function pageMetadata({
  title,
  description,
  path = "",
  image,
}: {
  title: string;
  description: string;
  path?: string;
  /** Absolute URL or site-relative path for Open Graph / Twitter */
  image?: string;
}): Metadata {
  const url = `https://${site.domain}${path}`;
  const ogImage = image ?? defaultOgImage;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url,
      siteName: site.name,
      locale: "en_US",
      type: "website",
      images: [{ url: ogImage, alt: site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.name}`,
      description,
      images: [ogImage],
    },
  };
}
