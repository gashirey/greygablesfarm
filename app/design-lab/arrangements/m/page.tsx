import { redirect } from "next/navigation";

/** Phone-first variants now live on the main site with full nav. */
export default function ArrangementMobileLabRedirect() {
  redirect("/found");
}
