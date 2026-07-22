import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/Section";
import { listActiveProducts } from "@/lib/order/queries";
import { formatCents } from "@/lib/order/types";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Order Flowers",
  description:
    "Order Designer's Choice arrangements for delivery or farm pickup. Cut the morning of fulfillment across Central Virginia.",
  path: "/order",
});

export default async function OrderIndexPage() {
  const products = await listActiveProducts();

  return (
    <Section density="compact">
      <header className="max-w-2xl">
        <h1 className="type-page-title leading-tight">Order flowers</h1>
        <p className="type-page-body mt-4 leading-relaxed">
          Choose an arrangement. We&apos;ll guide you through vessel selection
          (when needed), delivery or farm pickup, and secure checkout.
        </p>
      </header>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {products.map((p) => (
          <article key={p.id} className="card flex flex-col">
            <div className="image-frame relative aspect-[4/5]">
              {p.imageUrl ? (
                <Image
                  src={p.imageUrl}
                  alt={p.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 bg-parchment" />
              )}
            </div>
            <div className="flex flex-1 flex-col border-t border-parchment p-5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-serif text-xl text-bark">{p.name}</h2>
                <p className="font-serif text-xl text-bark">
                  {formatCents(p.basePriceCents)}
                </p>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-stone">
                {p.description}
              </p>
              {p.requiresVessel ? (
                <p className="mt-2 text-xs text-stone">
                  Includes curated vessel selection
                </p>
              ) : (
                <p className="mt-2 text-xs text-stone">Standard glass vase</p>
              )}
              <Link
                href={`/order/${p.slug}`}
                className="btn mt-5 w-full border-[var(--color-salmon-button)] bg-[var(--color-salmon-button)] text-center text-white hover:bg-[var(--color-salmon-button-hover)]"
              >
                Select
              </Link>
            </div>
          </article>
        ))}
      </div>

      {!products.length ? (
        <p className="mt-8 text-sm text-stone">
          Arrangements are not available online right now. Please{" "}
          <Link href="/contact" className="underline underline-offset-2">
            contact the farm
          </Link>
          .
        </p>
      ) : null}
    </Section>
  );
}
