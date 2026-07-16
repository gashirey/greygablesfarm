import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/lib/content";
import type { ArrangementPassId } from "@/lib/design-lab/arrangement-passes";

function InquireForm({
  passId,
  placeholder,
}: {
  passId: ArrangementPassId;
  placeholder?: string;
}) {
  return (
    <Suspense fallback={<div className="card h-80 bg-cream" aria-hidden />}>
      <ContactForm
        defaultSubject="flowers"
        source={`campaign_found_${passId}`}
        contextNote={`Found us — pass ${passId.toUpperCase()}`}
        messagePlaceholder={
          placeholder ??
          "Where did you see our arrangements? Home, business, or event — and what you’re hoping for…"
        }
      />
    </Suspense>
  );
}

/** A — Soft ask: familiar compact hero + three offerings + muted form */
export function ArrangementPassA() {
  return (
    <div className="bg-cream text-bark">
      <section className="relative min-h-[42vh] overflow-hidden bg-parchment">
        <Image
          src="/images/bb.jpg"
          alt="Hand-tied arrangement from Grey Gables Farm"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-bark/40" aria-hidden />
        <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-6 pb-14 pt-24 lg:px-10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/75">
            Grey Gables Farm
          </p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl font-medium leading-tight text-white md:text-5xl">
            Saw our flowers somewhere?
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/85">
            We grow them on our Louisa County farm and arrange them by hand —
            for homes, businesses, and events across Central Virginia.
          </p>
          <a
            href="#inquire"
            className="btn mt-8 w-fit border-white bg-white text-bark hover:bg-cream"
          >
            Tell us what you need
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10 lg:py-20">
        <p className="type-eyebrow">Custom arrangements</p>
        <h2 className="type-section-title mt-2 max-w-xl text-3xl">
          The same flowers. For your space.
        </h2>
        <p className="mt-4 max-w-xl text-stone leading-relaxed">
          Whether you spotted a piece at a shop, an opening, a table, or a
          friend&apos;s house — we can make something for you.
        </p>
        <ul className="mt-12 grid gap-8 sm:grid-cols-3">
          {[
            {
              t: "Home",
              b: "One-time or standing orders for the rooms you live in.",
            },
            {
              t: "Business",
              b: "Reception, retail, and dining — fresh stems that feel local.",
            },
            {
              t: "Events",
              b: "Gatherings large and small, grown and designed on the farm.",
            },
          ].map((item) => (
            <li key={item.t} className="border-t border-parchment pt-5">
              <h3 className="font-serif text-xl">{item.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone">{item.b}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="inquire" className="border-y border-parchment bg-salmon-light/60 px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <p className="type-eyebrow">Inquire</p>
            <h2 className="type-section-title mt-2 text-3xl">
              We&apos;d love to hear from you
            </h2>
            <p className="mt-3 text-stone leading-relaxed">
              No charge until we&apos;ve spoken. Leave a note and we&apos;ll follow up.
            </p>
            <div className="mt-8">
              <InquireForm passId="a" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** B — Split editorial: photo | copy, no scrim hero */
export function ArrangementPassB() {
  return (
    <div className="bg-[#f7f4f0] text-bark">
      <div className="mx-auto grid min-h-[85vh] max-w-6xl lg:grid-cols-2">
        <div className="relative min-h-[50vh] lg:min-h-full">
          <Image
            src="/images/bb.jpg"
            alt="Seasonal farm arrangement"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div className="flex flex-col justify-center px-8 py-16 md:px-14 lg:py-20">
          <p className="text-xs uppercase tracking-[0.22em] text-stone">
            Grey Gables · Louisa
          </p>
          <h1 className="mt-6 font-serif text-4xl font-medium leading-[1.15] md:text-5xl">
            You found the flowers.
            <br />
            <span className="text-stone">Here&apos;s the farm.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-stone">
            Grey Gables grows seasonal blooms and builds arrangements by hand.
            If something caught your eye out in the world, we can grow a version
            for your home, your business, or your next gathering.
          </p>
          <div className="mt-10 space-y-4 border-t border-[#e4ddd4] pt-8 text-sm">
            <p className="text-bark">
              <span className="font-medium">Homes</span>
              <span className="text-stone"> — living rooms, tables, weekly stems</span>
            </p>
            <p className="text-bark">
              <span className="font-medium">Business</span>
              <span className="text-stone"> — desks, floors, dining rooms</span>
            </p>
            <p className="text-bark">
              <span className="font-medium">Events</span>
              <span className="text-stone"> — centerpieces to full installs</span>
            </p>
          </div>
          <a
            href="#inquire"
            className="mt-10 inline-block text-sm text-bark underline underline-offset-4 decoration-[#e4ddd4] hover:text-salmon-dark"
          >
            Request a custom arrangement →
          </a>
        </div>
      </div>

      <section
        id="inquire"
        className="border-t border-[#e4ddd4] bg-white px-8 py-16 md:px-14"
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="font-serif text-3xl">A short note is enough</h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone">
              Tell us where you saw the work, what space you have in mind, and
              any dates that matter. We&apos;ll reply within a few days.
            </p>
            <p className="mt-8 text-sm text-stone">
              Or email{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-bark underline underline-offset-2"
              >
                {site.email}
              </a>
            </p>
          </div>
          <div className="max-w-md">
            <InquireForm
              passId="b"
              placeholder="Where you saw us, and what you’re imagining…"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

/** C — Letter: typographic, image as quiet footnote */
export function ArrangementPassC() {
  return (
    <div className="bg-[#faf8f5] text-bark">
      <article className="mx-auto max-w-2xl px-6 py-20 md:py-28 lg:px-0">
        <p className="text-sm text-stone">Grey Gables Farm</p>
        <h1 className="mt-10 font-serif text-4xl font-medium leading-snug md:text-[2.75rem]">
          If you saw our arrangements and wondered who made them —
        </h1>
        <div className="mt-10 space-y-6 text-lg leading-relaxed text-stone">
          <p>
            We&apos;re a small flower farm on Brickhouse Road in Louisa County.
            The stems are cut here. The arrangements are built here. Nothing
            arrives from a warehouse cooler.
          </p>
          <p>
            People usually find us sideways — on a shop counter, at an opening,
            on someone&apos;s table. If that was you, we&apos;d be glad to make
            something for your place next.
          </p>
          <p>
            Homes. Businesses. Events. Seasonal, local, and made to the space
            you have.
          </p>
        </div>

        <figure className="mt-14">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src="/images/garden_row.jpg"
              alt="Flower rows at Grey Gables Farm"
              fill
              className="object-cover"
              sizes="(max-width: 672px) 100vw, 672px"
            />
          </div>
          <figcaption className="mt-3 text-xs text-stone">
            The field that feeds the arrangements.
          </figcaption>
        </figure>

        <div id="inquire" className="mt-16 border-t border-parchment pt-12">
          <h2 className="font-serif text-2xl">Write back</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone">
            A few sentences are plenty. We&apos;ll take it from there.
          </p>
          <div className="mt-8">
            <InquireForm
              passId="c"
              placeholder="A few sentences about what you need…"
            />
          </div>
        </div>
      </article>
    </div>
  );
}

/** D — Three doors: field band + big path rows */
export function ArrangementPassD() {
  const doors = [
    {
      href: "#inquire",
      label: "For your home",
      detail: "Standing or one-time arrangements for the rooms you live in.",
    },
    {
      href: "#inquire",
      label: "For your business",
      detail: "Reception, retail, restaurants — stems that feel grown nearby.",
    },
    {
      href: "#inquire",
      label: "For an event",
      detail: "Intimate dinners through larger celebrations.",
    },
  ] as const;

  return (
    <div className="bg-cream text-bark">
      <section className="relative overflow-hidden">
        <div className="relative h-[28vh] min-h-[180px] md:h-[32vh]">
          <Image
            src="/images/garden_row.jpg"
            alt="Cutting garden at Grey Gables"
            fill
            priority
            className="object-cover object-[center_40%]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-bark/25" aria-hidden />
        </div>
        <div className="mx-auto max-w-3xl px-6 py-12 text-center lg:px-10">
          <p className="text-xs uppercase tracking-[0.2em] text-sage-dark">
            Wherever you found us
          </p>
          <h1 className="mt-4 font-serif text-3xl font-medium leading-tight md:text-4xl">
            Custom arrangements from the farm
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-stone leading-relaxed">
            You saw the work. Choose how you want to use it — we&apos;ll grow and
            arrange to fit.
          </p>
        </div>
      </section>

      <section className="border-y border-parchment bg-sage-light/40">
        <ul className="mx-auto max-w-3xl divide-y divide-parchment">
          {doors.map((door) => (
            <li key={door.label}>
              <a
                href={door.href}
                className="flex flex-col gap-1 px-6 py-8 transition-colors hover:bg-cream/80 md:flex-row md:items-baseline md:justify-between md:gap-8"
              >
                <span className="font-serif text-2xl text-bark">{door.label}</span>
                <span className="max-w-sm text-sm text-stone md:text-right">
                  {door.detail}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section id="inquire" className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
        <h2 className="font-serif text-2xl">Start here</h2>
        <p className="mt-2 text-sm text-stone">
          Mention home, business, or event in your note so we know which door
          you meant.
        </p>
        <div className="mt-8 max-w-xl">
          <InquireForm
            passId="d"
            placeholder="Home, business, or event? Dates and style notes welcome…"
          />
        </div>
      </section>
    </div>
  );
}

/** E — Arrangement first: huge image, short copy, form early */
export function ArrangementPassE() {
  return (
    <div className="bg-bark text-cream">
      <section className="relative min-h-[72vh] md:min-h-[78vh]">
        <Image
          src="/images/bb.jpg"
          alt="Grey Gables farm arrangement"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-bark/50" aria-hidden />
        <div className="relative mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-end px-6 pb-16 pt-28 md:min-h-[78vh] lg:px-10">
          <p className="text-xs uppercase tracking-[0.25em] text-cream/70">
            Grey Gables Farm
          </p>
          <h1 className="mt-4 max-w-xl font-serif text-4xl font-medium leading-tight text-white md:text-6xl">
            Make it yours.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-cream/85">
            Saw an arrangement of ours out in the world? We grow custom pieces
            for homes, businesses, and events — from the same fields.
          </p>
        </div>
      </section>

      <section
        id="inquire"
        className="grid gap-0 lg:grid-cols-[1fr_minmax(0,26rem)]"
      >
        <div className="border-t border-white/10 px-6 py-14 lg:border-t-0 lg:border-r lg:px-10 lg:py-16">
          <h2 className="font-serif text-2xl text-white md:text-3xl">
            Request yours
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/70">
            Tell us the space and the season. We&apos;ll confirm details before
            anything is charged.
          </p>
          <ul className="mt-10 space-y-3 text-sm text-cream/80">
            <li className="flex gap-3">
              <span className="mt-2 h-px w-4 shrink-0 bg-salmon" aria-hidden />
              Homes — weekly or once
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-px w-4 shrink-0 bg-salmon" aria-hidden />
              Business — desks to dining
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-px w-4 shrink-0 bg-salmon" aria-hidden />
              Events — intimate to full
            </li>
          </ul>
          <p className="mt-12 text-xs text-cream/50">
            Prefer email?{" "}
            <a
              href={`mailto:${site.email}`}
              className="text-cream/80 underline underline-offset-2 hover:text-white"
            >
              {site.email}
            </a>
          </p>
        </div>
        <div className="bg-cream px-6 py-14 text-bark lg:px-8 lg:py-16">
          <InquireForm
            passId="e"
            placeholder="What you saw, what you need, and when…"
          />
        </div>
      </section>

      <p className="border-t border-white/10 px-6 py-6 text-center text-xs text-cream/40 lg:px-10">
        Louisa County · Central Virginia ·{" "}
        <Link href="/" className="hover:text-cream/70">
          greygablesfarm.com
        </Link>
      </p>
    </div>
  );
}

export const arrangementPassComponents = {
  a: ArrangementPassA,
  b: ArrangementPassB,
  c: ArrangementPassC,
  d: ArrangementPassD,
  e: ArrangementPassE,
} as const;
