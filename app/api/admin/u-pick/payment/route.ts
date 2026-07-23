import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import {
  createPaymentConnectLink,
  getPaymentProfile,
} from "@/lib/surge/business-api";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const result = await getPaymentProfile();
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, preview: result.preview },
      { status: result.status },
    );
  }

  return NextResponse.json({
    payment: result.data.payment,
    preview: result.preview,
  });
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const result = await createPaymentConnectLink();
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, preview: result.preview },
      { status: result.status },
    );
  }

  return NextResponse.json({ url: result.data.url, preview: result.preview });
}
