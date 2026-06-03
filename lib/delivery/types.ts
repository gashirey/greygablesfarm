export const DELIVERY_OCCASIONS = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "sympathy", label: "Sympathy" },
  { value: "just_because", label: "Just Because" },
  { value: "other", label: "Other" },
] as const;

export const DELIVERY_BUDGETS = [
  { value: "75_125", label: "$75–$125" },
  { value: "125_200", label: "$125–$200" },
  { value: "200_350", label: "$200–$350" },
  { value: "350_plus", label: "$350+" },
] as const;

export type DeliveryOccasion = (typeof DELIVERY_OCCASIONS)[number]["value"];
export type DeliveryBudget = (typeof DELIVERY_BUDGETS)[number]["value"];

export type DeliveryInquiryInsert = {
  name: string;
  email: string;
  phone: string | null;
  recipient_name: string;
  recipient_address: string;
  recipient_county: string | null;
  delivery_date: string;
  occasion: DeliveryOccasion;
  budget: DeliveryBudget;
  notes: string | null;
};

export type DeliveryInquiryPayload = {
  name: string;
  email: string;
  phone?: string;
  recipientName: string;
  recipientAddress: string;
  recipientCounty?: string;
  deliveryDate: string;
  occasion: DeliveryOccasion;
  budget: DeliveryBudget;
  notes?: string;
};
