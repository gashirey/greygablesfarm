import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ tier?: string }>;
};

/** Legacy unpaid order form → self-service /order */
export default async function FlowersOrderRedirectPage({ searchParams }: Props) {
  const { tier } = await searchParams;
  const slugMap: Record<string, string> = {
    choice: "classic",
    deluxe: "signature",
    vessel: "grand",
  };
  const slug = tier ? slugMap[tier] : undefined;
  redirect(slug ? `/order?scale=${encodeURIComponent(slug)}` : "/order");
}
