import { redirect } from "next/navigation";

/** Legacy path — QR and campaigns use /found via /al */
export default function ArtfulLodgerRedirectPage() {
  redirect("/found");
}
