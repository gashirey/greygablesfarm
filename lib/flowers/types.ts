import type { FlowerTierId } from "./tiers";

export type FlowerOrderInsert = {
  tier: FlowerTierId;
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
  tier: FlowerTierId;
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
