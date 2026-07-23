import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { getExperience, patchExperience } from "@/lib/surge/business-api";
import { parseExperiencePatch } from "@/lib/surge/parse-experience-patch";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const result = await getExperience(id);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, preview: result.preview },
      { status: result.status },
    );
  }

  return NextResponse.json({
    experience: result.data.experience,
    preview: result.preview,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const patch = parseExperiencePatch(body);

  const result = await patchExperience(id, patch);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, preview: result.preview },
      { status: result.status },
    );
  }

  return NextResponse.json({
    experience: result.data.experience,
    preview: result.preview,
  });
}
