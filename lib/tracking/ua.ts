export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

export type ParsedUserAgent = {
  deviceType: DeviceType;
  browser: string | null;
  os: string | null;
};

/** Lightweight UA parsing — no third-party library. */
export function parseUserAgent(
  userAgent: string | null | undefined,
): ParsedUserAgent {
  if (!userAgent?.trim()) {
    return { deviceType: "unknown", browser: null, os: null };
  }
  const ua = userAgent;

  let deviceType: DeviceType = "desktop";
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    deviceType = "tablet";
  } else if (/Mobi|iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile/i.test(ua)) {
    deviceType = "mobile";
  }

  let browser: string | null = null;
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/CriOS\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua) || /FxiOS\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && /Version\//i.test(ua)) browser = "Safari";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";

  let os: string | null = null;
  if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  return { deviceType, browser, os };
}
