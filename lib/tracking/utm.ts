export type UtmParams = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

const emptyUtm: UtmParams = {
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  utmTerm: null,
};

function pick(
  params: Record<string, string> | null | undefined,
  key: string,
): string | null {
  const value = params?.[key]?.trim();
  return value ? value.slice(0, 200) : null;
}

export function utmFromSearchParams(
  params: Record<string, string> | null | undefined,
): UtmParams {
  if (!params) return emptyUtm;
  return {
    utmSource: pick(params, "utm_source"),
    utmMedium: pick(params, "utm_medium"),
    utmCampaign: pick(params, "utm_campaign"),
    utmContent: pick(params, "utm_content"),
    utmTerm: pick(params, "utm_term"),
  };
}
