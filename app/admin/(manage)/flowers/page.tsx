import { FlowerTiersManager } from "@/components/admin/FlowerTiersManager";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminFlowersPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-sm text-bark">
        Configure Supabase env vars to manage the flowers catalog.
      </p>
    );
  }

  return <FlowerTiersManager />;
}
