import { createServiceClient } from "@/lib/supabase/server";

export type InboxKind = "contact" | "delivery" | "blooms";

export type InboxItem = {
  id: string;
  kind: InboxKind;
  createdAt: string;
  name: string;
  email: string;
  phone: string | null;
  title: string;
  summary: string;
  meta: string[];
};

function displayName(
  fullName: string | null,
  first: string | null,
  last: string | null,
  fallback: string,
): string {
  if (fullName?.trim()) return fullName.trim();
  const joined = [first, last].filter(Boolean).join(" ").trim();
  return joined || fallback;
}

export async function listInboxItems(limit = 80): Promise<InboxItem[]> {
  const supabase = createServiceClient();
  const perSource = Math.max(20, Math.ceil(limit / 2));

  const [activityRes, deliveryRes, bloomsRes] = await Promise.all([
    supabase
      .from("contact_activity")
      .select(
        "id, activity_detail, source, created_at, contacts(id, full_name, first_name, last_name, email, phone, notes, source)",
      )
      .eq("activity_type", "inquiry_received")
      .order("created_at", { ascending: false })
      .limit(perSource),
    supabase
      .from("delivery_inquiries")
      .select(
        "id, name, email, phone, recipient_name, occasion, budget, delivery_date, notes, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(perSource),
    supabase
      .from("blooms_bookings")
      .select(
        "id, name, partner_name, email, phone, preferred_date, preferred_time, notes, payment_status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(perSource),
  ]);

  // Missing tables (migration not run) return an error — skip that source.
  if (activityRes.error && !/does not exist|schema cache/i.test(activityRes.error.message)) {
    throw new Error(activityRes.error.message);
  }
  if (deliveryRes.error && !/does not exist|schema cache/i.test(deliveryRes.error.message)) {
    throw new Error(deliveryRes.error.message);
  }
  if (bloomsRes.error && !/does not exist|schema cache/i.test(bloomsRes.error.message)) {
    throw new Error(bloomsRes.error.message);
  }

  const items: InboxItem[] = [];

  for (const row of activityRes.data ?? []) {
    const contactRaw = row.contacts as
      | {
          id: string;
          full_name: string | null;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          notes: string | null;
          source: string | null;
        }
      | {
          id: string;
          full_name: string | null;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          notes: string | null;
          source: string | null;
        }[]
      | null;
    const contact = Array.isArray(contactRaw) ? contactRaw[0] : contactRaw;
    if (!contact) continue;
    items.push({
      id: `contact:${row.id}`,
      kind: "contact",
      createdAt: row.created_at,
      name: displayName(
        contact.full_name,
        contact.first_name,
        contact.last_name,
        contact.email ?? "Unknown",
      ),
      email: contact.email ?? "",
      phone: contact.phone,
      title: "Contact inquiry",
      summary: contact.notes?.trim() || row.activity_detail || "—",
      meta: [
        contact.source ? `source: ${contact.source}` : null,
        row.activity_detail ?? null,
      ].filter(Boolean) as string[],
    });
  }

  for (const row of deliveryRes.data ?? []) {
    items.push({
      id: `delivery:${row.id}`,
      kind: "delivery",
      createdAt: row.created_at,
      name: row.name,
      email: row.email,
      phone: row.phone,
      title: "Delivery inquiry",
      summary:
        row.notes?.trim() ||
        `For ${row.recipient_name} · ${row.occasion.replace(/_/g, " ")}`,
      meta: [
        `recipient: ${row.recipient_name}`,
        `date: ${row.delivery_date}`,
        `budget: ${row.budget.replace(/_/g, "–")}`,
        `occasion: ${row.occasion.replace(/_/g, " ")}`,
      ],
    });
  }

  for (const row of bloomsRes.data ?? []) {
    items.push({
      id: `blooms:${row.id}`,
      kind: "blooms",
      createdAt: row.created_at,
      name: row.partner_name
        ? `${row.name} & ${row.partner_name}`
        : row.name,
      email: row.email,
      phone: row.phone,
      title: "Photos in the Blooms",
      summary: row.notes?.trim() || "Booking request",
      meta: [
        `payment: ${row.payment_status}`,
        row.preferred_date ? `date: ${row.preferred_date}` : null,
        row.preferred_time ? `time: ${row.preferred_time}` : null,
      ].filter(Boolean) as string[],
    });
  }

  items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return items.slice(0, limit);
}
