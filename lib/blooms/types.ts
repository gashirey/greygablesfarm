export type BloomsPaymentStatus = "pending" | "paid" | "cancelled";

export type BloomsBookingInsert = {
  name: string;
  partner_name: string | null;
  email: string;
  phone: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string | null;
  payment_status: BloomsPaymentStatus;
  amount_cents: number;
};

export type BloomsBookingPayload = {
  name: string;
  partnerName?: string;
  email: string;
  phone?: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
};
