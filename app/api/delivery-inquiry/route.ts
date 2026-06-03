import { NextResponse } from "next/server";
import { sendDeliveryInquiryEmail } from "@/lib/email/send-delivery-notification";
import {
  DELIVERY_BUDGETS,
  DELIVERY_OCCASIONS,
  type DeliveryInquiryInsert,
  type DeliveryOccasion,
  type DeliveryBudget,
} from "@/lib/delivery/types";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const OCCASION_VALUES = new Set(DELIVERY_OCCASIONS.map((o) => o.value));
const BUDGET_VALUES = new Set(DELIVERY_BUDGETS.map((b) => b.value));

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Delivery inquiries are not configured yet." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  if (payload.website) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const phone =
    typeof payload.phone === "string" && payload.phone.trim()
      ? payload.phone.trim()
      : null;
  const recipientName =
    typeof payload.recipientName === "string" ? payload.recipientName.trim() : "";
  const recipientAddress =
    typeof payload.recipientAddress === "string"
      ? payload.recipientAddress.trim()
      : "";
  const recipientCounty =
    typeof payload.recipientCounty === "string" && payload.recipientCounty.trim()
      ? payload.recipientCounty.trim()
      : null;
  const deliveryDate =
    typeof payload.deliveryDate === "string" ? payload.deliveryDate.trim() : "";
  const occasion = payload.occasion as DeliveryOccasion;
  const budget = payload.budget as DeliveryBudget;
  const notes =
    typeof payload.notes === "string" && payload.notes.trim()
      ? payload.notes.trim()
      : null;

  if (
    !name ||
    !email ||
    !recipientName ||
    !recipientAddress ||
    !deliveryDate ||
    !OCCASION_VALUES.has(occasion) ||
    !BUDGET_VALUES.has(budget)
  ) {
    return NextResponse.json(
      { error: "Please complete all required fields." },
      { status: 400 },
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const row: DeliveryInquiryInsert = {
    name,
    email: email.toLowerCase(),
    phone,
    recipient_name: recipientName,
    recipient_address: recipientAddress,
    recipient_county: recipientCounty,
    delivery_date: deliveryDate,
    occasion,
    budget,
    notes,
  };

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("delivery_inquiries")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("[delivery-inquiry] insert", error);
    return NextResponse.json(
      { error: "Could not save your inquiry. Please try again or email us directly." },
      { status: 500 },
    );
  }

  await sendDeliveryInquiryEmail({
    name,
    email,
    phone: phone ?? undefined,
    recipientName,
    recipientAddress,
    recipientCounty: recipientCounty ?? undefined,
    deliveryDate,
    occasion,
    budget,
    notes: notes ?? undefined,
  });

  return NextResponse.json({ ok: true, id: data.id });
}
