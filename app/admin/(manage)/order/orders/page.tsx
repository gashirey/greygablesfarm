import { SsOrdersManager } from "@/components/admin/SsOrdersManager";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminSsOrdersPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-sm text-bark">Configure Supabase to view orders.</p>
    );
  }
  return <SsOrdersManager />;
}
