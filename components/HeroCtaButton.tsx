import Link from "next/link";
import type { CSSProperties } from "react";
import { heroCtaCssVars } from "@/lib/site-cms/hero-cta";
import type { HeroCta } from "@/lib/site-cms/types";

type HeroCtaButtonProps = {
  cta: HeroCta;
  className?: string;
};

export function HeroCtaButton({ cta, className = "" }: HeroCtaButtonProps) {
  const { className: base, style } = heroCtaCssVars(cta);
  const classes = `${base} ${className}`.trim();

  if (cta.href.startsWith("http")) {
    return (
      <a
        href={cta.href}
        className={classes}
        style={style as CSSProperties}
        target="_blank"
        rel="noopener noreferrer"
      >
        {cta.label}
      </a>
    );
  }

  return (
    <Link href={cta.href} className={classes} style={style as CSSProperties}>
      {cta.label}
    </Link>
  );
}
