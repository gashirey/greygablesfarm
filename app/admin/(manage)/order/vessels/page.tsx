import { SsVesselsManager } from "@/components/admin/SsVesselsManager";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminOrderVesselsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-sm text-bark">Configure Supabase to manage vessels.</p>
    );
  }
  return <SsVesselsManager />;
}
