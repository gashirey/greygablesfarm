import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrangementPassNav } from "@/components/design-lab/ArrangementPassNav";
import { arrangementPassComponents } from "@/components/design-lab/ArrangementPasses";
import {
  arrangementPasses,
  getArrangementPass,
  type ArrangementPassId,
} from "@/lib/design-lab/arrangement-passes";

type Props = { params: Promise<{ pass: string }> };

export function generateStaticParams() {
  return arrangementPasses.map((p) => ({ pass: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pass: id } = await params;
  const pass = getArrangementPass(id);
  if (!pass) return { title: "Arrangement pass" };
  return {
    title: `Pass ${pass.id.toUpperCase()} · ${pass.name}`,
    description: pass.pitch,
    robots: { index: false, follow: false },
  };
}

export default async function ArrangementPassPage({ params }: Props) {
  const { pass: id } = await params;
  const pass = getArrangementPass(id);
  if (!pass) notFound();

  const Component =
    arrangementPassComponents[pass.id as ArrangementPassId];

  return (
    <div className="min-h-screen">
      <ArrangementPassNav />
      <div className="border-b border-parchment bg-white px-4 py-2 text-center text-xs text-stone">
        Pass {pass.id.toUpperCase()} · {pass.name} · {pass.voice} — not live
        yet
      </div>
      <Component />
    </div>
  );
}
