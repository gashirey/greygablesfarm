import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ tier?: string }>;
};

/** Legacy unpaid order form → self-service /order */
export default async function FlowersOrderRedirectPage({ searchParams }: Props) {
  const { tier } = await searchParams;
  const slugMap: Record<string, string> = {
    choice: "choice",
    deluxe: "deluxe",
    vessel: "curated-vessel",
  };
  const slug = tier ? slugMap[tier] : undefined;
  redirect(slug ? `/order/${slug}` : "/order");
}
