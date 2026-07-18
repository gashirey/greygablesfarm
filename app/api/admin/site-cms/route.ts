import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { createServiceClient } from "@/lib/supabase/server";
import { isValidDirectionId } from "@/lib/design-lab/directions";
import {
  getSiteNavItemsRaw,
  getSiteSettingsLoad,
} from "@/lib/site-cms/queries";
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

const MIGRATION_022_HINT =
  " Run migration 022_hero_slide_interval.sql in the Supabase SQL Editor, then try again.";

function buildSettingsUpsert(
  next: SiteSettingsRow,
  includeHeroSlideInterval: boolean,
) {
  const payload: Record<string, unknown> = {
    id: "default",
    direction_id: next.direction_id,
    hero_layout: next.hero_layout,
    hero_frame: next.hero_frame,
    color_overrides: next.color_overrides,
    content_overrides: next.content_overrides,
    typography_overrides: next.typography_overrides,
    updated_at: new Date().toISOString(),
  };
  if (includeHeroSlideInterval) {
    payload.hero_slide_interval_ms = next.hero_slide_interval_ms;
  }
  return payload;
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const [{ settings, hasHeroSlideIntervalColumn }, nav] = await Promise.all([
    getSiteSettingsLoad(),
    getSiteNavItemsRaw(),
  ]);

  return NextResponse.json({
    settings,
    nav,
    hasHeroSlideIntervalColumn,
  });
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

  const { settings: current, hasHeroSlideIntervalColumn } =
    await getSiteSettingsLoad();
  const next: SiteSettingsRow = { ...current };
  const updatingSlideInterval = body.hero_slide_interval_ms != null;

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

  if (updatingSlideInterval) {
    const ms = Number(body.hero_slide_interval_ms);
    if (!Number.isFinite(ms) || ms < 3000 || ms > 60000) {
      return NextResponse.json(
        { error: "Slideshow speed must be between 3 and 60 seconds." },
        { status: 400 },
      );
    }
    if (!hasHeroSlideIntervalColumn) {
      return NextResponse.json(
        {
          error: `Slideshow speed needs a database update.${MIGRATION_022_HINT}`,
        },
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
  // Omit hero_slide_interval_ms until migration 022 is applied so wording /
  // colors / layout saves are not blocked by the missing column.
  const includeHeroSlideInterval =
    hasHeroSlideIntervalColumn || updatingSlideInterval;
  let { data, error } = await supabase
    .from("site_settings")
    .upsert(buildSettingsUpsert(next, includeHeroSlideInterval))
    .select()
    .single();

  if (
    error &&
    includeHeroSlideInterval &&
    !updatingSlideInterval &&
    (error.code === "PGRST204" || /hero_slide_interval/i.test(error.message))
  ) {
    const retry = await supabase
      .from("site_settings")
      .upsert(buildSettingsUpsert(next, false))
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    const hint =
      error.code === "PGRST204" ||
      error.code === "PGRST205" ||
      /hero_slide_interval|column/i.test(error.message)
        ? MIGRATION_022_HINT
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

  return NextResponse.json({
    settings: {
      ...next,
      ...(data as SiteSettingsRow),
      // Keep client-facing defaults when the column is not in the DB yet.
      hero_slide_interval_ms:
        (data as SiteSettingsRow | null)?.hero_slide_interval_ms ??
        next.hero_slide_interval_ms,
    },
  });
}
