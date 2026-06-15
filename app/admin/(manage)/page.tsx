import Link from "next/link";
import { todayFarmDate, formatDisplayDate } from "@/lib/inventory/date";

export default function AdminDashboardPage() {
  const today = todayFarmDate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-bark">Dashboard</h1>
        <p className="mt-1 text-sm text-stone">{formatDisplayDate(today)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/availability"
          className="border border-parchment bg-white p-5 hover:border-bark/30"
        >
          <p className="font-medium text-bark">Today&apos;s listings</p>
          <p className="mt-1 text-sm text-stone">
            Update quantity, price, and status for what&apos;s available now.
          </p>
        </Link>
        <Link
          href="/admin/media"
          className="border border-parchment bg-white p-5 hover:border-bark/30"
        >
          <p className="font-medium text-bark">Media library</p>
          <p className="mt-1 text-sm text-stone">
            Bulk upload a shoot and assign images to the site or products.
          </p>
        </Link>
        <Link
          href="/admin/social"
          className="border border-parchment bg-white p-5 hover:border-bark/30"
        >
          <p className="font-medium text-bark">Social (phone)</p>
          <p className="mt-1 text-sm text-stone">
            Save images and copy captions for Instagram from your library.
          </p>
        </Link>
        <Link
          href="/admin/site"
          className="border border-parchment bg-white p-5 hover:border-bark/30"
        >
          <p className="font-medium text-bark">Site editor</p>
          <p className="mt-1 text-sm text-stone">
            Colors, menu, copy, images, and photo framing — no code changes.
          </p>
        </Link>
        <Link
          href="/admin/campaigns"
          className="border border-parchment bg-white p-5 hover:border-bark/30"
        >
          <p className="font-medium text-bark">Campaigns &amp; QR</p>
          <p className="mt-1 text-sm text-stone">
            Short links, scan counts, and visit logs for attributed traffic.
          </p>
        </Link>
        <Link
          href="/admin/products"
          className="border border-parchment bg-white p-5 hover:border-bark/30"
        >
          <p className="font-medium text-bark">Products</p>
          <p className="mt-1 text-sm text-stone">
            Manage catalog items, photos, and descriptions.
          </p>
        </Link>
        <Link
          href="/admin/availability/new"
          className="border border-parchment bg-white p-5 hover:border-bark/30"
        >
          <p className="font-medium text-bark">Add listing</p>
          <p className="mt-1 text-sm text-stone">
            List a product for today with price and quantity.
          </p>
        </Link>
        <Link
          href="/available-now"
          className="border border-parchment bg-white p-5 hover:border-bark/30"
        >
          <p className="font-medium text-bark">Public page</p>
          <p className="mt-1 text-sm text-stone">Preview what visitors see.</p>
        </Link>
      </div>
    </div>
  );
}
