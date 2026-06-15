import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import {
  listCampaignsWithStats,
  listRecentVisitEvents,
} from "@/lib/campaigns/queries";
import {
  isCampaignSlug,
  isReservedCampaignSlug,
  normalizeCampaignSlug,
} from "@/lib/campaigns/slug";
import { createServiceClient } from "@/lib/supabase/server";

function normalizeDestination(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  return trimmed;
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const [campaigns, visits] = await Promise.all([
    listCampaignsWithStats(),
    listRecentVisitEvents(100),
  ]);

  return NextResponse.json({ campaigns, visits });
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slug = normalizeCampaignSlug(
    typeof body.slug === "string" ? body.slug : "",
  );
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const destination = normalizeDestination(
    typeof body.destination_url === "string" ? body.destination_url : "/",
  );

  if (!slug || !isCampaignSlug(slug)) {
    return NextResponse.json(
      { error: "Slug must be lowercase letters, numbers, hyphens, or underscores." },
      { status: 400 },
    );
  }
  if (isReservedCampaignSlug(slug)) {
    return NextResponse.json(
      { error: "That slug is reserved for an existing site route." },
      { status: 400 },
    );
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!destination) {
    return NextResponse.json(
      { error: "Destination must be a site path starting with /." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      slug,
      name,
      destination_url: destination,
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
      is_active: body.is_active !== false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ campaign: data });
}
