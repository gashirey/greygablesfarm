import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function ensureFulfillmentDate(
  supabase: ReturnType<typeof createServiceClient>,
  date: string,
  capacity: number,
) {
  const { data: existing } = await supabase
    .from("ss_fulfillment_dates")
    .select("id, max_capacity, is_active")
    .eq("fulfillment_date", date)
    .maybeSingle();

  if (!existing) {
    await supabase.from("ss_fulfillment_dates").insert({
      fulfillment_date: date,
      max_capacity: Math.max(capacity, 10),
      is_active: true,
    });
    return;
  }

  // Keep the day bookable without shrinking capacity set elsewhere
  const nextCapacity = Math.max(existing.max_capacity, capacity);
  if (!existing.is_active || nextCapacity > existing.max_capacity) {
    await supabase
      .from("ss_fulfillment_dates")
      .update({
        is_active: true,
        max_capacity: nextCapacity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  }
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured." },
      { status: 503 },
    );
  }

  const supabase = createServiceClient();
  const [locationsRes, slotsRes] = await Promise.all([
    supabase
      .from("ss_pickup_locations")
      .select("*")
      .order("name", { ascending: true }),
    supabase
      .from("ss_in_town_pickup_slots")
      .select("*, ss_pickup_locations(*)")
      .order("pickup_date", { ascending: true })
      .order("starts_at", { ascending: true })
      .limit(120),
  ]);

  if (locationsRes.error) {
    if (/ss_pickup_locations|schema cache|PGRST/i.test(locationsRes.error.message)) {
      return NextResponse.json({
        locations: [],
        slots: [],
        migrationRequired: true,
      });
    }
    return NextResponse.json(
      { error: locationsRes.error.message },
      { status: 400 },
    );
  }
  if (slotsRes.error) {
    return NextResponse.json({ error: slotsRes.error.message }, { status: 400 });
  }

  return NextResponse.json({
    locations: locationsRes.data ?? [],
    slots: slotsRes.data ?? [],
  });
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    action?: string;
    id?: string;
    name?: string;
    address_street?: string;
    address_line2?: string | null;
    address_city?: string;
    address_state?: string;
    address_zip?: string;
    notes?: string;
    is_active?: boolean;
    location_id?: string;
    pickup_date?: string;
    starts_at?: string;
    ends_at?: string;
    label?: string;
    capacity?: number;
  };

  const supabase = createServiceClient();
  const action = body.action?.trim();

  if (action === "upsert_location") {
    const name = body.name?.trim();
    const street = body.address_street?.trim();
    const city = body.address_city?.trim();
    const zip = (body.address_zip ?? "").replace(/\D/g, "").slice(0, 5);
    if (!name || !street || !city || zip.length !== 5) {
      return NextResponse.json(
        { error: "Name, street, city, and 5-digit ZIP are required." },
        { status: 400 },
      );
    }

    const row = {
      name,
      address_street: street,
      address_line2: body.address_line2?.trim() || null,
      address_city: city,
      address_state: (body.address_state?.trim() || "VA").slice(0, 2).toUpperCase(),
      address_zip: zip,
      notes: body.notes?.trim() ?? "",
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    const result = body.id
      ? await supabase
          .from("ss_pickup_locations")
          .update(row)
          .eq("id", body.id)
          .select()
          .single()
      : await supabase.from("ss_pickup_locations").insert(row).select().single();

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    revalidatePath("/order");
    return NextResponse.json({ location: result.data });
  }

  if (action === "upsert_slot") {
    const locationId = body.location_id?.trim();
    const pickupDate = body.pickup_date?.trim();
    const startsAt = body.starts_at?.trim();
    const endsAt = body.ends_at?.trim();
    const capacity = Number(body.capacity) || 10;
    if (!locationId || !pickupDate || !startsAt || !endsAt) {
      return NextResponse.json(
        { error: "Location, date, start, and end time are required." },
        { status: 400 },
      );
    }
    if (endsAt <= startsAt) {
      return NextResponse.json(
        { error: "End time must be after start time." },
        { status: 400 },
      );
    }

    // Keep day capacity calendar in sync so reservations can hold inventory
    await ensureFulfillmentDate(supabase, pickupDate, capacity);

    const row = {
      location_id: locationId,
      pickup_date: pickupDate,
      starts_at: startsAt,
      ends_at: endsAt,
      label: body.label?.trim() ?? "",
      capacity,
      is_active: body.is_active !== false,
      notes: body.notes?.trim() ?? "",
      updated_at: new Date().toISOString(),
    };

    const result = body.id
      ? await supabase
          .from("ss_in_town_pickup_slots")
          .update(row)
          .eq("id", body.id)
          .select("*, ss_pickup_locations(*)")
          .single()
      : await supabase
          .from("ss_in_town_pickup_slots")
          .insert(row)
          .select("*, ss_pickup_locations(*)")
          .single();

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    revalidatePath("/order");
    return NextResponse.json({ slot: result.data });
  }

  if (action === "toggle_location" && body.id) {
    const { data: existing } = await supabase
      .from("ss_pickup_locations")
      .select("is_active")
      .eq("id", body.id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Location not found." }, { status: 404 });
    }
    const { data, error } = await supabase
      .from("ss_pickup_locations")
      .update({
        is_active: !existing.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    revalidatePath("/order");
    return NextResponse.json({ location: data });
  }

  if (action === "toggle_slot" && body.id) {
    const { data: existing } = await supabase
      .from("ss_in_town_pickup_slots")
      .select("is_active")
      .eq("id", body.id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Slot not found." }, { status: 404 });
    }
    const { data, error } = await supabase
      .from("ss_in_town_pickup_slots")
      .update({
        is_active: !existing.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select("*, ss_pickup_locations(*)")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    revalidatePath("/order");
    return NextResponse.json({ slot: data });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
