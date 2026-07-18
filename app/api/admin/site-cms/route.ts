import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { createServiceClient } from "@/lib/supabase/server";
import { isValidDirectionId } from "@/lib/design-lab/directions";
import { getSiteNavItemsRaw, getSiteSettingsRow } from "@/lib/site-cms/queries";
import type {
  SiteColorOverrides,
  SiteContentOverrides,
  SiteSettingsRow,
  TypographyOverrides,
} from "@/lib/site-cms/types";

const HERO_LAYOUTS = new Set([
  "immersive",
  "split",
  "grounded",
  "standard",
]);
const HERO_FRAMES = new Set(["bleed", "inset"]);

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const [settings, nav] = await Promise.all([
    getSiteSettingsRow(),
    getSiteNavItemsRaw(),
  ]);

  return NextResponse.json({ settings, nav });
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const body = (await request.json()) as Partial<{
    direction_id: string;
    hero_layout: string;
    hero_frame: string;
    hero_slide_interval_ms: number;
    color_overrides: SiteColorOverrides;
    content_overrides: SiteContentOverrides;
    typography_overrides: TypographyOverrides;
  }>;

  const current = await getSiteSettingsRow();
  const next: SiteSettingsRow = { ...current };

  if (body.direction_id != null) {
    if (!isValidDirectionId(body.direction_id)) {
      return NextResponse.json({ error: "Invalid direction_id." }, { status: 400 });
    }
    next.direction_id = body.direction_id;
  }

  if (body.hero_layout != null) {
    if (!HERO_LAYOUTS.has(body.hero_layout)) {
      return NextResponse.json({ error: "Invalid hero_layout." }, { status: 400 });
    }
    next.hero_layout = body.hero_layout as SiteSettingsRow["hero_layout"];
  }

  if (body.hero_frame != null) {
    if (!HERO_FRAMES.has(body.hero_frame)) {
      return NextResponse.json({ error: "Invalid hero_frame." }, { status: 400 });
    }
    next.hero_frame = body.hero_frame as SiteSettingsRow["hero_frame"];
  }

  if (body.hero_slide_interval_ms != null) {
    const ms = Number(body.hero_slide_interval_ms);
    if (!Number.isFinite(ms) || ms < 3000 || ms > 60000) {
      return NextResponse.json(
        { error: "Slideshow speed must be between 3 and 60 seconds." },
        { status: 400 },
      );
    }
    next.hero_slide_interval_ms = Math.round(ms);
  }

  if (body.color_overrides != null) {
    next.color_overrides = body.color_overrides;
  }

  if (body.content_overrides != null) {
    next.content_overrides = body.content_overrides;
  }

  if (body.typography_overrides != null) {
    next.typography_overrides = body.typography_overrides;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("site_settings")
    .upsert({
      id: "default",
      direction_id: next.direction_id,
      hero_layout: next.hero_layout,
      hero_frame: next.hero_frame,
      hero_slide_interval_ms: next.hero_slide_interval_ms,
      color_overrides: next.color_overrides,
      content_overrides: next.content_overrides,
      typography_overrides: next.typography_overrides,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    const hint =
      error.code === "PGRST205" || /hero_slide_interval|column/i.test(error.message)
        ? " Run migrations 012_site_cms.sql, 013_site_typography.sql, and 022_hero_slide_interval.sql in Supabase."
        : "";
    return NextResponse.json(
      { error: `${error.message}${hint}` },
      { status: 400 },
    );
  }

  revalidatePath("/", "layout");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/available-now");

  return NextResponse.json({ settings: data });
}
