import type { Metadata } from "next";

/** True for loopback / *.localhost (dev tabs). */
export function isLocalHost(host: string): boolean {
  const h = host.split(":")[0].toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".localhost");
}

export function resolveRequestHost(headersList: Headers): string {
  const direct = (headersList.get("host") ?? "").split(":")[0].toLowerCase();
  const forwarded =
    (headersList.get("x-forwarded-host") ?? "")
      .split(",")[0]
      ?.trim()
      .split(":")[0]
      .toLowerCase() ?? "";
  if (isLocalHost(direct)) return direct;
  return forwarded || direct;
}

export function withLocalTitle(
  title: { default: string; template: string },
  isLocal: boolean,
): { default: string; template: string } {
  if (!isLocal) return title;
  return {
    default: `[local] ${title.default}`,
    template: `[local] ${title.template}`,
  };
}

/** Prod icons at `/…`; local pack (hot badge) at `/local/…`. */
export function faviconMetadata(isLocal: boolean): Pick<Metadata, "icons" | "manifest"> {
  const base = isLocal ? "/local" : "";
  return {
    manifest: `${base}/site.webmanifest`,
    icons: {
      icon: [
        { url: `${base}/favicon.ico`, sizes: "48x48", type: "image/x-icon" },
        { url: `${base}/favicon-16x16.png`, sizes: "16x16", type: "image/png" },
        { url: `${base}/favicon-32x32.png`, sizes: "32x32", type: "image/png" },
        { url: `${base}/icon.png`, sizes: "32x32", type: "image/png" },
      ],
      apple: [
        {
          url: `${base}/apple-touch-icon.png`,
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
  };
}
