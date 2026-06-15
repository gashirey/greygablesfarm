import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import {
  isCampaignSlug,
  isReservedCampaignSlug,
  normalizeCampaignSlug,
} from "@/lib/campaigns/slug";
import { createServiceClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

function normalizeDestination(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  return trimmed;
}

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.slug === "string") {
    const slug = normalizeCampaignSlug(body.slug);
    if (!isCampaignSlug(slug)) {
      return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
    }
    if (isReservedCampaignSlug(slug)) {
      return NextResponse.json({ error: "Reserved slug." }, { status: 400 });
    }
    updates.slug = slug;
  }

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    updates.name = name;
  }

  if (typeof body.destination_url === "string") {
    const destination = normalizeDestination(body.destination_url);
    if (!destination) {
      return NextResponse.json({ error: "Invalid destination." }, { status: 400 });
    }
    updates.destination_url = destination;
  }

  if (typeof body.notes === "string") {
    updates.notes = body.notes.trim() || null;
  }
  if (body.notes === null) updates.notes = null;

  if (typeof body.is_active === "boolean") {
    updates.is_active = body.is_active;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("campaigns")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ campaign: data });
}

export async function DELETE(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
