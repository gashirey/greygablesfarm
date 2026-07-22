import { SsPickupManager } from "@/components/admin/SsPickupManager";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminOrderPickupPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-sm text-bark">Configure Supabase to manage pickup.</p>
    );
  }
  return <SsPickupManager />;
}
