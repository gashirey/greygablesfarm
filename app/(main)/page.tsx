import { HomePageContent } from "@/components/home/HomePageContent";
import { getPublicSiteConfig } from "@/lib/site-cms/queries";
import { getSiteMediaSlots } from "@/lib/site-media/queries";
import { resolveHomeHeroSlides } from "@/lib/site-media/hero-slides";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [siteMedia, config] = await Promise.all([
    getSiteMediaSlots(),
    getPublicSiteConfig(),
  ]);
  const heroSlides = await resolveHomeHeroSlides({
    src: siteMedia.hero.imageUrl,
    alt: siteMedia.hero.alt,
    focalX: siteMedia.hero.focalX,
    focalY: siteMedia.hero.focalY,
  });

  return (
    <HomePageContent
      heroFrame={config.theme.heroFrame}
      heroLayout={config.theme.heroLayout}
      heroSlides={heroSlides}
      copy={config.copy}
    />
  );
}
