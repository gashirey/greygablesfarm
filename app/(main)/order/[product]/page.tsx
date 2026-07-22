import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/Section";
import { OrderWizard } from "@/components/order/OrderWizard";
import {
  getProductBySlug,
  listAvailability,
  listAvailableVessels,
} from "@/lib/order/queries";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ product: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product: slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return pageMetadata({
      title: "Order Flowers",
      description: "Order Designer's Choice arrangements.",
      path: `/order/${slug}`,
    });
  }
  return pageMetadata({
    title: `Order ${product.name}`,
    description: product.description.slice(0, 160),
    path: `/order/${product.slug}`,
    image: product.imageUrl || undefined,
  });
}

export default async function OrderProductPage({ params }: Props) {
  const { product: slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [vessels, availability] = await Promise.all([
    product.requiresVessel ? listAvailableVessels() : Promise.resolve([]),
    listAvailability({ days: 21 }),
  ]);

  return (
    <Section density="compact">
      <OrderWizard
        product={product}
        vessels={vessels}
        availability={availability}
      />
    </Section>
  );
}
