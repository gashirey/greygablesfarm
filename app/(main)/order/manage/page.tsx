import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { ManageOrderClient } from "@/components/order/ManageOrderClient";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Manage your order",
  description: "Update details on your Grey Gables flower order.",
  path: "/order/manage",
});

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ManageOrderPage({ searchParams }: Props) {
  const { token } = await searchParams;

  return (
    <Section density="compact">
      {token ? (
        <ManageOrderClient token={token} />
      ) : (
        <div className="mx-auto max-w-xl">
          <h1 className="type-page-title">Manage order</h1>
          <p className="type-page-body mt-4">
            Open the manage link from your confirmation email to update your
            order.
          </p>
        </div>
      )}
    </Section>
  );
}
