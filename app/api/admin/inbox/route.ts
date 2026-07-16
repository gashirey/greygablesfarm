import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { listInboxItems } from "@/lib/admin/inbox";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const items = await listInboxItems(100);
    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load inquiries.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
