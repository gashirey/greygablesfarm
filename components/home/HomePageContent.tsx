import {
  HeroSlider,
  HOME_HERO_FADE_MS,
  HOME_HERO_SLIDE_MS,
  type HeroSlide,
} from "@/components/HeroSlider";
import type { HeroFrame } from "@/lib/content";
import type { ResolvedSiteCopy } from "@/lib/site-cms/types";
import type { HeroLayout } from "@/lib/snapshots/types";

type HomePageContentProps = {
  heroFrame?: HeroFrame;
  heroLayout?: HeroLayout;
  heroSlides?: readonly HeroSlide[];
  heroSlideIntervalMs?: number;
  copy?: ResolvedSiteCopy;
};

export function HomePageContent({
  heroFrame = "bleed",
  heroLayout = "immersive",
  heroSlides = [],
  heroSlideIntervalMs = HOME_HERO_SLIDE_MS,
  copy,
}: HomePageContentProps) {
  const heroHome = copy?.heroHome ?? {
    title: "Grown here. Arranged here. Delivered today.",
    subtitle:
      "Custom arrangements grown and designed on our Louisa County farm — delivered same-day across Central Virginia.",
    ctas: [
      { label: "Send flowers", href: "/order" },
      { label: "See what's growing", href: "/available-now" },
    ],
    primaryCta: { label: "Send flowers", href: "/order" },
    secondaryCta: { label: "See what's growing", href: "/available-now" },
  };

  const slides =
    heroSlides.length > 0
      ? heroSlides
      : [{ src: "/images/hero.jpg", alt: "Grey Gables Farm" }];

  return (
    <HeroSlider
      slides={slides}
      frame={heroFrame}
      layout={heroLayout}
      title={heroHome.title}
      subtitle={heroHome.subtitle}
      ctas={heroHome.ctas}
      showSlideControls={slides.length > 1}
      slideIntervalMs={heroSlideIntervalMs}
      fadeMs={HOME_HERO_FADE_MS}
    />
  );
}
