"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { FULFILLMENT_STATUS_LABELS, type FulfillmentStatus } from "@/lib/order/types";

type OrderRow = {
  id: string;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
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

  async function advance(id: string, fulfillment_status: string) {
    const res = await fetch(`/api/admin/ss/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fulfillment_status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", message: data.error ?? "Update failed." });
      return;
    }
    setNotice({ type: "success", message: "Status updated." });
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
          Paid self-service orders. Advance fulfillment as work progresses.
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
          </li>
        ))}
      </ul>
      {!orders.length ? (
        <p className="text-sm text-stone">No orders match these filters.</p>
      ) : null}
    </div>
  );
}
