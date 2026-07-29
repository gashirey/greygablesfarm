import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ product: string }>;
};

const SCALE_ALIASES: Record<string, string> = {
  choice: "classic",
  deluxe: "signature",
  "curated-vessel": "grand",
  vessel: "grand",
};

/** Legacy per-product URLs → unified Designer's Choice flow */
export default async function OrderProductRedirectPage({ params }: Props) {
  const { product } = await params;
  const slug = product.trim().toLowerCase();
  const scale = SCALE_ALIASES[slug] ?? slug;
  redirect(`/order?scale=${encodeURIComponent(scale)}`);
}
