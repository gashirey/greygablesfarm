/** Heuristic bot / probe detection for visit logging. */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|pinterest|redditbot|applebot|semrush|ahrefs|bytespider|gptbot|claudebot|anthropic|petalbot|yandex|duckduckbot|ia_archiver|dotbot|mj12bot|baiduspider|sogou|exabot|facebot|ia_archiver|python-requests|go-http-client|wget|curl\/|libwww|scrapy|headless|phantomjs|selenium|puppeteer|playwright|httpclient|java\/|okhttp|axios\/|node-fetch|undici|ggf-track-probe/i.test(
    userAgent,
  );
}

/** Paths that look like exploit / scanner noise, not real pages. */
export function isNoisePathname(pathname: string): boolean {
  if (!pathname || pathname === "/") return false;
  if (pathname.includes("%5C") || pathname.includes("\\")) return true;
  if (pathname.includes("..")) return true;
  // Long random segment chains: /AbCdZ/EfGhZ/...
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 3 && parts.every((p) => /^[A-Za-z0-9_-]{4,12}$/.test(p))) {
    return true;
  }
  if (
    /\.(env|json|yml|yaml|php|asp|aspx|cgi|sql|bak|zip|tar|gz|npmrc|git|aws|config)$/i.test(
      pathname,
    )
  ) {
    return true;
  }
  if (
    /secrets?|wp-|wordpress|phpmyadmin|\.git|cgi-bin|xmlrpc|actuator|canary/i.test(
      pathname,
    )
  ) {
    return true;
  }
  return false;
}
