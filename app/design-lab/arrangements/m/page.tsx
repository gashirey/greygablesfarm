import { redirect } from "next/navigation";

/** Exploration folded into the live QR landing. */
export default function ArrangementMobileLabRedirect() {
  redirect("/found");
}
