import { SsProductsManager } from "@/components/admin/SsProductsManager";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminOrderProductsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-sm text-bark">Configure Supabase to manage products.</p>
    );
  }
  return <SsProductsManager />;
}
