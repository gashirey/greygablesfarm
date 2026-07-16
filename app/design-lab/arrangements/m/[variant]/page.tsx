import { redirect } from "next/navigation";

type Props = { params: Promise<{ variant: string }> };

/** Phone-first variants now live on the main site with full nav. */
export default async function ArrangementMobileLabVariantRedirect({
  params,
}: Props) {
  const { variant } = await params;
  redirect(`/found/${variant}`);
}
