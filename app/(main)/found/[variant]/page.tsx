import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrangementMobileVariantView } from "@/components/design-lab/ArrangementMobileVariant";
import {
  arrangementMobileVariants,
  getArrangementMobileVariant,
} from "@/lib/design-lab/arrangement-mobile-variants";
import { pageMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ variant: string }> };

export function generateStaticParams() {
  return arrangementMobileVariants.map((v) => ({ variant: v.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { variant: id } = await params;
  const v = getArrangementMobileVariant(id);
  if (!v) return { title: "Custom arrangements" };
  return pageMetadata({
    title: "Custom arrangements",
    description: v.body,
    path: `/found/${v.id}`,
  });
}

export default async function FoundVariantPage({ params }: Props) {
  const { variant: id } = await params;
  const variant = getArrangementMobileVariant(id);
  if (!variant) notFound();

  return <ArrangementMobileVariantView variant={variant} siteChrome />;
}
