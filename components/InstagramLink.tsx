import type { CSSProperties } from "react";
import { InstagramIcon } from "@/components/InstagramIcon";
import { social } from "@/lib/content";

type InstagramLinkProps = {
  className?: string;
  iconClassName?: string;
  /** Accessible label; defaults to “Instagram”. */
  label?: string;
  style?: CSSProperties;
};

/** Icon-only Instagram link — use sitewide instead of text “Instagram”. */
export function InstagramLink({
  className = "inline-flex text-salmon-dark transition-colors hover:text-salmon",
  iconClassName = "h-5 w-5",
  label = "Instagram",
  style,
}: InstagramLinkProps) {
  if (!social.instagram) return null;

  return (
    <a
      href={social.instagram}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={className}
      style={style}
    >
      <InstagramIcon className={iconClassName} />
    </a>
  );
}
