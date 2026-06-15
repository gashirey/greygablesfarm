import { site } from "@/lib/content";
import { googleMapsUrl } from "@/lib/location";

type LocationBlockProps = {
  showVisitNote?: boolean;
  className?: string;
  variant?: "default" | "light";
};

export function LocationBlock({
  showVisitNote = true,
  className = "",
  variant = "default",
}: LocationBlockProps) {
  const { street, city, state } = site.address;
  const light = variant === "light";

  return (
    <div className={className}>
      <h2
        className={`font-serif text-2xl ${light ? "text-white" : "text-bark"}`}
      >
        Location
      </h2>
      <address
        className={`mt-4 not-italic text-base leading-relaxed ${light ? "text-white/85" : "text-stone"}`}
      >
        <span className={`block ${light ? "text-white" : "text-bark"}`}>
          {street}
        </span>
        <span className="block">
          {city}, {state}
        </span>
      </address>
      <a
        href={googleMapsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-3 inline-block text-sm underline underline-offset-2 ${
          light
            ? "text-white decoration-white/40 hover:decoration-white"
            : "text-salmon-dark"
        }`}
      >
        Open in Google Maps
      </a>
      {showVisitNote ? (
        <p className={`mt-4 text-sm ${light ? "text-white/75" : "text-stone"}`}>
          {site.visitNote}
        </p>
      ) : null}
    </div>
  );
}
