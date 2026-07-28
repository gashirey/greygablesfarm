"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./Button";
import type { HeroFrame } from "@/lib/content";
import { focalObjectPosition } from "@/lib/site-cms/focal";
import type { HeroCta } from "@/lib/site-cms/types";
import type { HeroLayout } from "@/lib/snapshots/types";

const DEFAULT_SLIDE_MS = 9000;
const DEFAULT_FADE_MS = 2000;

/** Slow crossfade for homepage hero carousel */
export const HOME_HERO_SLIDE_MS = 14_000;
export const HOME_HERO_FADE_MS = 2_800;

export type HeroSlide = {
  src: string;
  alt: string;
  id?: string;
  focalX?: number;
  focalY?: number;
};

type HeroSliderProps = {
  slides: readonly HeroSlide[];
  title: string;
  subtitle?: string;
  frame?: HeroFrame;
  layout?: HeroLayout;
  /** Preferred: ordered buttons (first primary, rest outline). */
  ctas?: readonly HeroCta[];
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  showSlideControls?: boolean;
  slideIntervalMs?: number;
  fadeMs?: number;
};

export function HeroSlider({
  slides,
  title,
  subtitle,
  frame = "bleed",
  layout = "standard",
  ctas,
  primaryCta,
  secondaryCta,
  showSlideControls = true,
  slideIntervalMs = DEFAULT_SLIDE_MS,
  fadeMs = DEFAULT_FADE_MS,
}: HeroSliderProps) {
  const buttons =
    ctas && ctas.length > 0
      ? ctas
      : ([primaryCta, secondaryCta].filter(Boolean) as HeroCta[]);
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (reducedMotion || slides.length <= 1) return;
    const id = window.setInterval(advance, slideIntervalMs);
    return () => window.clearInterval(id);
  }, [advance, reducedMotion, slides.length, slideIntervalMs]);

  const inset = frame === "inset";
  const immersive = layout === "immersive";
  const minHeight = immersive
    ? "min-h-[100svh]"
    : "min-h-[72vh] md:min-h-[78vh]";

  const imageRegion = (
    <div
      className={`relative ${minHeight} ${inset ? "overflow-hidden border border-site-border" : "overflow-hidden"}`}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id ?? `${slide.src}-${i}`}
          className={`hero-slider-fade absolute inset-0 ${i === index ? "opacity-100" : "opacity-0"}`}
          style={{ transitionDuration: reducedMotion ? "0ms" : `${fadeMs}ms` }}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.src}
            alt={i === index ? slide.alt : ""}
            fill
            priority={i === 0}
            className="object-cover"
            style={{
              objectPosition: focalObjectPosition(slide.focalX, slide.focalY),
            }}
            sizes={inset ? "(max-width: 1280px) 100vw, 1280px" : "100vw"}
            unoptimized={slide.src.startsWith("http")}
          />
        </div>
      ))}
      <div className="hero-scrim" aria-hidden />
      <div
        className={`relative flex ${minHeight} flex-col justify-end px-6 pb-12 pt-8 lg:px-10 ${immersive ? "md:pb-20" : "lg:pb-16"}`}
      >
        <h1 className="type-hero-title max-w-2xl leading-[1.1]">
          {title}
        </h1>
        {subtitle && (
          <p className="type-hero-subtitle mt-4 max-w-md md:text-lg">
            {subtitle}
          </p>
        )}
        {buttons.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {buttons.map((cta, i) => (
              <Button
                key={`${cta.href}-${cta.label}-${i}`}
                href={cta.href}
                variant={i === 0 ? "primary" : "outline"}
                className={
                  i === 0
                    ? "type-button"
                    : "border-white/50 text-white hover:border-white hover:bg-white/10 hover:text-white"
                }
              >
                {cta.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {showSlideControls && slides.length > 1 && (
        <div
          className="absolute bottom-5 left-6 flex gap-2 lg:left-8"
          role="tablist"
          aria-label="Hero images"
        >
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show image: ${slide.alt}`}
              onClick={() => setIndex(i)}
              className={`h-0.5 w-8 rounded-sm transition-colors ${
                i === index ? "bg-white" : "bg-white/35 hover:bg-white/55"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (inset) {
    return (
      <section className="bg-site-page px-5 py-5 md:px-10 md:py-8 lg:px-14">
        <div className="mx-auto max-w-6xl">{imageRegion}</div>
      </section>
    );
  }

  return <section className="relative bg-site-page">{imageRegion}</section>;
}
