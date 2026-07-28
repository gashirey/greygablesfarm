import Image from "next/image";
import { Button } from "./Button";
import type { HeroCta } from "@/lib/site-cms/types";

type HeroProps = {
  title: string;
  subtitle?: string;
  /** Replace src with a real farm hero image, e.g. /images/hero.jpg */
  imageSrc: string;
  imageAlt: string;
  ctas?: readonly HeroCta[];
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  compact?: boolean;
};

export function Hero({
  title,
  subtitle,
  imageSrc,
  imageAlt,
  ctas,
  primaryCta,
  secondaryCta,
  compact = false,
}: HeroProps) {
  const buttons =
    ctas && ctas.length > 0
      ? ctas
      : ([primaryCta, secondaryCta].filter(Boolean) as HeroCta[]);

  return (
    <section
      className={`relative overflow-hidden bg-parchment ${compact ? "min-h-[36vh]" : "min-h-[62vh] md:min-h-[68vh]"}`}
    >
      {/* Home uses site.heroImage from lib/content.ts */}
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      {/* Flat scrim only — no gradients */}
      <div className="hero-scrim" aria-hidden />
      <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-6 pb-14 pt-8 lg:px-8 lg:pb-16">
        <h1 className="max-w-2xl font-serif text-4xl font-medium leading-tight text-white md:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/90 md:text-lg">
            {subtitle}
          </p>
        )}
        {buttons.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-3">
            {buttons.map((cta, i) => (
              <Button
                key={`${cta.href}-${cta.label}-${i}`}
                href={cta.href}
                variant={i === 0 ? "primary" : "outline"}
                className={
                  i === 0
                    ? ""
                    : "border-white/50 text-white hover:border-white hover:bg-white/10 hover:text-white"
                }
              >
                {cta.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
