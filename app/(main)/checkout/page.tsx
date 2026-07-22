import { redirect } from "next/navigation";

/** Brief alias — checkout happens via /order/[product] review step. */
export default function CheckoutAliasPage() {
  redirect("/order");
}
