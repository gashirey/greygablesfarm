import { NextResponse } from "next/server";
import { bloomsPackage, bloomsPaths } from "@/lib/blooms/package";
import type { BloomsBookingInsert } from "@/lib/blooms/types";
import { splitName, upsertContact } from "@/lib/contacts";
import { sendBloomsBookingEmail } from "@/lib/email/send-blooms-booking-notification";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { site } from "@/lib/content";

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return `https://${site.domain}`;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Bookings are not configured yet." },
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
  const partnerName =
    typeof payload.partnerName === "string" && payload.partnerName.trim()
      ? payload.partnerName.trim()
      : null;
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const phone =
    typeof payload.phone === "string" && payload.phone.trim()
      ? payload.phone.trim()
      : null;
  const preferredDate =
    typeof payload.preferredDate === "string" && payload.preferredDate.trim()
      ? payload.preferredDate.trim()
      : null;
  const preferredTime =
    typeof payload.preferredTime === "string" && payload.preferredTime.trim()
      ? payload.preferredTime.trim()
      : null;
  const notes =
    typeof payload.notes === "string" && payload.notes.trim()
      ? payload.notes.trim()
      : null;

  if (!name || !email) {
    return NextResponse.json(
      { error: "Please enter your name and email." },
      { status: 400 },
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const row: BloomsBookingInsert = {
    name,
    partner_name: partnerName,
    email: email.toLowerCase(),
    phone,
    preferred_date: preferredDate,
    preferred_time: preferredTime,
    notes,
    payment_status: "pending",
    amount_cents: bloomsPackage.priceCents,
  };

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("blooms_bookings")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("[blooms-booking] insert", error);
    return NextResponse.json(
      { error: "Could not save your booking. Please try again or email us directly." },
      { status: 500 },
    );
  }

  const bookingPayload = {
    name,
    partnerName: partnerName ?? undefined,
    email,
    phone: phone ?? undefined,
    preferredDate: preferredDate ?? undefined,
    preferredTime: preferredTime ?? undefined,
    notes: notes ?? undefined,
    bookingId: data.id,
    paymentStatus: "pending",
  };

  await sendBloomsBookingEmail(bookingPayload);

  const { firstName, lastName } = splitName(name);
  await upsertContact({
    firstName,
    lastName,
    email,
    phone: phone ?? undefined,
    emailOptIn: false,
    smsOptIn: false,
    source: "blooms_booking",
    customerType: "event",
    notes: notes ?? undefined,
    tags: ["photography"],
    activityType: "inquiry_received",
    activityDetail: "blooms_date_night",
  });

  let checkoutUrl: string | undefined;

  if (isStripeConfigured()) {
    try {
      const stripe = getStripe();
      const origin = siteOrigin(request);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: email,
        client_reference_id: data.id,
        metadata: {
          booking_id: data.id,
          package: bloomsPackage.packageName,
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: bloomsPackage.priceCents,
              product_data: {
                name: `${bloomsPackage.title} — ${bloomsPackage.packageName}`,
                description: bloomsPackage.sessionLength,
              },
            },
          },
        ],
        success_url: `${origin}${bloomsPaths.booked}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${bloomsPaths.page}#book`,
      });

      if (session.url) {
        checkoutUrl = session.url;
        await supabase
          .from("blooms_bookings")
          .update({
            stripe_session_id: session.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);
      }
    } catch (err) {
      console.error("[blooms-booking] stripe checkout", err);
    }
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    checkoutUrl,
    paymentRequired: isStripeConfigured(),
  });
}
