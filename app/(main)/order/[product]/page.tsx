import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{ product: string }>;
};

const SCALE_ALIASES: Record<string, string> = {
  choice: "classic",
  deluxe: "signature",
  "curated-vessel": "grand",
  vessel: "grand",
};

/** Real sibling routes under /order — never treat as product slugs. */
const RESERVED_ORDER_SEGMENTS = new Set([
  "smoke",
  "success",
  "manage",
  "cancelled",
]);

/** Legacy per-product URLs → unified Designer's Choice flow */
export default async function OrderProductRedirectPage({ params }: Props) {
  const { product } = await params;
  const slug = product.trim().toLowerCase();
  if (RESERVED_ORDER_SEGMENTS.has(slug)) {
    notFound();
  }
  const scale = SCALE_ALIASES[slug] ?? slug;
  redirect(`/order?scale=${encodeURIComponent(scale)}`);
}
