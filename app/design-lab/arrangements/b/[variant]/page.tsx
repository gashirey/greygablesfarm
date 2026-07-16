import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrangementBVariantNav } from "@/components/design-lab/ArrangementBVariantNav";
import { ArrangementPassBVariant } from "@/components/design-lab/ArrangementPassBVariant";
import {
  arrangementBVariants,
  getArrangementBVariant,
} from "@/lib/design-lab/arrangement-b-variants";

type Props = { params: Promise<{ variant: string }> };

export function generateStaticParams() {
  return arrangementBVariants.map((v) => ({ variant: v.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { variant: id } = await params;
  const v = getArrangementBVariant(id);
  if (!v) return { title: "Pass B variant" };
  return {
    title: `B${v.id} · ${v.name}`,
    description: v.pitch,
    robots: { index: false, follow: false },
  };
}

export default async function ArrangementBVariantPage({ params }: Props) {
  const { variant: id } = await params;
  const variant = getArrangementBVariant(id);
  if (!variant) notFound();

  return (
    <div className="min-h-screen">
      <ArrangementBVariantNav />
      <div className="border-b border-parchment bg-white px-4 py-2 text-center text-xs text-stone">
        Pass B structure · B{variant.id} · {variant.name} — wording &amp; image
        only
      </div>
      <ArrangementPassBVariant variant={variant} />
    </div>
  );
}
