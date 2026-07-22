import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }
  const supabase = createServiceClient();
  const { data: dates, error } = await supabase
    .from("ss_fulfillment_dates")
    .select("*, ss_pickup_windows(*)")
    .order("fulfillment_date", { ascending: true })
    .limit(60);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ dates: dates ?? [] });
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = (await request.json()) as {
    fulfillment_date?: string;
    max_capacity?: number;
    is_active?: boolean;
    windows?: Array<{
      label: string;
      starts_at: string;
      ends_at: string;
      capacity: number;
    }>;
  };

  const date = body.fulfillment_date?.trim();
  if (!date) {
    return NextResponse.json({ error: "Date required." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("ss_fulfillment_dates")
    .upsert(
      {
        fulfillment_date: date,
        max_capacity: Number(body.max_capacity) || 10,
        is_active: body.is_active !== false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "fulfillment_date" },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (body.windows?.length) {
    await supabase
      .from("ss_pickup_windows")
      .delete()
      .eq("fulfillment_date_id", row.id);
    await supabase.from("ss_pickup_windows").insert(
      body.windows.map((w) => ({
        fulfillment_date_id: row.id,
        label: w.label,
        starts_at: w.starts_at,
        ends_at: w.ends_at,
        capacity: w.capacity,
        is_active: true,
      })),
    );
  }

  revalidatePath("/order");
  return NextResponse.json({ date: row });
}
