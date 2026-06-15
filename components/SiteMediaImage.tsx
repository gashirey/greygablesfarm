import Image from "next/image";
import { focalObjectPosition } from "@/lib/site-cms/focal";
import { aspectClassForRatio } from "@/lib/site-media/display-ratio";
import type { SiteMediaView } from "@/lib/site-media/slots";

type SiteMediaImageProps = {
  media: SiteMediaView;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

function isRemoteSrc(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function SiteMediaImage({
  media,
  priority = false,
  sizes = "100vw",
  className = "",
}: SiteMediaImageProps) {
  const aspectClass = aspectClassForRatio(media.displayRatio);

  if (aspectClass === null) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={media.imageUrl}
        alt={media.alt}
        className={`block h-auto w-full ${className}`.trim()}
        decoding="async"
      />
    );
  }

  return (
    <div className={`relative w-full overflow-hidden bg-parchment ${aspectClass} ${className}`.trim()}>
      <Image
        src={media.imageUrl}
        alt={media.alt}
        fill
        priority={priority}
        className="object-cover"
        style={{
          objectPosition: focalObjectPosition(media.focalX, media.focalY),
        }}
        sizes={sizes}
        unoptimized={isRemoteSrc(media.imageUrl)}
      />
    </div>
  );
}
