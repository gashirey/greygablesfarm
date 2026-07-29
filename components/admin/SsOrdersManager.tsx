"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { FULFILLMENT_STATUS_LABELS, type FulfillmentStatus } from "@/lib/order/types";

type OrderRow = {
  id: string;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  address_street: string | null;
  address_city: string | null;
  address_zip: string | null;
  delivery_instructions: string | null;
  card_message: string | null;
  notes: string | null;
  fulfillment_type: string;
  fulfillment_date: string;
  total_cents: number;
  payment_status: string;
  fulfillment_status: FulfillmentStatus;
  ss_products: { name: string; slug: string } | null;
  ss_vessels: { name: string } | null;
};

const STATUS_OPTIONS = Object.keys(FULFILLMENT_STATUS_LABELS) as FulfillmentStatus[];

export function SsOrdersManager() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("paid");
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<OrderRow | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (payment) params.set("payment", payment);
    const res = await fetch(`/api/admin/ss/orders?${params}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load orders.");
      return;
    }
    setOrders(data.orders ?? []);
    setError("");
  }, [q, status, payment]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/ss/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", message: data.error ?? "Update failed." });
      return false;
    }
    return true;
  }

  async function advance(id: string, fulfillment_status: string) {
    if (!(await patch(id, { fulfillment_status }))) return;
    setNotice({ type: "success", message: "Status updated." });
    await load();
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const ok = await patch(editing.id, {
      buyer_name: editing.buyer_name,
      buyer_email: editing.buyer_email,
      buyer_phone: editing.buyer_phone,
      recipient_name: editing.recipient_name ?? "",
      recipient_phone: editing.recipient_phone ?? "",
      address_street: editing.address_street ?? "",
      address_city: editing.address_city ?? "",
      address_zip: editing.address_zip ?? "",
      delivery_instructions: editing.delivery_instructions ?? "",
      card_message: editing.card_message ?? "",
      notes: editing.notes ?? "",
      fulfillment_date: editing.fulfillment_date,
      fulfillment_status: editing.fulfillment_status,
    });
    setSaving(false);
    if (!ok) return;
    setNotice({ type: "success", message: "Order saved." });
    setEditing(null);
    await load();
  }

  if (error) return <p className="text-sm text-bark">{error}</p>;

  return (
    <div className="space-y-6">
      {notice ? (
        <AdminNotice
          type={notice.type}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      ) : null}
      <div>
        <h1 className="font-serif text-2xl text-bark">Orders</h1>
        <p className="mt-1 text-sm text-stone">
          Paid self-service orders. Edit details or advance fulfillment.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="input"
          placeholder="Search name, email, id"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="input"
          value={payment}
          onChange={(e) => setPayment(e.target.value)}
        >
          <option value="">All payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {FULFILLMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-3">
        {orders.map((o) => (
          <li
            key={o.id}
            className="space-y-2 border border-parchment bg-white p-4 text-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-bark">
                  {o.ss_products?.name ?? "Arrangement"} · $
                  {(o.total_cents / 100).toFixed(0)}
                </p>
                <p className="text-xs text-stone">
                  {o.buyer_name} · {o.buyer_email} · {o.fulfillment_type}{" "}
                  {o.fulfillment_date}
                  {o.ss_vessels ? ` · ${o.ss_vessels.name}` : ""}
                </p>
                <p className="mt-1 font-mono text-[10px] text-stone">{o.id}</p>
              </div>
              <p className="text-xs text-stone">
                {o.payment_status} ·{" "}
                {FULFILLMENT_STATUS_LABELS[o.fulfillment_status] ??
                  o.fulfillment_status}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs">
                Advance to
                <select
                  className="input py-1 text-xs"
                  defaultValue={o.fulfillment_status}
                  onChange={(e) => void advance(o.id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {FULFILLMENT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="text-xs underline"
                onClick={() => setEditing({ ...o })}
              >
                Edit details
              </button>
            </div>
          </li>
        ))}
      </ul>
      {!orders.length ? (
        <p className="text-sm text-stone">No orders match these filters.</p>
      ) : null}

      {editing ? (
        <div className="space-y-3 border border-parchment bg-white p-5">
          <h2 className="font-serif text-lg text-bark">Edit order</h2>
          <p className="font-mono text-[10px] text-stone">{editing.id}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["buyer_name", "Buyer name"],
                ["buyer_email", "Buyer email"],
                ["buyer_phone", "Buyer phone"],
                ["fulfillment_date", "Fulfillment date (YYYY-MM-DD)"],
                ["recipient_name", "Recipient name"],
                ["recipient_phone", "Recipient phone"],
                ["address_street", "Street"],
                ["address_city", "City"],
                ["address_zip", "ZIP"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm">
                {label}
                <input
                  className="input mt-1 w-full"
                  value={String(editing[key] ?? "")}
                  onChange={(e) =>
                    setEditing({ ...editing, [key]: e.target.value })
                  }
                />
              </label>
            ))}
          </div>
          <label className="block text-sm">
            Delivery instructions
            <textarea
              className="input mt-1 w-full"
              rows={2}
              value={editing.delivery_instructions ?? ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  delivery_instructions: e.target.value,
                })
              }
            />
          </label>
          <label className="block text-sm">
            Card message
            <textarea
              className="input mt-1 w-full"
              rows={2}
              value={editing.card_message ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, card_message: e.target.value })
              }
            />
          </label>
          <label className="block text-sm">
            Designer notes
            <textarea
              className="input mt-1 w-full"
              rows={2}
              value={editing.notes ?? ""}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Status
            <select
              className="input mt-1 w-full"
              value={editing.fulfillment_status}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  fulfillment_status: e.target.value as FulfillmentStatus,
                })
              }
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {FULFILLMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              className="btn border-bark bg-bark text-cream"
              disabled={saving}
              onClick={() => void saveEdit()}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
