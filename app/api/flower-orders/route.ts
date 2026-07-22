import { NextResponse } from "next/server";
import { sendFlowerOrderEmail } from "@/lib/email/send-flower-order-notification";
import {
  earliestDeliveryDate,
  isDeliverableWeekday,
  resolveDeliveryDateSelection,
  todayInDeliveryZone,
} from "@/lib/flowers/delivery-date";
import { getFlowerTier, isFlowerTierId } from "@/lib/flowers/tiers";
import type { FlowerOrderInsert } from "@/lib/flowers/types";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const CARD_MESSAGE_MAX = 250;

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Orders are not configured yet." },
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

  const tierRaw = typeof payload.tier === "string" ? payload.tier.trim() : "";
  if (!isFlowerTierId(tierRaw)) {
    return NextResponse.json({ error: "Please select a tier." }, { status: 400 });
  }
  const tier = getFlowerTier(tierRaw);

  const senderName =
    typeof payload.senderName === "string" ? payload.senderName.trim() : "";
  const senderEmail =
    typeof payload.senderEmail === "string" ? payload.senderEmail.trim() : "";
  const senderPhone =
    typeof payload.senderPhone === "string" ? payload.senderPhone.trim() : "";
  const recipientName =
    typeof payload.recipientName === "string" ? payload.recipientName.trim() : "";
  const recipientPhone =
    typeof payload.recipientPhone === "string"
      ? payload.recipientPhone.trim()
      : "";
  const addressStreet =
    typeof payload.addressStreet === "string" ? payload.addressStreet.trim() : "";
  const addressCity =
    typeof payload.addressCity === "string" ? payload.addressCity.trim() : "";
  const addressZip =
    typeof payload.addressZip === "string" ? payload.addressZip.trim() : "";
  let deliveryDate =
    typeof payload.deliveryDate === "string" ? payload.deliveryDate.trim() : "";
  const cardMessage =
    typeof payload.cardMessage === "string" && payload.cardMessage.trim()
      ? payload.cardMessage.trim().slice(0, CARD_MESSAGE_MAX)
      : null;
  const notes =
    typeof payload.notes === "string" && payload.notes.trim()
      ? payload.notes.trim()
      : null;

  if (
    !senderName ||
    !senderEmail ||
    !senderPhone ||
    !recipientName ||
    !recipientPhone ||
    !addressStreet ||
    !addressCity ||
    !addressZip ||
    !deliveryDate
  ) {
    return NextResponse.json(
      { error: "Please complete all required fields." },
      { status: 400 },
    );
  }

  if (!EMAIL_RE.test(senderEmail)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const resolved = resolveDeliveryDateSelection(deliveryDate);
  deliveryDate = resolved.date;

  const earliest = earliestDeliveryDate();
  if (deliveryDate < earliest || deliveryDate < todayInDeliveryZone()) {
    return NextResponse.json(
      { error: "Please choose a valid delivery date." },
      { status: 400 },
    );
  }

  if (!isDeliverableWeekday(deliveryDate)) {
    return NextResponse.json(
      { error: "We deliver Tuesday through Saturday." },
      { status: 400 },
    );
  }

  const row: FlowerOrderInsert = {
    tier: tier.id,
    price: tier.price,
    sender_name: senderName,
    sender_email: senderEmail.toLowerCase(),
    sender_phone: senderPhone,
    recipient_name: recipientName,
    recipient_phone: recipientPhone,
    address_street: addressStreet,
    address_city: addressCity,
    address_zip: addressZip,
    delivery_date: deliveryDate,
    card_message: cardMessage,
    notes,
    status: "new",
  };

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("[flower-orders] insert", error);
    return NextResponse.json(
      {
        error:
          "Could not save your order. Please try again or email us directly.",
      },
      { status: 500 },
    );
  }

  await sendFlowerOrderEmail({
    tier: tier.id,
    senderName,
    senderEmail: senderEmail.toLowerCase(),
    senderPhone,
    recipientName,
    recipientPhone,
    addressStreet,
    addressCity,
    addressZip,
    deliveryDate,
    cardMessage: cardMessage ?? undefined,
    notes: notes ?? undefined,
  });

  return NextResponse.json({ ok: true, id: data.id });
}
