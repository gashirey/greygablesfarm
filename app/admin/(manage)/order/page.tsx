import Link from "next/link";

const links = [
  {
    href: "/admin/order/orders",
    title: "Orders",
    body: "Search, filter, and advance fulfillment status.",
  },
  {
    href: "/admin/order/products",
    title: "Products",
    body: "Arrangements, prices, images, vessel requirement.",
  },
  {
    href: "/admin/order/vessels",
    title: "Vessels",
    body: "Inventory quantity and upcharges.",
  },
  {
    href: "/admin/order/zones",
    title: "Delivery zones",
    body: "ZIP codes and delivery fees.",
  },
  {
    href: "/admin/order/pickup",
    title: "Pickup & capacity",
    body: "Fulfillment dates, windows, and capacity.",
  },
];

export default function AdminOrderHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-bark">Self-service ordering</h1>
        <p className="mt-1 text-sm text-stone">
          Boutique flower checkout — products, vessels, zones, pickup, and
          orders.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="border border-parchment bg-white p-5 hover:border-bark/30"
          >
            <p className="font-medium text-bark">{l.title}</p>
            <p className="mt-1 text-sm text-stone">{l.body}</p>
          </Link>
        ))}
      </div>
      <p className="text-sm text-stone">
        Public flow:{" "}
        <Link href="/order" className="underline underline-offset-2">
          /order
        </Link>
      </p>
    </div>
  );
}
