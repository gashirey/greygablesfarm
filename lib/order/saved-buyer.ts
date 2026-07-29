/** Browser-local saved buyer/recipient details for the order form. */

export const SAVED_BUYER_KEY = "gg_order_saved_buyer_v1";

export type SavedBuyerDetails = {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  recipientName?: string;
  recipientPhone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressZip?: string;
  remember: boolean;
};

export function loadSavedBuyerDetails(): SavedBuyerDetails | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAVED_BUYER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedBuyerDetails;
    if (!parsed?.remember) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveBuyerDetails(details: SavedBuyerDetails): void {
  if (typeof window === "undefined") return;
  if (!details.remember) {
    window.localStorage.removeItem(SAVED_BUYER_KEY);
    return;
  }
  window.localStorage.setItem(SAVED_BUYER_KEY, JSON.stringify(details));
}

export function clearSavedBuyerDetails(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SAVED_BUYER_KEY);
}
