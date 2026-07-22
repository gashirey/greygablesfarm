import Image from "next/image";
import Link from "next/link";
import type { FLOWER_TIERS } from "@/lib/flowers/tiers";

type Tier = (typeof FLOWER_TIERS)[number];

type FlowerProductCardProps = {
  tier: Tier;
  /** Tailwind order classes for mobile/desktop sort */
  orderClassName: string;
};

export function FlowerProductCard({
  tier,
  orderClassName,
}: FlowerProductCardProps) {
  const emphasized = tier.popular;

  return (
    <article
      className={`card flex flex-col ${orderClassName} ${
        emphasized
          ? "border-bark/40 ring-1 ring-bark/15 md:-mt-1 md:mb-[-0.25rem]"
          : ""
      }`}
    >
      <div className="image-frame relative aspect-[4/5]">
        <Image
          src={tier.imageSrc}
          alt={tier.imageAlt}
          fill
          className="object-cover"
          style={
            "imageObjectPosition" in tier && tier.imageObjectPosition
              ? { objectPosition: tier.imageObjectPosition }
              : undefined
          }
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {tier.popular ? (
          <span className="chip absolute left-3 top-3 bg-bark text-cream">
            Most popular
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col border-t border-parchment p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl text-bark md:text-[1.35rem]">
            {tier.name}
          </h2>
          <p
            className={`shrink-0 font-serif text-xl text-bark ${
              emphasized ? "font-medium" : ""
            }`}
          >
            {tier.priceLabel}
          </p>
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-stone">
          {tier.description}
        </p>
        <Link
          href={`/flowers/order?tier=${tier.id}`}
          className={`btn mt-6 w-full text-center ${
            emphasized
              ? "border-[var(--color-salmon-button)] bg-[var(--color-salmon-button)] text-white hover:border-[var(--color-salmon-button-hover)] hover:bg-[var(--color-salmon-button-hover)]"
              : "border-bark/25 bg-transparent text-bark hover:border-salmon-dark hover:text-salmon-dark"
          }`}
        >
          {tier.cta}
        </Link>
      </div>
    </article>
  );
}
