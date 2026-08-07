import Link from "next/link";
import { todayFarmDate, formatDisplayDate } from "@/lib/inventory/date";

type HubLink = {
  href: string;
  label: string;
  note?: string;
  external?: boolean;
};

type HubSection = {
  id: string;
  title: string;
  summary: string;
  links: HubLink[];
};

const sections: HubSection[] = [
  {
    id: "today",
    title: "Operate today",
    summary: "What needs attention right now.",
    links: [
      {
        href: "/admin/availability",
        label: "Today's listings",
        note: "Quantity, price, status",
      },
      {
        href: "/admin/availability/new",
        label: "Add listing",
        note: "List a product for today",
      },
      {
        href: "/admin/order/orders",
        label: "Paid orders",
        note: "Fulfillment status",
      },
      {
        href: "/admin/inquiries",
        label: "Inquiries",
        note: "Contact & booking forms",
      },
    ],
  },
  {
    id: "ordering",
    title: "Self-service ordering",
    summary: "Boutique checkout catalog and capacity.",
    links: [
      {
        href: "/admin/order",
        label: "Ordering hub",
        note: "All ordering tools",
      },
      {
        href: "/admin/order/products",
        label: "Order products",
        note: "Arrangements & prices",
      },
      {
        href: "/admin/order/vessels",
        label: "Vessels",
        note: "Inventory & upcharges",
      },
      {
        href: "/admin/order/zones",
        label: "Delivery zones",
        note: "ZIPs & fees",
      },
      {
        href: "/admin/order/pickup",
        label: "Pickup & capacity",
        note: "Dates and windows",
      },
      {
        href: "/admin/order/in-town",
        label: "In Town pickup",
        note: "Scheduled locations",
      },
      {
        href: "/order",
        label: "Public checkout",
        note: "/order",
        external: true,
      },
    ],
  },
  {
    id: "catalog",
    title: "Catalog",
    summary: "Products and legacy flower tiers.",
    links: [
      {
        href: "/admin/products",
        label: "Products",
        note: "Farm catalog & photos",
      },
      {
        href: "/admin/products/new",
        label: "New product",
      },
      {
        href: "/admin/flowers",
        label: "Flowers (legacy)",
        note: "Designer's Choice tiers",
      },
    ],
  },
  {
    id: "experiences",
    title: "Experiences & events",
    summary: "U-Pick nights and farm events.",
    links: [
      {
        href: "/admin/u-pick",
        label: "U-Pick",
        note: "Capacity, times, copy",
      },
      {
        href: "/admin/events",
        label: "Events",
        note: "Create and edit events",
      },
      {
        href: "/events",
        label: "Public events",
        note: "/events",
        external: true,
      },
    ],
  },
  {
    id: "content",
    title: "Site & content",
    summary: "Look, wording, media, and social.",
    links: [
      {
        href: "/admin/site",
        label: "Site editor",
        note: "Colors, menu, copy, images",
      },
      {
        href: "/admin/media",
        label: "Media library",
        note: "Shoots & assignments",
      },
      {
        href: "/admin/social",
        label: "Social",
        note: "Instagram from library",
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing & traffic",
    summary: "Attribution, QR, and visit logs.",
    links: [
      {
        href: "/admin/campaigns",
        label: "Campaigns & QR",
        note: "Short links & scans",
      },
      {
        href: "/admin/visits",
        label: "Traffic",
        note: "Attributed visits",
      },
      {
        href: "/found",
        label: "QR landing",
        note: "/found",
        external: true,
      },
    ],
  },
  {
    id: "public",
    title: "Public site map",
    summary: "Open live pages to check what visitors see.",
    links: [
      { href: "/", label: "Home" },
      { href: "/available-now", label: "Available now" },
      { href: "/order", label: "Order / send flowers" },
      { href: "/send-flowers", label: "Send flowers" },
      { href: "/flowers", label: "Flowers (legacy page)" },
      { href: "/events", label: "Events" },
      { href: "/weddings", label: "Weddings" },
      { href: "/photos-in-the-blooms", label: "Photos in the Blooms" },
      { href: "/gallery", label: "Gallery" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/artful-lodger", label: "Artful Lodger" },
      { href: "/found", label: "Found" },
    ],
  },
];

function LinkRow({ link }: { link: HubLink }) {
  return (
    <Link
      href={link.href}
      className="group flex items-baseline justify-between gap-3 border-b border-parchment py-2.5 last:border-b-0 hover:border-bark/20"
      {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <span className="text-sm text-bark underline-offset-2 group-hover:underline">
        {link.label}
      </span>
      {link.note ? (
        <span className="shrink-0 text-xs text-stone">{link.note}</span>
      ) : null}
    </Link>
  );
}

export default function Admin2Page() {
  const today = todayFarmDate();

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-parchment pb-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone">
            Farm manage
          </p>
          <h1 className="mt-1 font-serif text-2xl text-bark">Admin index</h1>
          <p className="mt-1 text-sm text-stone">
            {formatDisplayDate(today)} — tools by job, plus the public site map.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="underline-offset-2 hover:text-bark hover:underline"
            >
              {s.title}
            </a>
          ))}
        </nav>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-6 border border-parchment bg-white p-5"
          >
            <h2 className="font-serif text-lg text-bark">{section.title}</h2>
            <p className="mt-1 text-sm text-stone">{section.summary}</p>
            <div className="mt-4">
              {section.links.map((link) => (
                <LinkRow key={`${section.id}-${link.href}-${link.label}`} link={link} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="text-sm text-stone">
        Prefer the older card dashboard?{" "}
        <Link href="/admin" className="underline underline-offset-2">
          Open classic dashboard
        </Link>
      </p>
    </div>
  );
}
