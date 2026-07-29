"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SsFulfillmentDate } from "@/lib/order/types";
import { formatCents, FULFILLMENT_STATUS_LABELS } from "@/lib/order/types";

type PublicOrder = {
  id: string;
  fulfillmentType: string;
  fulfillmentDate: string;
  pickupWindowId: string | null;
  paymentStatus: string;
  fulfillmentStatus: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  recipientName: string | null;
  recipientPhone: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  deliveryInstructions: string | null;
  cardMessage: string | null;
  notes: string | null;
  totalCents: number;
  product: { name: string; slug: string } | null;
  editable: boolean;
};

export function ManageOrderClient({ token }: { token: string }) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [availability, setAvailability] = useState<SsFulfillmentDate[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [cardMessage, setCardMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [fulfillmentDate, setFulfillmentDate] = useState("");
  const [pickupWindowId, setPickupWindowId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/order/manage?token=${encodeURIComponent(token)}`,
      );
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error ?? "Could not load order.");
        return;
      }
      const o = data.order as PublicOrder;
      setOrder(o);
      setAvailability(data.availability ?? []);
      setBuyerName(o.buyerName ?? "");
      setBuyerPhone(o.buyerPhone ?? "");
      setRecipientName(o.recipientName ?? "");
      setRecipientPhone(o.recipientPhone ?? "");
      setAddressStreet(o.addressStreet ?? "");
      setAddressCity(o.addressCity ?? "");
      setDeliveryInstructions(o.deliveryInstructions ?? "");
      setCardMessage(o.cardMessage ?? "");
      setNotes(o.notes ?? "");
      setFulfillmentDate(o.fulfillmentDate ?? "");
      setPickupWindowId(o.pickupWindowId);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const selectedDay = availability.find(
    (d) => d.fulfillmentDate === fulfillmentDate,
  );

  async function save() {
    if (!order?.editable) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/order/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          buyerName,
          buyerPhone,
          recipientName,
          recipientPhone,
          addressStreet,
          addressCity,
          deliveryInstructions,
          cardMessage,
          notes,
          fulfillmentDate,
          pickupWindowId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        setSaving(false);
        return;
      }
      setOrder(data.order);
      setNotice("Changes saved.");
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !order) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="type-page-title">Manage order</h1>
        <p className="mt-4 text-sm text-red-800">{error}</p>
        <Link href="/contact" className="btn btn-secondary mt-6 inline-block">
          Contact the farm
        </Link>
      </div>
    );
  }

  if (!order) {
    return <p className="text-sm text-stone">Loading your order…</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <header>
        <p className="type-eyebrow">Your order</p>
        <h1 className="type-page-title mt-2 leading-tight">
          {order.product?.name ?? "Arrangement"}
        </h1>
        <p className="mt-3 text-sm text-stone">
          {formatCents(order.totalCents)} · {order.fulfillmentType}{" "}
          {order.fulfillmentDate} · {order.paymentStatus} ·{" "}
          {FULFILLMENT_STATUS_LABELS[
            order.fulfillmentStatus as keyof typeof FULFILLMENT_STATUS_LABELS
          ] ?? order.fulfillmentStatus}
        </p>
        <p className="mt-1 font-mono text-[10px] text-stone">{order.id}</p>
      </header>

      {!order.editable ? (
        <p className="text-sm text-stone">
          This order is in progress and can no longer be edited online. Please{" "}
          <Link href="/contact" className="underline underline-offset-2">
            contact the farm
          </Link>{" "}
          if you need a change.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-stone">
            You can update contact details, card message, designer notes, and
            date while we&apos;re still preparing your order. Delivery ZIP and
            pricing cannot change after payment.
          </p>

          <label className="block text-sm">
            Your name
            <input
              className="input mt-1 w-full"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Your phone
            <input
              className="input mt-1 w-full"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
            />
          </label>
          <p className="text-xs text-stone">Email: {order.buyerEmail}</p>

          <label className="block text-sm">
            Fulfillment date
            <select
              className="input mt-1 w-full"
              value={fulfillmentDate}
              onChange={(e) => {
                setFulfillmentDate(e.target.value);
                setPickupWindowId(null);
              }}
            >
              {availability.map((d) => (
                <option key={d.id} value={d.fulfillmentDate}>
                  {d.fulfillmentDate}
                </option>
              ))}
              {!availability.some((d) => d.fulfillmentDate === fulfillmentDate) ? (
                <option value={fulfillmentDate}>{fulfillmentDate}</option>
              ) : null}
            </select>
          </label>

          {order.fulfillmentType === "pickup" ? (
            <label className="block text-sm">
              Pickup window
              <select
                className="input mt-1 w-full"
                value={pickupWindowId ?? ""}
                onChange={(e) => setPickupWindowId(e.target.value || null)}
              >
                <option value="">Select a window</option>
                {(selectedDay?.windows ?? []).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="block text-sm">
                Recipient name
                <input
                  className="input mt-1 w-full"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Recipient phone
                <input
                  className="input mt-1 w-full"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Street
                <input
                  className="input mt-1 w-full"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                City
                <input
                  className="input mt-1 w-full"
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                />
              </label>
              <p className="text-xs text-stone">
                ZIP {order.addressZip} (locked after payment)
              </p>
              <label className="block text-sm">
                Delivery instructions
                <textarea
                  className="input mt-1 w-full"
                  rows={2}
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                />
              </label>
            </>
          )}

          <label className="block text-sm">
            Card message
            <textarea
              className="input mt-1 w-full"
              rows={3}
              value={cardMessage}
              onChange={(e) => setCardMessage(e.target.value)}
              maxLength={250}
            />
          </label>
          <label className="block text-sm">
            Notes for our designer
            <textarea
              className="input mt-1 w-full"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          {error ? (
            <p className="text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? <p className="text-sm text-bark">{notice}</p> : null}

          <button
            type="button"
            className="btn border-bark bg-bark text-cream"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}

      <p className="text-sm text-stone">
        <Link href="/order" className="underline underline-offset-2">
          Order again
        </Link>
        {" · "}
        <Link href="/contact" className="underline underline-offset-2">
          Contact
        </Link>
      </p>
    </div>
  );
}
