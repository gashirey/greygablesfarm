import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { listOutsideVisitEvents } from "@/lib/campaigns/queries";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const visits = await listOutsideVisitEvents(250);
  return NextResponse.json({ visits });
}
