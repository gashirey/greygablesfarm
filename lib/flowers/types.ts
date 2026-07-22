export type FlowerTier = {
  id: string;
  slug: string;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  cta: string;
  popular: boolean;
  imageSrc: string;
  imageAlt: string;
  imageObjectPosition?: string;
  sortOrder: number;
  isVisible: boolean;
};

/** Row shape from public.flower_tiers */
export type FlowerTierRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  cta_label: string;
  image_url: string;
  image_alt: string;
  image_object_position: string | null;
  is_popular: boolean;
  is_visible: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type FlowerOrderInsert = {
  tier: string;
  price: number;
  sender_name: string;
  sender_email: string;
  sender_phone: string;
  recipient_name: string;
  recipient_phone: string;
  address_street: string;
  address_city: string;
  address_zip: string;
  delivery_date: string;
  card_message: string | null;
  notes: string | null;
  status: "new";
};

export type FlowerOrderPayload = {
  tier: string;
  tierName: string;
  priceLabel: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  addressStreet: string;
  addressCity: string;
  addressZip: string;
  deliveryDate: string;
  cardMessage?: string;
  notes?: string;
};

export function formatPriceLabel(price: number): string {
  return `$${price}`;
}

export function mapFlowerTierRow(row: FlowerTierRow): FlowerTier {
  return {
    id: row.slug,
    slug: row.slug,
    name: row.name,
    price: row.price,
    priceLabel: formatPriceLabel(row.price),
    description: row.description,
    cta: row.cta_label || "Order for delivery",
    popular: row.is_popular,
    imageSrc: row.image_url,
    imageAlt: row.image_alt || row.name,
    imageObjectPosition: row.image_object_position ?? undefined,
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
  };
}
