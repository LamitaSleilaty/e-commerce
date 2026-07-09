"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api, Order } from "../../../lib/api";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function load() {
    if (!token) return;
    setLoading(true);
    api
      .listAllOrders(token)
      .then(({ orders }) => setOrders(orders))
      .finally(() => setLoading(false));
  }

  useEffect(load, [token]);

  async function handleStatusChange(orderId: string, status: string) {
    if (!token) return;
    setUpdatingId(orderId);
    try {
      await api.updateOrderStatus(token, orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide mb-6">ALL ORDERS</h2>

      {loading ? (
        <p className="text-sm text-ink/50">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-ink/50">No orders yet.</p>
      ) : (
        <div className="divide-y divide-line border-y border-line">
          {orders.map((o) => (
            <div key={o.id} className="flex items-center gap-4 py-3 flex-wrap">
              <div className="min-w-[10rem]">
                <p className="text-sm font-medium">{o.orderNumber}</p>
                <p className="text-xs text-ink/50">
                  {o.user?.firstName} {o.user?.lastName} · {o.user?.email}
                </p>
              </div>
              <p className="text-xs text-ink/50 w-28">{new Date(o.createdAt).toLocaleDateString()}</p>
              <p className="font-semibold w-20">${Number(o.total).toFixed(2)}</p>
              <select
                value={o.status}
                disabled={updatingId === o.id}
                onChange={(e) => handleStatusChange(o.id, e.target.value)}
                className="border border-line rounded-lg px-2 py-1 text-xs bg-white outline-none focus:border-pink"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
