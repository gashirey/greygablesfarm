import { redirect } from "next/navigation";

/** Designer's Choice self-service lives at /order */
export default function FlowersRedirectPage() {
  redirect("/order");
}
