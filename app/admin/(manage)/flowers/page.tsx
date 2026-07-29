import { redirect } from "next/navigation";

/** Legacy flower_tiers admin → self-service order products */
export default function AdminFlowersRedirectPage() {
  redirect("/admin/order/products");
}
