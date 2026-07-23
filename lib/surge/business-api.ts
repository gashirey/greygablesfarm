import { getSurgeBusinessApiConfig } from "@/lib/surge/config";
import {
  previewExperienceDetail,
  previewExperienceList,
  previewPaymentProfile,
} from "@/lib/surge/preview";
import type {
  ExperiencePatch,
  OccurrencePatch,
  SurgeExperienceDetail,
  SurgeExperienceListItem,
  SurgePaymentProfile,
} from "@/lib/surge/types";

export type SurgeApiResult<T> =
  | { ok: true; data: T; preview: boolean }
  | { ok: false; error: string; status: number; preview: boolean };

async function surgeFetch(
  path: string,
  init?: RequestInit,
): Promise<{ res: Response; preview: false } | { preview: true }> {
  const { base, apiKey, configured } = getSurgeBusinessApiConfig();
  if (!configured || !base || !apiKey) {
    return { preview: true };
  }

  const res = await fetch(`${base}/api/business/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  return { res, preview: false };
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    if (data.error) return data.error;
  } catch {
    /* ignore */
  }
  return `Surge API error (${res.status})`;
}

export async function listExperiences(): Promise<
  SurgeApiResult<{ experiences: SurgeExperienceListItem[] }>
> {
  const result = await surgeFetch("/experiences");
  if (result.preview) {
    return {
      ok: true,
      preview: true,
      data: { experiences: previewExperienceList() },
    };
  }

  if (!result.res.ok) {
    return {
      ok: false,
      preview: false,
      status: result.res.status,
      error: await readError(result.res),
    };
  }

  const data = (await result.res.json()) as {
    experiences?: SurgeExperienceListItem[];
  };
  return {
    ok: true,
    preview: false,
    data: { experiences: data.experiences ?? [] },
  };
}

export async function getExperience(
  id: string,
): Promise<SurgeApiResult<{ experience: SurgeExperienceDetail }>> {
  const result = await surgeFetch(`/experiences/${encodeURIComponent(id)}`);
  if (result.preview) {
    const experience = previewExperienceDetail(id);
    if (!experience) {
      return {
        ok: false,
        preview: true,
        status: 404,
        error: "Experience not found in preview.",
      };
    }
    return { ok: true, preview: true, data: { experience } };
  }

  if (!result.res.ok) {
    return {
      ok: false,
      preview: false,
      status: result.res.status,
      error: await readError(result.res),
    };
  }

  const data = (await result.res.json()) as {
    experience?: SurgeExperienceDetail;
  };
  if (!data.experience) {
    return {
      ok: false,
      preview: false,
      status: 502,
      error: "Surge returned no experience.",
    };
  }
  return { ok: true, preview: false, data: { experience: data.experience } };
}

export async function patchExperience(
  id: string,
  patch: ExperiencePatch,
): Promise<SurgeApiResult<{ experience: SurgeExperienceDetail }>> {
  const result = await surgeFetch(`/experiences/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  if (result.preview) {
    return {
      ok: false,
      preview: true,
      status: 503,
      error:
        "Surge business API is not configured. Set SURGE_BUSINESS_API_BASE and SURGE_GREY_GABLES_API_KEY.",
    };
  }

  if (!result.res.ok) {
    return {
      ok: false,
      preview: false,
      status: result.res.status,
      error: await readError(result.res),
    };
  }

  const data = (await result.res.json()) as {
    experience?: SurgeExperienceDetail;
  };
  if (!data.experience) {
    return {
      ok: false,
      preview: false,
      status: 502,
      error: "Surge returned no experience.",
    };
  }
  return { ok: true, preview: false, data: { experience: data.experience } };
}

export async function getPaymentProfile(): Promise<
  SurgeApiResult<{ payment: SurgePaymentProfile }>
> {
  const result = await surgeFetch("/payment");
  if (result.preview) {
    return {
      ok: true,
      preview: true,
      data: { payment: previewPaymentProfile() },
    };
  }

  if (!result.res.ok) {
    return {
      ok: false,
      preview: false,
      status: result.res.status,
      error: await readError(result.res),
    };
  }

  const data = (await result.res.json()) as { payment?: SurgePaymentProfile };
  if (!data.payment) {
    return {
      ok: false,
      preview: false,
      status: 502,
      error: "Surge returned no payment profile.",
    };
  }
  return { ok: true, preview: false, data: { payment: data.payment } };
}

export async function createPaymentConnectLink(): Promise<
  SurgeApiResult<{ url: string }>
> {
  const siteBase =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.greygables.com";
  const returnUrl = `${siteBase}/admin/u-pick`;
  const result = await surgeFetch("/payment/connect", {
    method: "POST",
    body: JSON.stringify({
      return_url: returnUrl,
      refresh_url: returnUrl,
    }),
  });
  if (result.preview) {
    return {
      ok: false,
      preview: true,
      status: 503,
      error:
        "Surge business API is not configured. Stripe Connect onboarding will be available once the bridge is live.",
    };
  }

  if (!result.res.ok) {
    return {
      ok: false,
      preview: false,
      status: result.res.status,
      error: await readError(result.res),
    };
  }

  const data = (await result.res.json()) as { url?: string };
  if (!data.url) {
    return {
      ok: false,
      preview: false,
      status: 502,
      error: "Surge returned no Connect URL.",
    };
  }
  return { ok: true, preview: false, data: { url: data.url } };
}

export async function patchOccurrence(
  id: string,
  patch: OccurrencePatch,
): Promise<SurgeApiResult<{ occurrence: unknown }>> {
  const result = await surgeFetch(`/occurrences/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  if (result.preview) {
    return {
      ok: false,
      preview: true,
      status: 503,
      error:
        "Surge business API is not configured. Set SURGE_BUSINESS_API_BASE and SURGE_GREY_GABLES_API_KEY.",
    };
  }

  if (!result.res.ok) {
    return {
      ok: false,
      preview: false,
      status: result.res.status,
      error: await readError(result.res),
    };
  }

  const data = (await result.res.json()) as { occurrence?: unknown };
  return {
    ok: true,
    preview: false,
    data: { occurrence: data.occurrence },
  };
}
