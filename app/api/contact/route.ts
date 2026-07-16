import { NextResponse } from "next/server";
import { splitName, upsertContact } from "@/lib/contacts";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const SUBJECT_TAGS: Record<string, string[]> = {
  flowers: ["flowers"],
  event: ["farm_event"],
  wedding: ["farm_event"],
  general: [],
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Contact form is not configured yet." },
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
    return NextResponse.json({ ok: true, status: "created" });
  }

  const name = typeof payload.name === "string" ? payload.name : "";
  const email = typeof payload.email === "string" ? payload.email : "";
  const phone = typeof payload.phone === "string" ? payload.phone : undefined;
  const message = typeof payload.message === "string" ? payload.message : "";
  const subject =
    typeof payload.subject === "string" ? payload.subject : "general";
  const source =
    typeof payload.source === "string" && payload.source.trim()
      ? payload.source.trim().slice(0, 80)
      : "website_contact_form";
  const context =
    typeof payload.context === "string" && payload.context.trim()
      ? payload.context.trim().slice(0, 200)
      : null;

  if (!name.trim() || !email.trim() || !message.trim()) {
    return NextResponse.json(
      { error: "Please fill in name, email, and message." },
      { status: 400 },
    );
  }

  const { firstName, lastName } = splitName(name);
  const subjectTags = SUBJECT_TAGS[subject] ?? [];
  const notes = context
    ? `[${context}]\n${message.trim()}`
    : message.trim();

  const result = await upsertContact({
    firstName,
    lastName,
    email,
    phone,
    emailOptIn: false,
    smsOptIn: false,
    source,
    customerType:
      subject === "event" || subject === "wedding"
        ? "event"
        : subject === "flowers"
          ? "flowers"
          : "general",
    notes,
    tags: subjectTags,
    activityType: "inquiry_received",
    activityDetail: context
      ? `subject:${subject}; context:${context}`
      : `subject:${subject}`,
  });

  if (!result.ok) {
    const status = result.code === "conflict" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    contactId: result.contactId,
    status: result.status,
  });
}
