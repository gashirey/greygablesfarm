import { SsZonesManager } from "@/components/admin/SsZonesManager";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminOrderZonesPage() {
  if (!isSupabaseConfigured()) {
    return <p className="text-sm text-bark">Configure Supabase to manage zones.</p>;
  }
  return <SsZonesManager />;
}
