import { OutsideVisitsPanel } from "@/components/admin/OutsideVisitsPanel";
import { isCampaignsConfigured } from "@/lib/campaigns/queries";

export const dynamic = "force-dynamic";

export default function AdminOutsideVisitsPage() {
  if (!isCampaignsConfigured()) {
    return (
      <p className="text-sm text-stone">
        Configure Supabase env vars to view visit tracking.
      </p>
    );
  }

  return <OutsideVisitsPanel />;
}
