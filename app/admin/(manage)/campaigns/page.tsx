import { CampaignsManager } from "@/components/admin/CampaignsManager";
import { isCampaignsConfigured } from "@/lib/campaigns/queries";

export const dynamic = "force-dynamic";

export default function AdminCampaignsPage() {
  if (!isCampaignsConfigured()) {
    return (
      <p className="text-sm text-stone">
        Configure Supabase env vars to manage campaigns and visit tracking.
      </p>
    );
  }

  return <CampaignsManager />;
}
