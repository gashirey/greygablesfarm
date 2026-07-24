import type { Metadata } from "next";
import { headers } from "next/headers";
import { Fraunces, Karla } from "next/font/google";
import { site } from "@/lib/content";
import {
  faviconMetadata,
  isLocalHost,
  resolveRequestHost,
  withLocalTitle,
} from "@/lib/local-dev";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const host = resolveRequestHost(await headers());
  const local = isLocalHost(host);

  return {
    title: withLocalTitle(
      {
        default: site.name,
        template: `%s | ${site.name}`,
      },
      local,
    ),
    description: site.description,
    metadataBase: new URL(`https://${site.domain}`),
    ...faviconMetadata(local),
    openGraph: {
      title: local ? `[local] ${site.name}` : site.name,
      description: site.description,
      siteName: site.name,
      locale: "en_US",
      type: "website",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-parchment focus:bg-white focus:px-4 focus:py-2 focus:text-bark"
        >
          Skip to content
        </a>
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
