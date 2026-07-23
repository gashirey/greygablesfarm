import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { listExperiences } from "@/lib/surge/business-api";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const result = await listExperiences();
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, preview: result.preview },
      { status: result.status },
    );
  }

  return NextResponse.json({
    experiences: result.data.experiences,
    preview: result.preview,
  });
}
