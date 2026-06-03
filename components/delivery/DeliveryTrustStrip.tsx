type TrustItem = {
  title: string;
  detail: string;
};

const DEFAULT_ITEMS: TrustItem[] = [
  {
    title: "Cut fresh daily",
    detail: "Stems cut the morning of your delivery",
  },
  {
    title: "Arranged by hand",
    detail: "Every arrangement made to order on the farm",
  },
  {
    title: "Same-day delivery",
    detail: "Order by 11AM, delivered by 7PM — confirmed by a real person",
  },
];

type DeliveryTrustStripProps = {
  items?: TrustItem[];
  variant?: "home" | "page";
};

export function DeliveryTrustStrip({
  items = DEFAULT_ITEMS,
  variant = "home",
}: DeliveryTrustStripProps) {
  const isPage = variant === "page";

  return (
    <section
      className={
        isPage
          ? "border-y border-parchment bg-cream py-12 md:py-16"
          : "border-b border-parchment bg-cream py-10 md:py-14"
      }
      aria-label="How delivery works"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <ul
          className={`grid gap-8 sm:grid-cols-3 ${isPage ? "sm:gap-10" : "sm:gap-6"}`}
        >
          {items.map((item) => (
            <li key={item.title} className="max-w-sm">
              <h2 className="type-section-title text-lg leading-snug text-bark md:text-xl">
                {item.title}
              </h2>
              <p className="type-page-body mt-2 text-sm leading-relaxed text-stone md:text-base">
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export const DELIVERY_PROMISE_ITEMS: TrustItem[] = [
  {
    title: "Cut fresh",
    detail:
      "Stems are harvested the morning of delivery — not sitting in a warehouse.",
  },
  {
    title: "Arranged by hand",
    detail: "Every order is made to order, not pulled from a cooler.",
  },
  {
    title: "Real contact",
    detail: "A human confirms your order within 2 hours, every time.",
  },
  {
    title: "Delivery promise",
    detail:
      "Order by 11AM for same-day delivery by 7PM. After 11AM, we deliver next day.",
  },
];
